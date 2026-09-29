import { ASSET_CCY, getBalanceLogs, type AssetType } from '@/features/assets/api.ts'
import { API_PAGE_SIZE } from '@/features/api-fields.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import type { ListPage } from '../pagination/pagination.ts'

export type { AssetType }
export interface AssetRecord { id: number; amount: string; tone: 'expense' | 'income'; content: string; createdAt: string }
export type AssetsOverview = Record<AssetType, string>
export const ASSET_TYPES = ASSET_CCY

export async function loadAssetsPage(query: AssetType, page: number): Promise<ListPage<AssetRecord, AssetsOverview>> {
    const [rows, user] = await Promise.all([getBalanceLogs(query, page), page === 1 ? refreshCurrentUser() : Promise.resolve(null)])
    return {
        items: rows.map((row) => ({ id: row.id, amount: `${row.isInc ? '+' : '-'}${row.amount.replace(/^-/, '')}`,
            tone: row.isInc ? 'income' : 'expense', content: row.content, createdAt: row.createdAt })),
        hasMore: rows.length === API_PAGE_SIZE,
        ...(user ? { overview: user.balances } : {}),
    }
}
