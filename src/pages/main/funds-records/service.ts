import { API_PAGE_SIZE } from '@/features/api-fields.ts'
import { getClaimRecords, getRechargeRecords } from '@/features/funds-records/api.ts'

export async function loadRechargeRecords(_query: null, page: number, signal: AbortSignal) {
    const items = await getRechargeRecords(page, signal)
    return { items, hasMore: items.length === API_PAGE_SIZE }
}

export type ClaimRecordsQuery = 'pending' | 'succeeded' | 'failed'
const CLAIM_STATUS = { pending: 1, succeeded: 2, failed: 3 } as const

export async function loadClaimRecords(status: ClaimRecordsQuery, page: number, signal: AbortSignal) {
    const items = await getClaimRecords(CLAIM_STATUS[status], page, signal)
    return { items, hasMore: items.length === API_PAGE_SIZE }
}
