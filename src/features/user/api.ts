import { request } from '../../services/http/index.ts'
import { decimal, integer, object, string } from '../api-fields.ts'

export interface UserLevel { id: number; name: string; icon: string }
export interface CurrentUser {
    id: number
    address: string
    referralCode: string
    teamCount: number
    createdAt: string
    balances: { usdt: string; yuanqi: string; baoqi: string }
    level: UserLevel | null
}
export function parseLevel(value: unknown): UserLevel | null {
    if (value === null) return null
    const row = object(value)
    return { id: integer(row.id, 1), name: string(row.name), icon: string(row.icon) }
}
export function parseCurrentUser(value: unknown): CurrentUser {
    const row = object(value)
    const address = string(row.address)
    const referralCode = string(row.referral_code)
    if (!/^0x[0-9a-fA-F]{40}$/.test(address) || referralCode.length !== 8) throw new Error('用户身份数据格式错误')
    return {
        id: integer(row.id, 1), address, referralCode,
        // Informational database text is not an authentication prerequisite.
        teamCount: integer(row.team_count), createdAt: string(row.created_at),
        balances: { usdt: decimal(row.balance_usdt), yuanqi: decimal(row.balance_energy), baoqi: decimal(row.balance_bao) },
        level: parseLevel(row.level),
    }
}
/** Account-bound verification can share its login attempt's address and cancellation signal. */
export async function getCurrentUser(authentication?: 'bearer', options: { signal?: AbortSignal; walletAddress?: string } = {}): Promise<CurrentUser> {
    return parseCurrentUser(await request<unknown>({ url: '/api/users/my', authentication, ...options }))
}

export function parseRechargeAddress(value: unknown): string {
    const address = string(object(value).recharge_address)
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('充值地址格式错误')
    return address
}

export async function getRechargeAddress(signal?: AbortSignal): Promise<string> {
    return parseRechargeAddress(await request<unknown>({ url: '/api/users/my/recharge_address', signal }))
}
