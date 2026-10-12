import { DAPP_ERROR_MESSAGE, getDappUserRejectionMessage, writeErc20Transfer } from '@/services/dapp/index.ts'
import { prepareUsdtRecharge } from '@/services/contracts/usdt.ts'

type DepositPhase = 'idle' | 'sending' | 'uncertain'
const phases = new Map<string, DepositPhase>()
const listeners = new Set<() => void>()

export function getDepositPhase(account: string): DepositPhase {
    return phases.get(account.toLowerCase()) ?? 'idle'
}
export function subscribeDeposit(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}
function setPhase(account: string, phase: DepositPhase) {
    phases.set(account.toLowerCase(), phase)
    listeners.forEach(listener => listener())
}

/** Keep pending/unknown writes across route changes; never automatically repeat a transfer. */
export async function depositUsdt(account: string, recipient: string, input: string): Promise<void> {
    if (getDepositPhase(account) !== 'idle') throw new Error('转账结果待确认，请检查钱包交易记录，勿重复转账')
    setPhase(account, 'sending')
    let writing = false
    try {
        const transfer = await prepareUsdtRecharge(account, recipient, input)
        writing = true
        await writeErc20Transfer(transfer.recipient, transfer.amount, transfer.token)
        setPhase(account, 'idle')
    } catch (error) {
        const rejected = getDappUserRejectionMessage(error) !== undefined
        const definiteFailure = error instanceof Error && [DAPP_ERROR_MESSAGE.contractReverted,
            DAPP_ERROR_MESSAGE.erc20BalanceInsufficient, DAPP_ERROR_MESSAGE.gasBalanceInsufficient].some(message => message === error.message)
        const uncertain = writing && !rejected && !definiteFailure
        setPhase(account, uncertain ? 'uncertain' : 'idle')
        if (uncertain) throw new Error('转账结果待确认，请检查钱包交易记录，勿重复转账', { cause: error })
        if (rejected) throw new Error('已取消钱包转账')
        throw error
    }
}
