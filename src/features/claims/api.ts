import { request } from '@/services/http/index.ts'
import { decimal, integer, object, string } from '../api-fields.ts'
import { compareDecimalNumbers } from '@/shared/calculations/decimalNumbers.ts'

export interface ClaimConfig { enabled: boolean; minimum: string; feePercent: string }
export function parseClaimConfig(value: unknown): ClaimConfig {
    const row = object(value)
    const flag = string(row.withdraw_usdt_switch)
    const minimum = decimal(row.withdraw_usdt_min)
    const feePercent = decimal(row.withdraw_usdt_fee)
    if (compareDecimalNumbers(minimum, '0') === -1 || compareDecimalNumbers(feePercent, '0') === -1) throw new Error('提现配置格式错误')
    return { enabled: flag !== '' && flag !== '0', minimum, feePercent }
}
export async function getClaimConfig(signal?: AbortSignal): Promise<ClaimConfig> {
    return parseClaimConfig(await request<unknown>({ url: '/api/claims/config', signal }))
}
/** PHP truncates to six decimals before checking the minimum. No floating point conversion. */
export function normalizeClaimAmount(value: string): string | null {
    const text = value.trim()
    if (!/^\d+(?:\.\d+)?$/.test(text)) return null
    const [whole, fraction] = text.split('.')
    const amount = fraction ? `${whole}.${fraction.slice(0, 6)}` : whole
    return compareDecimalNumbers(amount, '0') === 1 ? amount : null
}
export interface ClaimPayload {
    id: number
    token: `0x${string}`
    amount: string
    signature: `0x${string}`
    expireTime: number
}
export class ClaimPayloadError extends Error {
    constructor() { super('提现申请已提交，领取参数异常，请联系平台处理') }
}
function isAddress(value: unknown): value is `0x${string}` {
    return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/.test(value)
}
function isSignature(value: unknown): value is `0x${string}` {
    return typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})+$/.test(value)
}
export function parseClaimPayload(value: unknown): ClaimPayload {
    try {
        const row = object(value)
        const id = integer(row.id, 1)
        const expireTime = integer(row.expire_time, 1)
        const amount = string(row.amount)
        if (!isAddress(row.token) || !isSignature(row.signature) || !/^\d+$/.test(amount)
            || BigInt(amount) <= 0n || BigInt(amount) >= 2n ** 256n) throw new ClaimPayloadError()
        return { id, token: row.token, amount, signature: row.signature, expireTime }
    } catch { throw new ClaimPayloadError() }
}
/** This response is now consumed by the contract call and must be validated. */
export async function submitClaim(amount: string): Promise<ClaimPayload> {
    const normalized = normalizeClaimAmount(amount)
    if (!normalized) throw new Error('请输入有效提现数量')
    return parseClaimPayload(await request<unknown, { ccy: 'balance_usdt'; amount: string }>({
        url: '/api/claims', method: 'POST', data: { ccy: 'balance_usdt', amount: normalized },
    }))
}
