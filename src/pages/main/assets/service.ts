import { ASSET_CCY, getBalanceLogs, type AssetType } from '@/features/assets/api.ts'
import { API_PAGE_SIZE } from '@/features/api-fields.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { getTransferRecords } from '@/features/transfers/api.ts'
import type { ListPage } from '../pagination/pagination.ts'

export type { AssetType }
export type AssetQuery = AssetType | 'transfers'
export interface AssetRecord { id: number; amount: string; tone: 'expense' | 'income'; content: string; createdAt: string; transfer?: { address: string; fee: string } }
export type AssetsOverview = Record<AssetType, string>
export const ASSET_TYPES = ASSET_CCY

export async function loadAssetsPage(query: AssetQuery, page: number): Promise<ListPage<AssetRecord, AssetsOverview>> {
    if (query === 'transfers') {
        const [rows, user] = await Promise.all([getTransferRecords(page), page === 1 ? refreshCurrentUser() : Promise.resolve(null)])
        return {
            items: rows.map(row => ({ id: row.id, amount: `${row.type === 1 ? '-' : '+'}${row.amount}`,
                tone: row.type === 1 ? 'expense' : 'income', content: row.type === 1 ? '转出' : '转入', createdAt: row.createdAt,
                transfer: { address: row.address, fee: row.fee } })),
            hasMore: rows.length === API_PAGE_SIZE,
            ...(user ? { overview: user.balances } : {}),
        }
    }
    const [rows, user] = await Promise.all([getBalanceLogs(query, page), page === 1 ? refreshCurrentUser() : Promise.resolve(null)])
    return {
        items: rows.map((row) => ({ id: row.id, amount: `${row.isInc ? '+' : '-'}${row.amount.replace(/^-/, '')}`,
            tone: row.isInc ? 'income' : 'expense', content: row.content, createdAt: row.createdAt })),
        hasMore: rows.length === API_PAGE_SIZE,
        ...(user ? { overview: user.balances } : {}),
    }
}
