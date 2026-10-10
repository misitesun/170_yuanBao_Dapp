import { request } from '@/services/http/index.ts'
import { API_PAGE_SIZE, dateTime, decimal, integer, list, object, string } from '../api-fields.ts'
import { compareDecimalNumbers } from '@/shared/calculations/decimalNumbers.ts'

export interface TransferConfig { enabled: boolean; minimum: string; feePercent: string }
export interface TransferRecord { id: number; amount: string; fee: string; type: 1 | 2; address: string; createdAt: string }
export function parseTransferRecords(value: unknown): TransferRecord[] {
    return list(object(value).transfers).map(value => {
        const row = object(value)
        if (string(row.ccy) !== 'balance_bao' || (row.type !== 1 && row.type !== 2)) throw new Error('转账记录格式错误')
        const amount = decimal(row.amount)
        const fee = decimal(row.fee)
        if (compareDecimalNumbers(amount, '0') !== 1 || compareDecimalNumbers(fee, '0') === -1) throw new Error('转账记录金额格式错误')
        return { id: integer(row.id, 1), amount, fee, type: row.type, address: string(row.address), createdAt: dateTime(row.created_at) }
    })
}
/** Omit type to include both directions from the current user's perspective. */
export async function getTransferRecords(page: number, signal?: AbortSignal): Promise<TransferRecord[]> {
    return parseTransferRecords(await request<unknown>({ url: '/api/transfers',
        params: { page_no: integer(page, 1), page_size: API_PAGE_SIZE }, signal }))
}
export function parseTransferConfig(value: unknown): TransferConfig {
    const row = object(value)
    const minimum = decimal(row.member_transfer_bao_min)
    const feePercent = decimal(row.member_transfer_bao_fee)
    if (compareDecimalNumbers(minimum, '0') === -1 || compareDecimalNumbers(feePercent, '0') === -1) throw new Error('转账配置格式错误')
    return { enabled: string(row.member_transfer_switch) === '1', minimum, feePercent }
}
export async function getTransferConfig(signal?: AbortSignal): Promise<TransferConfig> {
    return parseTransferConfig(await request<unknown>({ url: '/api/transfers/config', signal }))
}
export function normalizeTransferAmount(value: string): string | null {
    const text = value.trim()
    if (!/^\d+(?:\.\d+)?$/.test(text)) return null
    const [whole, fraction] = text.split('.')
    const amount = fraction ? `${whole}.${fraction.slice(0, 6)}` : whole
    return compareDecimalNumbers(amount, '0') === 1 ? amount : null
}
export function isTransferAddress(value: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(value)
}
/** HTTP success is enough; no consumer requires the empty success body. */
export async function submitTransfer(address: string, amount: string): Promise<void> {
    const normalized = normalizeTransferAmount(amount)
    if (!isTransferAddress(address) || !normalized) throw new Error('转账参数格式错误')
    await request<unknown, { to_address: string; amount: string }>({
        url: '/api/transfers', method: 'POST', data: { to_address: address, amount: normalized },
    })
}
