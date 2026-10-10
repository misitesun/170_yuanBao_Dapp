import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DropletLoading } from '@/components/DropletLoading'
import { Empty } from '@/components/Empty'
import { PagePullRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { formatApiTime } from '@/features/api-fields.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { loadRechargeRecords } from '../funds-records/service.ts'
import { useFundsRecords } from '../funds-records/useFundsRecords.ts'
import './DepositRecordsPage.scss'

function DepositRecordsContent({ onError }: { onError: (error?: unknown) => void }) {
    const { t } = useTranslation()
    const { state, pagination } = useFundsRecords(loadRechargeRecords, null, onError)
    return (
        <div className="deposit-records-page min-vh-100">
            <SecondaryHeader title={t('充值记录')} />
            <main className="deposit-records-page__main">
                <section className="deposit-records-page__list flex flex-column" aria-label={t('充值记录列表')} aria-busy={state.isFirstLoading}>
                    {state.isFirstLoading ? <DropletLoading size="small" /> : state.items.map((record) => (
                        <article key={record.id} className="deposit-records-page__card">
                            <div className="deposit-records-page__card-heading flex items-center justify-between">
                                <h2 className="deposit-records-page__address size-28 bold-5">{maskWalletAddress(record.from)}</h2>
                                <strong className="deposit-records-page__amount size-28 bold-5">{record.amount} {t('余额')}</strong>
                            </div>
                            <div className="deposit-records-page__meta flex items-center justify-between size-24">
                                <time dateTime={record.createdAt.replace(' ', 'T')}>{formatApiTime(record.createdAt)}</time>
                                <span>{t('金额')}</span>
                            </div>
                            <p className="deposit-records-page__tx-id size-24">{t('交易哈希：{{hash}}', { hash: record.txId })}</p>
                        </article>
                    ))}
                    {!state.isFirstLoading && state.loadError ? (
                        <button className="auto-btn" type="button" onClick={() => void (state.items.length ? pagination.loadMore() : pagination.replace()).catch(onError)}>{t('重新加载')}</button>
                    ) : null}
                    {!state.isFirstLoading && !state.loadError && !state.items.length ? <Empty text={t('暂无充值记录')} /> : null}
                </section>
            </main>
        </div>
    )
}

export function DepositRecordsPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => {
        if (!wasHttpErrorReported(error)) showToast(t('充值记录加载失败，请重试'), 'error')
    }, [showToast, t])
    return <>
        <PagePullRefresh onError={onError}><DepositRecordsContent onError={onError} /></PagePullRefresh>
        <Toast message={message} variant={variant} />
    </>
}
