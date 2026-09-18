import { useCallback, useState } from 'react'

import bronzeBadge from '@/assets/presale/level-bronze.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import { PagePullRefresh, usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { SecondaryHeader } from '@/components/SecondaryHeader'

import { getMockPresaleOrderPage } from './pagination.ts'

import './PresaleOrdersPage.scss'

const MOCK_DELAY_MS = 420

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

/** Static presale-order fixtures with local pagination; no API or wallet integration. */
export function PresaleOrdersPage() {
    const [page, setPage] = useState(1)
    const currentPage = getMockPresaleOrderPage(page)

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setPage(1)
    }, [])

    const loadNextPage = useCallback(async () => {
        await waitForMockData()
        setPage((current) => current + 1)
    }, [])

    usePageRefresh(refreshPage)
    usePageLoadMore(loadNextPage, { hasMore: currentPage.hasMore })

    return (
        <div className="presale-orders-page" data-page="presale-orders">
            <SecondaryHeader title="预售订单" />

            <main className="presale-orders-page__main">
                <section className="presale-orders-page__list flex flex-column" aria-label="预售订单列表">
                    {currentPage.items.map((order) => (
                        <article key={order.id} className="presale-orders-page__card flex flex-column">
                            <header className="presale-orders-page__meta flex items-center justify-between">
                                <h2 className="size-28 bold-7">{order.name}</h2>
                                <time className="size-24" dateTime={order.createdAt.replaceAll('/', '-').replace(' ', 'T')}>{order.createdAt}</time>
                            </header>

                            <p className="presale-orders-page__price-label size-24">预售价格</p>
                            <p className="presale-orders-page__price flex items-center size-40 bold-5">
                                <img src={usdtIcon} alt="USDT" />
                                <span>{order.price}</span>
                            </p>

                            <dl className="presale-orders-page__details flex flex-column size-24">
                                <div className="flex items-center justify-between">
                                    <dt>获得算力</dt>
                                    <dd>{order.power}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt>获得等级</dt>
                                    <dd className="presale-orders-page__level flex items-center">
                                        <img src={bronzeBadge} alt="" />
                                        <span className="size-26">{order.level}</span>
                                    </dd>
                                </div>
                            </dl>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    )
}

export function PresaleOrdersPageWithRefresh() {
    return <PagePullRefresh><PresaleOrdersPage /></PagePullRefresh>
}
