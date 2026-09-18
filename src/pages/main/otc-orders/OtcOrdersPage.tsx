import { useCallback, useState } from 'react'

import { PagePullRefresh, usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { SegmentedTabs, type SegmentedTabOptions } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import {
    getMockOtcTradeOrderPage,
    type OtcOrderTab,
} from './pagination.ts'
import { OtcTradeOrderCard } from './components/OtcTradeOrderCard.tsx'

import './OtcOrdersPage.scss'

const MOCK_DELAY_MS = 420

const ORDER_TABS = [
    { value: 'buy', label: '挂买订单' },
    { value: 'sell', label: '挂卖订单' },
] as const satisfies SegmentedTabOptions<OtcOrderTab>

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

/** Static OTC buy/sell order fixtures with local tabs and pagination. */
export function OtcOrdersPage() {
    const [activeTab, setActiveTab] = useState<OtcOrderTab>('buy')
    const [page, setPage] = useState(1)
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()
    const currentPage = getMockOtcTradeOrderPage(activeTab, page)

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setPage(1)
    }, [])

    const loadNextPage = useCallback(async () => {
        await waitForMockData()
        setPage((current) => current + 1)
    }, [])

    function handleTabChange(nextTab: OtcOrderTab) {
        setActiveTab(nextTab)
        setPage(1)
    }

    usePageRefresh(refreshPage)
    usePageLoadMore(loadNextPage, { hasMore: currentPage.hasMore })

    return (
        <div className="otc-orders-page" data-page="otc-orders">
            <SecondaryHeader title="全部订单" />

            <main className="otc-orders-page__main">
                <SegmentedTabs
                    items={ORDER_TABS}
                    value={activeTab}
                    onChange={handleTabChange}
                    ariaLabel="OTC订单类型"
                    idPrefix="otc-orders"
                />

                <section
                    id={`otc-orders-${activeTab}-panel`}
                    role="tabpanel"
                    aria-labelledby={`otc-orders-${activeTab}-tab`}
                    className="otc-orders-page__list flex flex-column"
                >
                    {currentPage.items.map((order) => (
                        <OtcTradeOrderCard
                            key={order.id}
                            order={order}
                            showDetailAction={order.tab === 'buy'}
                            onDetail={() => pushRoute(ROUTE_PATH.otcBuyOrderDetail)}
                            onCancel={() => showToast('当前为静态演示，未撤销挂买单')}
                        />
                    ))}
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}

export function OtcOrdersPageWithRefresh() {
    return <PagePullRefresh><OtcOrdersPage /></PagePullRefresh>
}
