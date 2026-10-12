import { ContractLoading } from '@/components/ContractLoading'
import { Trans, useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import clockIcon from '@/assets/common/participation-clock.png'
import priceCoins from '@/assets/auction/price-coins.png'
import { Toast, useToast } from '@/components/Toast'
import { Popup } from '@/components/Popup'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { orderQuantityTotal, parseOrderQuantity } from '@/features/orders/quantity.ts'

import { bidCard, getParticipationMessage } from '@/features/orders/api.ts'
import type { Product } from '@/features/products/api.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { useOrderConfig } from '@/features/orders/useOrderConfig.ts'
import { useProducts } from '@/features/products/useProducts.ts'
import { Empty } from '@/components/Empty'

import './AuctionPage.scss'

// Developer-confirmed product IDs; artwork always comes from the API image field.
const CARD_BACKGROUNDS: Readonly<Record<number, 'red' | 'blue' | 'green'>> = {
    1: 'red',
    2: 'blue',
    3: 'green',
}

export function AuctionPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const { products, loading, failed, retry } = useProducts()
    const { config, failed: configFailed, retry: retryConfig } = useOrderConfig()
    const participationMessage = configFailed ? '活动配置加载失败' : getParticipationMessage(config, 'buy')
    const [submitting, setSubmitting] = useState(false)
    const [bidProduct, setBidProduct] = useState<Product | null>(null)
    const [quantityInput, setQuantityInput] = useState('')
    const pending = useRef(false)
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    function openBid(card: Product) {
        if (pending.current) return
        if (card.stock < 1) { showToast(t('该产品已抢购完')); return }
        if (participationMessage) { showToast(t(participationMessage)); return }
        setQuantityInput('')
        setBidProduct(card)
    }

    function closeBid() {
        if (!pending.current) setBidProduct(null)
    }

    async function confirmBid() {
        if (pending.current || !bidProduct) return
        const quantity = parseOrderQuantity(quantityInput)
        if (quantity === null) { showToast(t('请输入 1–100 的整数数量'), 'error'); return }
        const currentProduct = products.find(card => card.id === bidProduct.id)
        if (!currentProduct || currentProduct.stock < 1) { showToast(t('该产品已抢购完')); return }
        if (currentProduct.stock < quantity) { showToast(t('可抢数量不足'), 'error'); return }
        if (participationMessage) { showToast(t(participationMessage)); return }
        pending.current = true
        setSubmitting(true)
        try {
            try { await bidCard(bidProduct.id, quantity) } catch (error) {
                if (mounted.current && !wasHttpErrorReported(error)) showToast(t('抢拍失败，请重试'), 'error')
                return
            }
            if (!mounted.current) return
            setBidProduct(null)
            showToast(t('抢拍成功'), 'success')
            retry()
            retryConfig()
            try { await refreshCurrentUser() } catch (error) {
                if (mounted.current && !wasHttpErrorReported(error)) showToast(t('抢拍成功，余额刷新失败'), 'error')
            }
        } finally {
            pending.current = false
            if (mounted.current) setSubmitting(false)
        }
    }

    return (
        <div className="auction-page">
            <section className="auction-page__hero flex flex-column" aria-labelledby="auction-title">
                <div className="auction-page__time flex items-center justify-center">
                    <img src={clockIcon} alt="" />
                    <span>{t('参与时间 {{time}}', { time: config ? `${config.buyStart}–${config.buyEnd}` : '--' })}</span>
                </div>
                <div className="auction-page__participation tc" role="status">
                    {participationMessage ? <p>{t(participationMessage)}</p> : null}
                    {configFailed ? <button type="button" className="auto-btn" onClick={retryConfig}>{t('重新加载')}</button> : null}
                </div>
                <h1 id="auction-title" className="auction-page__title tc">
                    <Trans i18nKey="<0>限时</0>抢拍元宝卡" components={[<span key="accent" />]} /></h1>
            </section>

            {loading ? null : failed ? (
                <div className="tc"><p>{t('商品加载失败')}</p><button className="auto-btn" type="button" onClick={retry}>{t('重新加载')}</button></div>
            ) : products.length === 0 ? <Empty /> : null}
            <ul className="auction-page__list flex flex-column" aria-busy={loading} aria-label={t("可抢拍卡牌")}>
                {products.map((card) => (
                    <li key={card.id}>
                        <article className={`auction-page__card auction-page__card--${CARD_BACKGROUNDS[card.id] ?? 'blue'}`} aria-labelledby={`auction-${card.id}`}>
                            <img className="auction-page__card-image" src={card.image || undefined} alt={card.name} />
                            <div className="auction-page__details flex flex-column items-center">
                                <h2 id={`auction-${card.id}`} className="auction-page__name tc">{card.name}</h2>
                                <div className="auction-page__price flex items-center justify-center">
                                    <img src={priceCoins} alt="" />
                                    <span>{card.purchUsdt}{t("余额")}+{card.purchBao}{t('宝气')}</span>
                                </div>
                                <button
                                    type="button"
                                    className="auction-page__bid flex-center"
                                    aria-label={t('立即抢拍{{card}}', { card: card.name })}
                                    disabled={submitting}
                                    onClick={() => openBid(card)}
                                >
                                    <span>{t("立即抢拍")}</span>
                                </button>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>
            <Popup show={bidProduct !== null} title={t('确认抢拍')} onClose={closeBid}
                closeOnOverlayClick={!submitting} contentClassName="auction-confirm-popup">
                <div className="auction-confirm-popup__body" role="dialog" aria-modal="true" aria-label={t('确认抢拍')}>
                    <p className="auction-confirm-popup__name">{bidProduct?.name}</p>
                    <label htmlFor="bid-quantity">{t('抢拍数量')}</label>
                    <Input id="bid-quantity" type="text" inputMode="numeric" value={quantityInput}
                        placeholder={t('请输入 1–100 的整数数量')} suffix={t('张')} disabled={submitting}
                        onChange={event => setQuantityInput(event.target.value)} />
                    <p>{t('将扣除 {{usdt}} 余额 + {{bao}} 宝气', {
                        usdt: orderQuantityTotal(bidProduct?.purchUsdt, quantityInput),
                        bao: orderQuantityTotal(bidProduct?.purchBao, quantityInput),
                    })}</p>
                    <div className="auction-confirm-popup__actions">
                        <ActionButton type="button" variant="outline" disabled={submitting} onClick={closeBid}>{t('取消')}</ActionButton>
                        <ActionButton type="button" loading={submitting} onClick={() => void confirmBid()}>{t('确认抢拍')}</ActionButton>
                    </div>
                </div>
            </Popup>
            <Toast message={message} variant={variant} />
            <ContractLoading show={submitting} />
        </div>
    )
}
