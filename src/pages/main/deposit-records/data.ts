export interface DepositRecordPreview {
    id: string
    address: string
    amount: string
    createdAt: string
    txId: string
}

// Static visual fixtures only; these are not account or API records.
export const DEPOSIT_RECORD_PREVIEWS: readonly DepositRecordPreview[] = Array.from({ length: 6 }, (_, index) => ({
    id: `deposit-preview-${index + 1}`,
    address: '示例地址',
    amount: '888.76',
    createdAt: '2025-08-26T12:24:00',
    txId: '示例交易哈希',
}))
