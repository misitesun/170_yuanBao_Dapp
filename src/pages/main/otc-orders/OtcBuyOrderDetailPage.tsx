import { useCallback, useState } from 'react'

import { PagePullRefresh, usePageRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'

import { OtcTradeOrderCard } from './components/OtcTradeOrderCard.tsx'
import { getMockOtcBuyOrderDetail } from './detailData.ts'

import './OtcBuyOrderDetailPage.scss'

const MOCK_DELAY_MS = 420

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

/** Static buy-order detail and completed trade fixtures; no API or wallet integration. */
export function OtcBuyOrderDetailPage() {
    const [detail, setDetail] = useState(getMockOtcBuyOrderDetail)
    const { message, showToast } = useToast()

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setDetail(getMockOtcBuyOrderDetail())
    }, [])

    usePageRefresh(refreshPage)

    const summaryRows = [
        ['委托单号', detail.orderNumber],
        ['交易数量(HU)', detail.quantity],
        ['交易单价(USDT)', detail.unitPrice],
        ['交易总额(USDT)', detail.total],
        ['已交易数量(HU)', detail.tradedQuantity],
        ['已交易总额(USDT)', detail.tradedTotal],
    ] as const

    return (
        <div className="otc-buy-order-detail-page" data-page="otc-buy-order-detail">
            <SecondaryHeader title="订单详情" />

            <main className="otc-buy-order-detail-page__main">
                <dl className="otc-buy-order-detail-page__summary flex flex-column size-26">
                    {summaryRows.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between">
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>

                <section className="otc-buy-order-detail-page__trades flex flex-column" aria-label="已完成交易记录">
                    {detail.trades.map((trade, index) => (
                        <OtcTradeOrderCard
                            key={trade.id}
                            order={trade}
                            showDetailAction={index > 0}
                            onDetail={() => showToast('成交记录详情当前为静态演示')}
                        />
                    ))}
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}

export function OtcBuyOrderDetailPageWithRefresh() {
    return <PagePullRefresh><OtcBuyOrderDetailPage /></PagePullRefresh>
}
