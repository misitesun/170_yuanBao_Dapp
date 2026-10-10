import { request } from '@/services/http/index.ts'
import { API_PAGE_SIZE, dateTime, decimal, integer, list, object, string } from '../api-fields.ts'

export type ClaimRecordStatus = 1 | 2 | 3
export interface RechargeRecord { id: number; createdAt: string; amount: string; ccy: 'balance_usdt'; from: string; txId: string }
export interface ClaimRecord { id: number; createdAt: string; requestedAmount: string; amount: string; fee: string; ccy: 'balance_usdt'; status: ClaimRecordStatus }

function currency(value: unknown): 'balance_usdt' {
    if (value !== 'balance_usdt') throw new Error('记录币种格式错误')
    return value
}

export function parseRechargeRecords(value: unknown): RechargeRecord[] {
    return list(object(value).recharges).map(value => {
        const row = object(value)
        return { id: integer(row.id, 1), createdAt: dateTime(row.created_at), amount: decimal(row.amount), ccy: currency(row.ccy), from: string(row.from), txId: string(row.tx_id) }
    })
}

export function parseClaimRecords(value: unknown): ClaimRecord[] {
    return list(object(value).withdraws).map(value => {
        const row = object(value)
        const status = row.status
        if (status !== 1 && status !== 2 && status !== 3) throw new Error('提现记录状态格式错误')
        return { id: integer(row.id, 1), createdAt: dateTime(row.created_at), requestedAmount: decimal(row.tamount), amount: decimal(row.amount), fee: decimal(row.fee), ccy: currency(row.ccy), status }
    })
}

export async function getRechargeRecords(page: number, signal?: AbortSignal): Promise<RechargeRecord[]> {
    return parseRechargeRecords(await request<unknown>({
        url: '/api/recharges', method: 'GET', params: { page_no: integer(page, 1), page_size: API_PAGE_SIZE }, signal,
    }))
}

export async function getClaimRecords(status: ClaimRecordStatus, page: number, signal?: AbortSignal): Promise<ClaimRecord[]> {
    if (status !== 1 && status !== 2 && status !== 3) throw new Error('提现记录状态格式错误')
    return parseClaimRecords(await request<unknown>({
        url: '/api/claims', method: 'GET', params: { status, page_no: integer(page, 1), page_size: API_PAGE_SIZE }, signal,
    }))
}
