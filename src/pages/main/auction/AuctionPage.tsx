import { Trans, useTranslation } from 'react-i18next'
import redCard from '@/assets/common/card-red.png'
import blueCard from '@/assets/common/card-blue.png'
import greenCard from '@/assets/common/card-green.png'
import clockIcon from '@/assets/common/participation-clock.png'
import priceCoins from '@/assets/auction/price-coins.png'
import { Toast, useToast } from '@/components/Toast'

import './AuctionPage.scss'

// Design fixtures only. Payment parameters must come from confirmed API/ABI documents.
const AUCTION_CARDS = [
    { id: 'red', name: '元宝典藏卡', usdt: '103', baoqi: '1', image: redCard },
    { id: 'blue', name: '元宝尊享卡', usdt: '309', baoqi: '3', image: blueCard },
    { id: 'green', name: '元宝至尊卡', usdt: '1030', baoqi: '10', image: greenCard },
] as const

export function AuctionPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()

    return (
        <div className="auction-page">
            <section className="auction-page__hero flex flex-column" aria-labelledby="auction-title">
                <div className="auction-page__time flex items-center justify-center">
                    <img src={clockIcon} alt="" />
                    <span>{t('参与时间 {{time}}', { time: '15:00-16:00' })}</span>
                </div>
                <h1 id="auction-title" className="auction-page__title tc">
                    <Trans i18nKey="<0>限时</0>抢拍元宝卡" components={[<span key="accent" />]} /></h1>
            </section>

            <ul className="auction-page__list flex flex-column" aria-label={t("可抢拍卡牌")}>
                {AUCTION_CARDS.map((card) => (
                    <li key={card.id}>
                        <article className={`auction-page__card auction-page__card--${card.id}`} aria-labelledby={`auction-${card.id}`}>
                            <img className="auction-page__card-image" src={card.image} alt={t(card.name)} />
                            <div className="auction-page__details flex flex-column items-center">
                                <h2 id={`auction-${card.id}`} className="auction-page__name tc">{t(card.name)}</h2>
                                <div className="auction-page__price flex items-center justify-center">
                                    <img src={priceCoins} alt="" />
                                    <span>{card.usdt}{t("余额")}+{card.baoqi}{t('宝气')}</span>
                                </div>
                                <button
                                    type="button"
                                    className="auction-page__bid flex-center"
                                    aria-label={t('立即抢拍{{card}}', { card: t(card.name) })}
                                    onClick={() => showToast(t("抢拍功能待接入"))}
                                >
                                    <span>{t("立即抢拍")}</span>
                                </button>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>
            <Toast message={message} variant={variant} />
        </div>
    )
}
