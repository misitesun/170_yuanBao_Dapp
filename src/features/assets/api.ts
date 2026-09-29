import { request } from '../../services/http/index.ts'
import { API_PAGE_SIZE, boolean, dateTime, decimal, integer, list, object, string } from '../api-fields.ts'

export const ASSET_CCY = { usdt: 'balance_usdt', yuanqi: 'balance_energy', baoqi: 'balance_bao' } as const
export type AssetType = keyof typeof ASSET_CCY
export interface BalanceLog { id: number; amount: string; isInc: boolean; ccy: string; content: string; createdAt: string }
export function parseBalanceLogs(value: unknown): BalanceLog[] {
    return list(object(value).balance_logs).map((value) => {
        const row = object(value)
        const ccy = string(row.ccy)
        if (!Object.values(ASSET_CCY).some((item) => item === ccy)) throw new Error('未知流水币种')
        return { id: integer(row.id, 1), amount: decimal(row.amount), isInc: boolean(row.is_inc),
            ccy, content: string(row.content), createdAt: dateTime(row.created_at) }
    })
}
export async function getBalanceLogs(asset: AssetType, page: number): Promise<BalanceLog[]> {
    return parseBalanceLogs(await request<unknown>({ url: '/api/balance_logs',
        params: { page_no: page, page_size: API_PAGE_SIZE, ccy: ASSET_CCY[asset] } }))
}
