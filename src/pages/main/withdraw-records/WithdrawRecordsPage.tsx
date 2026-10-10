import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DropletLoading } from '@/components/DropletLoading'
import { Empty } from '@/components/Empty'
import { PagePullRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'
import { formatApiTime } from '@/features/api-fields.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { loadClaimRecords, type ClaimRecordsQuery } from '../funds-records/service.ts'
import { useFundsRecords } from '../funds-records/useFundsRecords.ts'
import './WithdrawRecordsPage.scss'

function WithdrawRecordsContent({ onError }: { onError: (error?: unknown) => void }) {
    const { t } = useTranslation()
    const tabs = [
        { value: 'pending', label: t('提币中') },
        { value: 'succeeded', label: t('成功') },
        { value: 'failed', label: t('失败') },
    ] as const
    const { state, pagination } = useFundsRecords(loadClaimRecords, 'pending' as ClaimRecordsQuery, onError)
    const status = state.query
    return (
        <div className="withdraw-records-page min-vh-100">
            <SecondaryHeader title={t('提现记录')} />
            <main className="withdraw-records-page__main">
                <SegmentedTabs<ClaimRecordsQuery>
                    className="withdraw-records-page__tabs" items={tabs} value={status}
                    onChange={(value) => { if (value !== status) void pagination.replace(value).catch(onError) }}
                    ariaLabel={t('提现记录状态')} idPrefix="withdraw-records"
                />
                <section id={`withdraw-records-${status}-panel`} role="tabpanel"
                    aria-labelledby={`withdraw-records-${status}-tab`}
                    className="withdraw-records-page__list flex flex-column" aria-busy={state.isFirstLoading}>
                    {state.isFirstLoading ? <DropletLoading size="small" /> : state.items.map((record) => (
                        <article key={record.id} className="withdraw-records-page__card">
                            <div className="withdraw-records-page__card-heading flex items-center justify-between">
                                <h2 className="withdraw-records-page__note size-28 bold-5">{t('申请金额')}</h2>
                                <strong className="withdraw-records-page__amount size-28 bold-5">{record.requestedAmount} {t('余额')}</strong>
                            </div>
                            <div className="withdraw-records-page__meta flex items-center justify-between size-24">
                                <span>{t('到账金额')}</span><span>{record.amount} {t('余额')}</span>
                            </div>
                            <div className="withdraw-records-page__meta flex items-center justify-between size-24">
                                <span>{t('手续费')}</span><span>{record.fee} {t('余额')}</span>
                            </div>
                            <p className="withdraw-records-page__meta size-24">
                                <time dateTime={record.createdAt.replace(' ', 'T')}>{formatApiTime(record.createdAt)}</time>
                            </p>
                        </article>
                    ))}
                    {!state.isFirstLoading && state.loadError ? (
                        <button className="auto-btn" type="button" onClick={() => void (state.items.length ? pagination.loadMore() : pagination.replace()).catch(onError)}>{t('重新加载')}</button>
                    ) : null}
                    {!state.isFirstLoading && !state.loadError && !state.items.length ? <Empty text={t('暂无提现记录')} /> : null}
                </section>
            </main>
        </div>
    )
}

export function WithdrawRecordsPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => {
        if (!wasHttpErrorReported(error)) showToast(t('提现记录加载失败，请重试'), 'error')
    }, [showToast, t])
    return <>
        <PagePullRefresh onError={onError}><WithdrawRecordsContent onError={onError} /></PagePullRefresh>
        <Toast message={message} variant={variant} />
    </>
}
