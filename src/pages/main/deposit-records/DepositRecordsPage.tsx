import { useTranslation } from 'react-i18next'
import { Empty } from '@/components/Empty'
import { SecondaryHeader } from '@/components/SecondaryHeader'

import { DEPOSIT_RECORD_PREVIEWS, type DepositRecordPreview } from './data'
import './DepositRecordsPage.scss'

export function DepositRecordsPage({ records = DEPOSIT_RECORD_PREVIEWS }: { records?: readonly DepositRecordPreview[] }) {
    const { t } = useTranslation()
    return (
        <div className="deposit-records-page min-vh-100">
            <SecondaryHeader title={t("充值记录")} right={<span className="deposit-records-page__demo">{t("静态示例")}</span>} />
            <main className="deposit-records-page__main">
                <section className="deposit-records-page__list flex flex-column" aria-label={t("充值记录列表")}>
                    {records.length ? records.map((record) => (
                        <article key={record.id} className="deposit-records-page__card">
                            <div className="deposit-records-page__card-heading flex items-center justify-between">
                                <h2 className="deposit-records-page__address size-28 bold-5">{record.address === '示例地址' ? t('示例地址') : record.address}</h2>
                                <strong className="deposit-records-page__amount size-28 bold-5">{record.amount} USDT</strong>
                            </div>
                            <div className="deposit-records-page__meta flex items-center justify-between size-24">
                                <time dateTime={record.createdAt}>{record.createdAt.slice(0, 10).replaceAll('-', '.')} {record.createdAt.slice(11, 16)}</time>
                                <span>{t("金额")}</span>
                            </div>
                            <p className="deposit-records-page__tx-id size-24">{t('交易哈希：{{hash}}', { hash: record.txId === '示例交易哈希' ? t('示例交易哈希') : record.txId })}</p>
                        </article>
                    )) : <Empty text={t("暂无充值记录")} />}
                </section>
            </main>
        </div>
    )
}
