import { useCallback, useState } from 'react'

import { PagePullRefresh, usePageRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { SegmentedTabs, type SegmentedTabOptions } from '@/components/SegmentedTabs'

import {
    getMockWithdrawalRecords,
    type MockWithdrawalRecord,
    type WithdrawalRecordStatus,
} from './data.ts'

import './UserWithdrawRecordsPage.scss'

const MOCK_DELAY_MS = 420

const STATUS_TABS = [
    { value: 'pending', label: '审核中' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
] as const satisfies SegmentedTabOptions<WithdrawalRecordStatus>

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

function toDateTime(value: string): string {
    return value.replaceAll('.', '-').replace(' ', 'T')
}

function WithdrawalRecordCard({ record }: { record: MockWithdrawalRecord }) {
    const isRejected = record.status === 'rejected'

    return (
        <article className={`user-withdraw-records-page__card${isRejected ? ' user-withdraw-records-page__card--rejected' : ''}`}>
            <div className="user-withdraw-records-page__card-heading flex items-center justify-between">
                <h2 className="user-withdraw-records-page__note size-28 bold-5">{record.note}</h2>
                <strong className="user-withdraw-records-page__amount size-28 bold-5">{record.amount}</strong>
            </div>
            <div className="user-withdraw-records-page__meta flex items-center justify-between size-24">
                <time dateTime={toDateTime(record.createdAt)}>{record.createdAt}</time>
                <span>金额</span>
            </div>
            {record.rejectionReason ? (
                <p className="user-withdraw-records-page__reason size-24">
                    驳回原因：{record.rejectionReason}
                </p>
            ) : null}
        </article>
    )
}

/** Static extraction records with local status tabs and mock pull refresh. */
export function UserWithdrawRecordsPage() {
    const [status, setStatus] = useState<WithdrawalRecordStatus>('pending')
    const [records, setRecords] = useState(() => getMockWithdrawalRecords('pending'))

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setRecords(getMockWithdrawalRecords(status))
    }, [status])

    function handleStatusChange(nextStatus: WithdrawalRecordStatus) {
        setStatus(nextStatus)
        setRecords(getMockWithdrawalRecords(nextStatus))
    }

    usePageRefresh(refreshPage)

    return (
        <div className="user-withdraw-records-page" data-page="user-withdraw-records">
            <SecondaryHeader title="提取记录" />

            <main className="user-withdraw-records-page__main">
                <SegmentedTabs
                    className="user-withdraw-records-page__tabs"
                    items={STATUS_TABS}
                    value={status}
                    onChange={handleStatusChange}
                    ariaLabel="提取记录状态"
                    idPrefix="user-withdraw-records"
                />

                <section
                    id={`user-withdraw-records-${status}-panel`}
                    role="tabpanel"
                    aria-labelledby={`user-withdraw-records-${status}-tab`}
                    className="user-withdraw-records-page__list flex flex-column"
                >
                    {records.map((record) => (
                        <WithdrawalRecordCard key={record.id} record={record} />
                    ))}
                </section>
            </main>
        </div>
    )
}

export function UserWithdrawRecordsPageWithRefresh() {
    return <PagePullRefresh><UserWithdrawRecordsPage /></PagePullRefresh>
}
