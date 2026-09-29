import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import blueCard from '@/assets/common/card-blue.png'
import redCard from '@/assets/common/card-red.png'
import greenCard from '@/assets/common/card-green.png'
import previousIcon from '@/assets/home/carousel-previous.png'
import nextIcon from '@/assets/home/carousel-next.png'
import clockIcon from '@/assets/common/participation-clock.png'
import divider from '@/assets/common/title-divider.png'
import energyIcon from '@/assets/common/energy-icon.png'
import cardPackArrow from '@/assets/home/card-pack-arrow.png'
import { Toast, useToast } from '@/components/Toast'
import { Empty } from '@/components/Empty'

import 'swiper/css'
import './HomePage.scss'

const CARDS = [
    { id: 'blue', image: blueCard, label: '蓝色卡牌', title: 'Yuanbao Premium Card' },
    { id: 'red', image: redCard, label: '红色卡牌', title: 'Yuanbao Collection Card' },
    { id: 'green', image: greenCard, label: '绿色卡牌', title: 'Yuanbao Supreme Card' },
] as const

/** Static design fixtures only; replace with documented product and inventory data during integration. */
export function HomePage() {
    const { t } = useTranslation()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ))
    const cardCarouselRef = useRef<SwiperInstance | null>(null)
    const card = CARDS[selectedIndex] ?? CARDS[0]
    const { message, variant, showToast } = useToast()

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
        media.addEventListener('change', handleChange)
        return () => media.removeEventListener('change', handleChange)
    }, [])

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
                    <span>{t('参与时间 {{time}}', { time: '10:00-15:00' })}</span>
                </div>

                <div className="home-page__stage">
                    <button type="button" className="home-page__previous" aria-label={t("上一张卡牌")} onClick={() => stepCard(-1)}>
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
                            loop
                            speed={reducedMotion ? 0 : 500}
                            grabCursor
                            onSwiper={(carousel) => { cardCarouselRef.current = carousel }}
                            onRealIndexChange={(carousel) => setSelectedIndex(carousel.realIndex)}
                        >
                            {CARDS.map((item, index) => (
                                <SwiperSlide key={item.id} className="home-page__card-slide flex-center" aria-hidden={index !== selectedIndex}>
                                    <img className="home-page__main-card" src={item.image} alt={t(item.label)} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <button type="button" className="home-page__next" aria-label={t("下一张卡牌")} onClick={() => stepCard(1)}>
                        <img src={nextIcon} alt="" width={72} height={72} />
                    </button>
                </div>

                <div className="home-page__selection flex items-center justify-center" role="group" aria-label={t("选择卡牌")}>
                    {CARDS.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`home-page__thumbnail flex-center${index === selectedIndex ? ' home-page__thumbnail--selected' : ''}`}
                            aria-label={t('选择{{card}}', { card: t(item.label) })}
                            aria-pressed={index === selectedIndex}
                            onClick={() => cardCarouselRef.current?.slideToLoop(index)}
                        >
                            <img src={item.image} alt="" />
                        </button>
                    ))}
                </div>

                <h1 className="home-page__title tc" aria-live="polite">{card.title}</h1>
                <img className="home-page__divider" src={divider} alt="" width={338} height={24} />
                <div className="home-page__price flex items-center justify-center" aria-live="polite">
                    <img src={energyIcon} alt="" width={80} height={80} />
                    {/* TODO: replace the placeholder after the product price API is confirmed. */}
                    <span className="home-page__amount">--</span>
                    <span className="home-page__unit">{t("元气")}</span>
                </div>
                <button type="button" className="home-page__purchase flex-center" onClick={() => showToast(t("暂未开放"))}>
                    {t("立即购买")}</button>
            </section>

            <div className="home-page__sections flex flex-column">
                <section className="home-page__auction flex flex-column items-start" aria-labelledby="home-auction-title">
                    <h2 id="home-auction-title">{t("抢拍房间")}</h2>
                    <p>{t('每日 {{time}} 开启', { time: '15:00-16:00' })}</p>
                    <button type="button" className="home-page__auction-button flex-center" onClick={() => showToast(t("暂未开放"))}>
                        {t("进入抢拍")}</button>
                </section>

                <section className="home-page__pack" aria-labelledby="home-pack-title">
                    <div className="home-page__pack-heading flex justify-between items-start">
                        <div>
                            <h2 id="home-pack-title">{t("我的卡包")}</h2>
                            <p>{t("购买后的卡牌，它将被放入您的卡牌背包中")}</p>
                        </div>
                        <button type="button" className="home-page__pack-entry" aria-label={t("查看我的卡包")} onClick={() => showToast(t("暂未开放"))}>
                            <img src={cardPackArrow} alt="" width={52} height={52} />
                        </button>
                    </div>
                    <div className="home-page__pack-empty flex-center">
                        <Empty showGap={false} />
                    </div>
                </section>
            </div>
            <Toast message={message} variant={variant} />
        </div>
    )
}
