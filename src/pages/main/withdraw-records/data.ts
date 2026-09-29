export type WithdrawalRecordStatus = 'pending' | 'approved' | 'rejected'

export interface WithdrawalRecordPreview {
    id: string
    address: string
    amount: string
    createdAt: string
    rejectionReason?: string
}

function createPreviews(status: WithdrawalRecordStatus, count: number): readonly WithdrawalRecordPreview[] {
    return Array.from({ length: count }, (_, index) => ({
        id: `${status}-withdraw-preview-${index + 1}`,
        address: '示例地址',
        amount: '888.76',
        createdAt: '2025-08-26T12:24:00',
        rejectionReason: status === 'rejected' ? '账户异常' : undefined,
    }))
}

// Preserve the source project's static preview counts without importing its API.
export const WITHDRAW_RECORD_PREVIEWS: Readonly<Record<WithdrawalRecordStatus, readonly WithdrawalRecordPreview[]>> = {
    pending: createPreviews('pending', 9),
    approved: createPreviews('approved', 9),
    rejected: createPreviews('rejected', 5),
}
