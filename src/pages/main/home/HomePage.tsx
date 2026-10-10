import { ContractLoading } from '@/components/ContractLoading'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, FreeMode } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import previousIcon from '@/assets/home/carousel-previous.png'
import nextIcon from '@/assets/home/carousel-next.png'
import clockIcon from '@/assets/common/participation-clock.png'
import divider from '@/assets/common/title-divider.png'
import energyIcon from '@/assets/common/energy-icon.png'
import cardPackArrow from '@/assets/home/card-pack-arrow.png'
import { Toast, useToast } from '@/components/Toast'
import { Empty } from '@/components/Empty'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import { Popup } from '@/components/Popup'
import { ActionButton } from '@/components/ActionButton'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import type { Product } from '@/features/products/api.ts'
import { buyCard, getParticipationMessage } from '@/features/orders/api.ts'
import { useOrderConfig } from '@/features/orders/useOrderConfig.ts'
import { useProducts } from '@/features/products/useProducts.ts'
import { DropletLoading } from '@/components/DropletLoading'

import 'swiper/css'
import { useHomeCardOrders } from './useHomeCardOrders.ts'
import './HomePage.scss'

function syncPackGap(carousel: SwiperInstance) {
    carousel.params.spaceBetween = Number.parseFloat(window.getComputedStyle(carousel.el).columnGap) || 0
}

export function HomePage() {
    const { t } = useTranslation()
    const { pushRoute } = useAppNavigate()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ))
    const [purchaseCard, setPurchaseCard] = useState<Product | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const purchasePending = useRef(false)
    const mounted = useRef(true)
    const cardCarouselRef = useRef<SwiperInstance | null>(null)
    const { products, loading, failed, retry } = useProducts()
    const homePack = useHomeCardOrders()
    const { config, failed: configFailed, retry: retryConfig } = useOrderConfig()
    const participationMessage = configFailed ? '活动配置加载失败' : getParticipationMessage(config, 'sell')
    const card = products[selectedIndex] ?? products[0]
    const { message, variant, showToast } = useToast()

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
        media.addEventListener('change', handleChange)
        return () => media.removeEventListener('change', handleChange)
    }, [])

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    function openPurchase() {
        if (purchasePending.current || !card) return
        if (participationMessage) {
            showToast(t(participationMessage))
            return
        }
        setPurchaseCard(card)
    }

    function closePurchase() {
        if (!purchasePending.current) setPurchaseCard(null)
    }

    async function confirmPurchase() {
        if (purchasePending.current || !purchaseCard) return
        if (participationMessage) {
            showToast(t(participationMessage))
            return
        }
        purchasePending.current = true
        setSubmitting(true)
        try {
            try {
                await buyCard(purchaseCard.id)
            } catch (error: unknown) {
                if (mounted.current && !wasHttpErrorReported(error)) showToast(t('购买失败，请重试'), 'error')
                return
            }
            if (!mounted.current) return
            setPurchaseCard(null)
            showToast(t('购买成功'), 'success')
            retry()
            retryConfig()
            homePack.retry()
            try {
                await refreshCurrentUser()
            } catch (error) {
                if (mounted.current && !wasHttpErrorReported(error)) showToast(t('购买成功，余额刷新失败，请稍后重试'), 'error')
            }
        } finally {
            purchasePending.current = false
            if (mounted.current) setSubmitting(false)
        }
    }

    function stepCard(direction: number) {
        const carousel = cardCarouselRef.current
        if (!carousel || carousel.destroyed) return
        if (direction < 0) carousel.slidePrev()
        else carousel.slideNext()
    }

    return (
        <div className="home-page">
            <section className="home-page__hero flex flex-column items-center" aria-label={t("元宝卡牌展示")}>
                <div className="home-page__time flex items-center justify-center">
                    <img src={clockIcon} alt="" width={32} height={32} />
                    <span>{t('参与时间 {{time}}', { time: config ? `${config.sellStart}–${config.sellEnd}` : '--' })}</span>
                </div>
                <div className="home-page__participation tc" role="status">
                    {participationMessage ? <p>{t(participationMessage)}</p> : null}
                    {configFailed ? <button type="button" className="auto-btn" onClick={retryConfig}>{t('重新加载')}</button> : null}
                </div>

                {loading ? <div className="flex-center"><DropletLoading ariaLabel={t('商品加载中')} /></div> : failed ? (
                    <div className="tc"><p>{t('商品加载失败')}</p><button className="auto-btn" type="button" onClick={retry}>{t('重新加载')}</button></div>
                ) : products.length === 0 ? <Empty /> : <>
                <div className="home-page__stage">
                    <button type="button" className="home-page__previous" aria-label={t("上一张卡牌")} disabled={products.length < 2} onClick={() => stepCard(-1)}>
                        <img src={previousIcon} alt="" width={72} height={72} />
                    </button>
                    <div
                        className="home-page__card-frame flex-center"
                        role="region"
                        aria-label={t("卡牌轮播，可左右滑动")}
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                            event.preventDefault()
                            stepCard(event.key === 'ArrowLeft' ? -1 : 1)
                        }}
                    >
                        <Swiper
                            className="home-page__card-carousel"
                            modules={[A11y]}
                            slidesPerView={1}
                            loop={products.length > 1}
                            key={products.map((item) => item.id).join(',')}
                            speed={reducedMotion ? 0 : 500}
                            grabCursor
                            onSwiper={(carousel) => { cardCarouselRef.current = carousel; setSelectedIndex(0) }}
                            onRealIndexChange={(carousel) => setSelectedIndex(carousel.realIndex)}
                        >
                            {products.map((item, index) => (
                                <SwiperSlide key={item.id} className="home-page__card-slide flex-center" aria-hidden={index !== selectedIndex}>
                                    <img className="home-page__main-card" src={item.image || undefined} alt={item.name} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <button type="button" className="home-page__next" aria-label={t("下一张卡牌")} disabled={products.length < 2} onClick={() => stepCard(1)}>
                        <img src={nextIcon} alt="" width={72} height={72} />
                    </button>
                </div>

                <div className="home-page__selection flex items-center justify-center" role="group" aria-label={t("选择卡牌")}>
                    {products.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`home-page__thumbnail flex-center${index === selectedIndex ? ' home-page__thumbnail--selected' : ''}`}
                            aria-label={t('选择{{card}}', { card: item.name })}
                            aria-pressed={index === selectedIndex}
                            onClick={() => cardCarouselRef.current?.slideToLoop(index)}
                        >
                            <img src={item.image || undefined} alt="" />
                        </button>
                    ))}
                </div>

                <h1 className="home-page__title tc" aria-live="polite">{card?.name}</h1>
                <img className="home-page__divider" src={divider} alt="" width={338} height={24} />
                <div className="home-page__price flex items-center justify-center" aria-live="polite">
                    <img src={energyIcon} alt="" width={80} height={80} />
                    <span className="home-page__amount">{card?.price}</span>
                    <span className="home-page__unit">{t("元气")}</span>
                </div>
                <button type="button" className="home-page__purchase flex-center" disabled={submitting} onClick={openPurchase}>
                    {t("立即购买")}</button>
                </>}
            </section>

            <div className="home-page__sections flex flex-column">
                <section className="home-page__auction flex flex-column items-start" aria-labelledby="home-auction-title">
                    <h2 id="home-auction-title">{t("抢拍房间")}</h2>
                    <p>{t('每日 {{time}} 开启', { time: config ? `${config.buyStart}–${config.buyEnd}` : '--' })}</p>
                    {config && getParticipationMessage(config, 'buy') ? <p role="status">{t(getParticipationMessage(config, 'buy') ?? '')}</p> : null}
                    <button type="button" className="home-page__auction-button flex-center" onClick={() => pushRoute(ROUTE_PATH.auction)}>
                        {t("进入抢拍")}</button>
                </section>

                <section className="home-page__pack" aria-labelledby="home-pack-title">
                    <div className="home-page__pack-heading flex justify-between items-start">
                        <div>
                            <h2 id="home-pack-title">{t("我的卡包")}</h2>
                            <p>{t("购买后的卡牌，它将被放入您的卡牌背包中")}</p>
                        </div>
                        <button type="button" className="home-page__pack-entry" aria-label={t("查看我的卡包")} onClick={() => pushRoute(ROUTE_PATH.cardPack)}>
                            <img src={cardPackArrow} alt="" width={52} height={52} />
                        </button>
                    </div>
                    <div className="home-page__pack-empty flex-center" aria-busy={homePack.loading}>
                        {homePack.loading ? <DropletLoading ariaLabel={t('订单加载中')} /> : homePack.failed ? (
                            <div className="tc"><p>{t('卡包加载失败')}</p><button type="button" className="auto-btn" onClick={homePack.retry}>{t('重新加载')}</button></div>
                        ) : homePack.orders.length ? <Swiper className="home-page__pack-cards" modules={[A11y, FreeMode]}
                            slidesPerView="auto" freeMode grabCursor onBeforeInit={syncPackGap} onBeforeResize={syncPackGap}>
                            {homePack.orders.map(order => <SwiperSlide key={order.id} className="home-page__pack-slide">
                                <button type="button" className={`home-page__pack-card home-page__pack-card--${order.productId === 1 ? 'red' : order.productId === 3 ? 'green' : 'blue'}`}
                                    aria-label={order.product?.name ?? `#${order.productId}`} onClick={() => pushRoute(ROUTE_PATH.cardPack)}>
                                    <img src={order.product?.image || undefined} alt="" />
                                </button>
                            </SwiperSlide>)}
                        </Swiper> : <Empty showGap={false} />}
                    </div>
                </section>
            </div>
            <Popup show={purchaseCard !== null} title={t('确认购买')} onClose={closePurchase}
                closeOnOverlayClick={!submitting} contentClassName="home-purchase-popup">
                <div className="home-purchase-popup__body" role="dialog" aria-modal="true" aria-label={t('确认购买')}>
                    <p className="home-purchase-popup__name">{purchaseCard?.name}</p>
                    <p>{t('购买数量：1 张')}</p>
                    <p>{t('将扣除 {{amount}} 元气', { amount: purchaseCard?.price ?? '--' })}</p>
                    <div className="home-purchase-popup__actions">
                        <ActionButton type="button" variant="outline" disabled={submitting} onClick={closePurchase}>{t('取消')}</ActionButton>
                        <ActionButton type="button" loading={submitting} onClick={() => void confirmPurchase()}>{t('确认购买')}</ActionButton>
                    </div>
                </div>
            </Popup>
            <Toast message={message} variant={variant} />
            <ContractLoading show={submitting} />
        </div>
    )
}
