import { DAPP_ERROR_MESSAGE, getAuthorizedDappAddress, getDappUserRejectionMessage } from '@/services/dapp/index.ts'
import { assertYbProjectNetwork, isYbProjectWithdrawalUsed, withdrawYbProject } from '@/services/contracts/index.ts'
import { ClaimPayloadError, submitClaim, type ClaimPayload } from './api.ts'

export interface ClaimProgress {
    phase: 'idle' | 'requesting' | 'ready' | 'sending' | 'checking' | 'complete' | 'expired' | 'blocked' | 'uncertain'
    payload?: ClaimPayload
    message?: string
}
const idle: ClaimProgress = { phase: 'idle' }
// Retain signed orders across route changes, without persisting signatures to browser storage.
const progressByAccount = new Map<string, ClaimProgress>()
const listeners = new Set<() => void>()
export function getClaimProgress(account: string): ClaimProgress {
    return progressByAccount.get(account.toLowerCase()) ?? idle
}
export function subscribeClaimProgress(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}
export function startNewClaim(account: string) {
    if (getClaimProgress(account).phase === 'complete') update(account, idle)
}
function update(account: string, progress: ClaimProgress) {
    progressByAccount.set(account.toLowerCase(), progress)
    listeners.forEach(listener => listener())
}
async function preflight(account: string) {
    const authorized = await getAuthorizedDappAddress()
    if (!account || authorized?.toLowerCase() !== account.toLowerCase()) throw new Error('钱包账户已变化，请重新登录')
    await assertYbProjectNetwork()
}
function isDefiniteRequestFailure(error: unknown) {
    return error instanceof Error && 'status' in error && typeof error.status === 'number'
        && error.status >= 400 && error.status < 600
}

export async function executeClaim(account: string, amount: string): Promise<void> {
    const previous = getClaimProgress(account)
    if (['requesting', 'sending', 'checking', 'complete', 'blocked'].includes(previous.phase)) return
    let payload = previous.payload
    update(account, { ...previous, phase: payload ? 'checking' : 'requesting', message: undefined })
    try {
        await preflight(account)
    } catch (error) {
        update(account, { ...previous, message: undefined })
        throw error
    }
    if (!payload) {
        try {
            payload = await submitClaim(amount)
            update(account, { phase: 'checking', payload })
        } catch (error) {
            const blocked = error instanceof ClaimPayloadError || !isDefiniteRequestFailure(error)
            update(account, blocked ? { phase: 'blocked', message: error instanceof ClaimPayloadError
                ? '提现申请已提交，领取参数异常，请联系平台处理'
                : '提现申请结果待确认，请联系平台核对，勿重复申请' } : idle)
            throw error
        }
    }
    try {
        await preflight(account)
        if (await isYbProjectWithdrawalUsed(BigInt(payload.id))) {
            update(account, { phase: 'complete', payload })
            return
        }
        if (previous.phase === 'uncertain') {
            update(account, { phase: 'uncertain', payload, message: '链上结果待确认，请检查钱包交易记录，勿重复申请' })
            return
        }
        if (payload.expireTime <= Math.floor(Date.now() / 1000)) {
            update(account, { phase: 'expired', payload, message: '领取签名已过期，请联系平台处理，勿重复申请' })
            return
        }
    } catch (error) {
        update(account, { ...previous, phase: previous.phase === 'uncertain' ? 'uncertain' : 'ready', payload, message: undefined })
        throw error
    }
    update(account, { phase: 'sending', payload })
    try {
        await preflight(account)
    } catch (error) {
        update(account, { phase: 'ready', payload })
        throw error
    }
    try {
        await withdrawYbProject({ id: BigInt(payload.id), token: payload.token, amount: BigInt(payload.amount),
            deadline: BigInt(payload.expireTime), signature: payload.signature })
        update(account, { phase: 'complete', payload })
    } catch (error) {
        const rejected = getDappUserRejectionMessage(error) !== undefined
        const reverted = error instanceof Error && error.message === DAPP_ERROR_MESSAGE.contractReverted
        update(account, { phase: rejected || reverted ? 'ready' : 'uncertain', payload,
            message: rejected ? '已取消钱包确认，可继续领取'
                : reverted ? '链上交易失败，可重试领取'
                    : '链上结果待确认，请检查钱包交易记录，勿重复申请' })
        throw error
    }
}
