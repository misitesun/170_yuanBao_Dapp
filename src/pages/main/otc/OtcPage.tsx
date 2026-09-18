import { useCallback, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import stakingCoins from '@/assets/stake/staking-coins.png'
import huIcon from '@/assets/stake/assetsHu.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import brandMark from '@/assets/layout/headbar/hu-chain-brand-alternate.png'
import { ActionButton } from '@/components/ActionButton'
import GradientText from '@/components/GradientText'
import { Input } from '@/components/Input'
import { MarketPopup, MARKET_ASSET_LIST, type MarketAssetType } from '@/components/MarketPopup'
import { usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { Popup } from '@/components/Popup'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'
import { getViewportWidthPx } from '@/shared/viewport/getViewportWidthPx'

import { getMockOtcPage, type MockOtcOrder } from './pagination.ts'
import { getSellAllValue, hasSellQuantity } from './sellUtils.ts'
import 'swiper/css'
import './OtcPage.scss'

const MOCK_DELAY_MS = 420

const ASSET_CARDS = MARKET_ASSET_LIST

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

function OrderEntryIcon() {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M10 5h17l5 5v25H10zM27 5v7h5M15 17h12M15 23h12M15 29h8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}

function MarketLinkIcon() {
    return <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M29.6746 26.9344c-.1973 0-.3932-.0398-.5752-.1148a1.5 1.5 0 0 1-.4872-.3257 1.5 1.5 0 0 1-.4393-1.0612l-.0052-15.4771L7.3941 30.7292a1.5 1.5 0 0 1-2.1223-.0008 1.5 1.5 0 0 1-.0007-2.1222L26.0447 7.8326l-15.4759-.004a1.501 1.501 0 0 1 .001-3.003l19.0984.0075c.1964-.001.3923.0388.574.1136.1829.0766.3485.1869.4875.3259.1389.139.2506.3058.3254.4875.0751.182.1148.3779.1148.5753l.0075 19.0983a1.5 1.5 0 0 1-1.5028 1.5007Z" fill="currentColor" />
    </svg>
}

function MarketSparkline({ positive, label }: { positive: boolean; label: string }) {
    const gradientId = positive ? 'otc-sparkline-up' : 'otc-sparkline-down'
    const linePath = 'M1 62L5 41L10 30L15 43L20 31L26 39L32 27L38 43L44 34L51 47L58 36L65 33L72 56L79 64L86 39L93 25L100 38L107 52L114 42L121 53L128 35L135 29L142 40L150 9L157 22'

    return <svg className="otc-page__sparkline" viewBox="0 0 158 69" role="img" aria-label={`${label}行情折线图`}>
        <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="currentColor" stopOpacity=".3" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path d={`${linePath}L157 69H1Z`} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}

/** Static design fixtures with local pagination; no API, wallet or trade submission. */
export function OtcPage() {
    const [page, setPage] = useState(1)
    const [activeAssetIndex, setActiveAssetIndex] = useState(0)
    const [marketAssetType, setMarketAssetType] = useState<MarketAssetType>('hu')
    const [showMarketPopup, setShowMarketPopup] = useState(false)
    const [selectedSellOrder, setSelectedSellOrder] = useState<MockOtcOrder | null>(null)
    const [sellQuantity, setSellQuantity] = useState('')
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()
    const currentPage = getMockOtcPage(page)

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

    function handleOpenSell(order: MockOtcOrder) {
        setSelectedSellOrder(order)
        setSellQuantity('')
    }

    function handleOpenMarket(assetType: MarketAssetType) {
        setMarketAssetType(assetType)
        setShowMarketPopup(true)
    }

    function handleConvertPower() {
        setShowMarketPopup(false)
        pushRoute(ROUTE_PATH.pointsConvert)
    }

    function handleCloseSell() {
        setSelectedSellOrder(null)
        setSellQuantity('')
    }

    function handleSellAll() {
        if (!selectedSellOrder) return

        setSellQuantity(getSellAllValue(selectedSellOrder.remaining))
    }

    function handleSellConfirm() {
        if (!hasSellQuantity(sellQuantity)) {
            showToast('请输入出售数量')
            return
        }

        const address = selectedSellOrder?.address ?? ''
        handleCloseSell()
        showToast(`当前为 ${address} 静态演示，未提交出售`)
    }

    return <div className="otc-page" data-page="otc">
        <section className="otc-page__assets" aria-label="资产行情">
            <Swiper
                className="otc-page__asset-swiper"
                slidesPerView="auto"
                spaceBetween={getViewportWidthPx(10)}
                speed={320}
                onSlideChange={(swiper) => setActiveAssetIndex(Math.max(0, swiper.activeIndex - 1))}
                onBeforeResize={(swiper) => { swiper.params.spaceBetween = getViewportWidthPx(10) }}
            >
                <SwiperSlide className="otc-page__asset-art-slide">
                    <div className="otc-page__asset-art flex-center">
                        <span className="otc-page__asset-art-image">
                            <img src={stakingCoins} alt="HU与USDT资产" />
                        </span>
                    </div>
                </SwiperSlide>
                {ASSET_CARDS.map((asset) => <SwiperSlide key={asset.name}>
                    <button type="button"
                        className={`otc-page__market-card otc-page__market-card--${asset.positive ? 'up' : 'down'} flex flex-column`}
                        aria-label={`查看${asset.name}行情详情`}
                        onClick={() => handleOpenMarket(asset.type)}>
                        <div className="otc-page__market-heading flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={asset.icon} alt="" />
                                <span className="size-28 bold-5">{asset.name}</span>
                            </div>
                            <span className="otc-page__market-link flex-center" aria-hidden="true">
                                <MarketLinkIcon />
                            </span>
                        </div>
                        <div className="otc-page__market-body grid">
                            <div>
                                <p className="otc-page__market-price size-32">{asset.price}</p>
                                <p className={`otc-page__market-change size-24 ${asset.positive ? 'otc-page__market-change--up' : 'otc-page__market-change--down'}`}>{asset.change}</p>
                            </div>
                            <MarketSparkline positive={asset.positive} label={asset.name} />
                        </div>
                    </button>
                </SwiperSlide>)}
            </Swiper>
            <p className="otc-page__asset-status size-0" aria-live="polite">当前资产：{ASSET_CARDS[activeAssetIndex]?.name}</p>
        </section>

        <section className="otc-page__market">
            <header className="otc-page__section-heading flex items-end justify-between">
                <div>
                    <h1 className="size-40 bold-5"><GradientText animationSpeed={3}>OTC交易</GradientText></h1>
                    <p className="otc-page__subtitle size-28">开启您的数字资产交易</p>
                </div>
                <div className="otc-page__heading-actions flex items-center">
                    <button type="button" className="otc-page__orders flex-center" aria-label="查看OTC订单"
                        onClick={() => pushRoute(ROUTE_PATH.otcOrders)}><OrderEntryIcon /></button>
                    <button type="button" className="otc-page__post-buy flex items-center justify-center size-24"
                        onClick={() => pushRoute(ROUTE_PATH.otcPostBuy)}><span className="otc-page__plus flex-center">＋</span>挂买</button>
                </div>
            </header>

            <div className="otc-page__orders-list flex flex-column" aria-label="OTC出售列表">
                {currentPage.items.map((order) => <article key={order.id} className="otc-page__order-card flex flex-column">
                    <div className="otc-page__order-top flex items-center justify-between">
                        <div className="otc-page__account flex items-center">
                            <span className="otc-page__account-mark flex-center"><img src={brandMark} alt="" /></span>
                            <span className="flex flex-column">
                                <span className="otc-page__account-label size-20">地址账户</span>
                                <span className="size-28 bold-5">{order.address}</span>
                            </span>
                        </div>
                        <ActionButton size="small" className="otc-page__sell" onClick={() => handleOpenSell(order)}>出售</ActionButton>
                    </div>
                    <p className="otc-page__unit-price flex items-center size-40"><img src={usdtIcon} alt="" /><span>{order.unitPrice}</span><small className="size-24">/枚</small></p>
                    <p className="otc-page__remaining size-24">剩余数量 <strong>{order.remaining}HU</strong></p>
                </article>)}
            </div>
        </section>
        <MarketPopup
            show={showMarketPopup}
            assetType={marketAssetType}
            onClose={() => setShowMarketPopup(false)}
            onConvertPower={handleConvertPower}
        />
        <Popup
            show={selectedSellOrder !== null}
            title="HU出售"
            contentClassName="otc-page__sell-popup"
            onClose={handleCloseSell}
        >
            <div className="otc-page__sell-popup-body">
                <p className="otc-page__sell-price size-28">
                    单价： <span>{selectedSellOrder?.unitPrice ?? '--'}</span><small>USDT</small>
                </p>
                <div className="otc-page__sell-field-heading flex items-center justify-between">
                    <label htmlFor="otc-sell-quantity" className="size-28">出售数量</label>
                    <button type="button" className="size-24" onClick={handleSellAll}>全部</button>
                </div>
                <div className="otc-page__sell-field">
                    <Input
                        id="otc-sell-quantity"
                        value={sellQuantity}
                        inputMode="decimal"
                        placeholder="请输入出售数量"
                        suffix={<img src={huIcon} alt="" />}
                        onChange={(event) => setSellQuantity(event.target.value)}
                    />
                </div>
                <dl className="otc-page__sell-details flex flex-column size-24">
                    <div className="flex items-center justify-between">
                        <dt>剩余数量</dt>
                        <dd className="otc-page__sell-remaining">{selectedSellOrder?.remaining ?? '--'} HU</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt>手续费</dt>
                        <dd>0.00 USDT</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt>可用余额</dt>
                        <dd>78,877392 USDT</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt>合计</dt>
                        <dd>-- USDT</dd>
                    </div>
                </dl>
                <ActionButton className="otc-page__sell-confirm" onClick={handleSellConfirm}>确认</ActionButton>
            </div>
        </Popup>
        <Toast message={message} />
    </div>
}
