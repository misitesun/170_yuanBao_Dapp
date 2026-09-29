import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { ActionButton } from '@/components/ActionButton'
import { Empty } from '@/components/Empty'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { SegmentedTabs, type SegmentedTabOptions } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'

import { WITHDRAW_RECORD_PREVIEWS, type WithdrawalRecordPreview, type WithdrawalRecordStatus } from './data'
import './WithdrawRecordsPage.scss'


export function WithdrawRecordsPage({ recordsByStatus = WITHDRAW_RECORD_PREVIEWS }: {
    recordsByStatus?: Readonly<Record<WithdrawalRecordStatus, readonly WithdrawalRecordPreview[]>>
}) {
    const { t } = useTranslation()
    const STATUS_TABS = [
        { value: 'pending', label: t('审核中') },
        { value: 'approved', label: t('已通过') },
        { value: 'rejected', label: t('未通过') },
    ] as const satisfies SegmentedTabOptions<WithdrawalRecordStatus>
    const [status, setStatus] = useState<WithdrawalRecordStatus>('pending')
    const { message, variant, showToast } = useToast()
    const records = recordsByStatus[status]

    return (
        <div className="withdraw-records-page min-vh-100">
            <SecondaryHeader title={t("提现记录")} right={<span className="withdraw-records-page__demo">{t("静态示例")}</span>} />
            <main className="withdraw-records-page__main">
                <SegmentedTabs
                    className="withdraw-records-page__tabs"
                    items={STATUS_TABS}
                    value={status}
                    onChange={setStatus}
                    ariaLabel={t("提现记录状态")}
                    idPrefix="withdraw-records"
                />
                <section
                    id={`withdraw-records-${status}-panel`}
                    role="tabpanel"
                    aria-labelledby={`withdraw-records-${status}-tab`}
                    className="withdraw-records-page__list flex flex-column"
                >
                    {records.length ? records.map((record) => (
                        <article key={record.id} className={`withdraw-records-page__card${status === 'rejected' ? ' withdraw-records-page__card--rejected' : ''}`}>
                            <div className="withdraw-records-page__card-heading flex items-center justify-between">
                                <h2 className="withdraw-records-page__note size-28 bold-5">{record.address === '示例地址' ? t('示例地址') : record.address}</h2>
                                <strong className="withdraw-records-page__amount size-28 bold-5">{record.amount} USDT</strong>
                            </div>
                            <div className="withdraw-records-page__meta flex items-center justify-between size-24">
                                <time dateTime={record.createdAt}>{record.createdAt.slice(0, 10).replaceAll('-', '.')} {record.createdAt.slice(11, 16)}</time>
                                <span>{t("金额")}</span>
                            </div>
                            {status === 'rejected' ? <p className="withdraw-records-page__reason size-24">{t('驳回原因：{{reason}}', { reason: record.rejectionReason === '账户异常' ? t('账户异常') : record.rejectionReason ?? '--' })}</p> : null}
                            {status === 'pending' ? (
                                <ActionButton size="small" variant="soft" className="withdraw-records-page__cancel"
                                    onClick={() => showToast(t("取消提现功能待接入"))}>{t("取消提现")}</ActionButton>
                            ) : null}
                        </article>
                    )) : <Empty text={t("暂无提现记录")} />}
                </section>
            </main>
            <Toast message={message} variant={variant} />
        </div>
    )
}
