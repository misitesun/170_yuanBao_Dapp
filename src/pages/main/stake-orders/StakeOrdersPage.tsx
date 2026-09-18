import { useCallback, useState } from 'react'

import huIcon from '@/assets/stake/hu.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import { ActionButton } from '@/components/ActionButton'
import { PagePullRefresh, usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { SegmentedTabs, type SegmentedTabOptions } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'

import {
    getMockStakeOrderPage,
    type MockStakeOrder,
    type StakeOrderStatus,
} from './pagination.ts'

import './StakeOrdersPage.scss'

const MOCK_DELAY_MS = 420

const STATUS_TABS = [
    { value: 'staking', label: '质押中' },
    { value: 'redeemed', label: '已赎回' },
    { value: 'converted', label: '已转化' },
] as const satisfies SegmentedTabOptions<StakeOrderStatus>

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

function StakeOrderCard({ order, onAction }: {
    order: MockStakeOrder
    onAction: (message: string) => void
}) {
    const assetIcon = order.asset === 'USDT' ? usdtIcon : huIcon

    return (
        <article className="stake-orders-page__card flex flex-column">
            <div className="stake-orders-page__meta flex items-center justify-between size-24">
                <span>质押金额</span>
                <time dateTime={order.createdAt.replace('/', '-').replace('/', '-').replace(' ', 'T')}>{order.createdAt}</time>
            </div>

            <div className="stake-orders-page__amount flex items-center bold-5">
                <img src={assetIcon} alt={order.asset} />
                <span>{order.amount}</span>
            </div>
            {order.equivalent ? <p className="stake-orders-page__equivalent size-24">{order.equivalent}</p> : null}

            <div className="stake-orders-page__details flex flex-column size-24">
                {order.power ? (
                    <p className="stake-orders-page__detail-row flex items-center justify-between">
                        <span>获得算力</span>
                        <strong>{order.power}</strong>
                    </p>
                ) : null}
                {order.extraConversionPower ? (
                    <p className="stake-orders-page__detail-row flex items-center justify-between">
                        <span>额外转化算力</span>
                        <strong className="stake-orders-page__accent-value">{order.extraConversionPower}</strong>
                    </p>
                ) : null}
                {order.fee ? (
                    <p className="stake-orders-page__detail-row flex items-center justify-between">
                        <span>手续费</span>
                        <strong>{order.fee}</strong>
                    </p>
                ) : null}
            </div>

            {order.status === 'staking' ? (
                <div className="stake-orders-page__actions flex">
                    <ActionButton
                        size="small"
                        variant="secondary"
                        className="stake-orders-page__reclaim"
                        onClick={() => onAction('当前为静态演示，未提交赎回')}
                    >
                        赎回
                    </ActionButton>
                    <ActionButton
                        size="small"
                        variant="soft"
                        onClick={() => onAction('当前为静态演示，未提交转化')}
                    >
                        转化
                    </ActionButton>
                </div>
            ) : null}
        </article>
    )
}

/** Static staking-order fixtures with local tabs and pagination; no API or contract writes. */
export function StakeOrdersPage() {
    const [status, setStatus] = useState<StakeOrderStatus>('staking')
    const [page, setPage] = useState(1)
    const { message, showToast } = useToast()
    const currentPage = getMockStakeOrderPage(status, page)

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setPage(1)
    }, [])

    const loadNextPage = useCallback(async () => {
        await waitForMockData()
        setPage((current) => current + 1)
    }, [])

    function handleStatusChange(nextStatus: StakeOrderStatus) {
        setStatus(nextStatus)
        setPage(1)
    }

    usePageRefresh(refreshPage)
    usePageLoadMore(loadNextPage, { hasMore: currentPage.hasMore })

    return (
        <div className="stake-orders-page" data-page="stake-orders">
            <SecondaryHeader title="质押订单" />

            <main className="stake-orders-page__main">
                <SegmentedTabs
                    items={STATUS_TABS}
                    value={status}
                    onChange={handleStatusChange}
                    ariaLabel="质押订单状态"
                    idPrefix="stake-orders"
                />

                <section
                    id={`stake-orders-${status}-panel`}
                    role="tabpanel"
                    aria-labelledby={`stake-orders-${status}-tab`}
                    className="stake-orders-page__list flex flex-column"
                >
                    {currentPage.items.map((order) => (
                        <StakeOrderCard key={order.id} order={order} onAction={showToast} />
                    ))}
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}

export function StakeOrdersPageWithRefresh() {
    return <PagePullRefresh><StakeOrdersPage /></PagePullRefresh>
}
