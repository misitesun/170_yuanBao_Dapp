export type WithdrawalRecordStatus = 'pending' | 'approved' | 'rejected'

export interface MockWithdrawalRecord {
    id: string
    note: string
    amount: string
    createdAt: string
    status: WithdrawalRecordStatus
    rejectionReason?: string
}

const STATUS_RECORD_COUNTS: Readonly<Record<WithdrawalRecordStatus, number>> = {
    pending: 9,
    approved: 9,
    rejected: 5,
}

function createMockWithdrawalRecords(status: WithdrawalRecordStatus): readonly MockWithdrawalRecord[] {
    return Array.from({ length: STATUS_RECORD_COUNTS[status] }, (_, index) => ({
        id: `${status}-withdrawal-record-${index + 1}`,
        note: '备注备注',
        amount: '888.76 USDT',
        createdAt: '2025.08.26 12:24',
        status,
        rejectionReason: status === 'rejected' ? '账户异常' : undefined,
    }))
}

export const MOCK_WITHDRAWAL_RECORDS: Readonly<
Record<WithdrawalRecordStatus, readonly MockWithdrawalRecord[]>
> = {
    pending: createMockWithdrawalRecords('pending'),
    approved: createMockWithdrawalRecords('approved'),
    rejected: createMockWithdrawalRecords('rejected'),
}

export function getMockWithdrawalRecords(
    status: WithdrawalRecordStatus,
): readonly MockWithdrawalRecord[] {
    return MOCK_WITHDRAWAL_RECORDS[status]
}
