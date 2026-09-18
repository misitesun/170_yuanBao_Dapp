import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper'
import GradientText from '@/components/GradientText'
import { ActionButton } from '@/components/ActionButton'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH } from '@/router/routes.ts'
import { useAppNavigate } from '@/router/useAppNavigate.ts'
import { getViewportWidthPx } from '@/shared/viewport/getViewportWidthPx'
import knight from '@/assets/presale/card-knight.png'
import alien from '@/assets/presale/card-alien.png'
import explorer from '@/assets/presale/card-explorer.png'
import jellyfish from '@/assets/presale/card-jellyfish.png'
import mushroom from '@/assets/presale/card-mushroom.png'
import helix from '@/assets/presale/card-helix.png'
import power from '@/assets/presale/benefit-power.svg'
import level from '@/assets/presale/benefit-level.svg'
import bronze from '@/assets/presale/level-bronze.png'
import usdt from '@/assets/stake/usdt.svg'
import arrow from '@/assets/stake/arrow-right.svg'
import 'swiper/css'
import './PresalePage.scss'

const CARDS = [knight, alien, explorer, jellyfish, mushroom, helix]

/** Design fixtures only; no purchase, wallet or API integration. */
export function PresalePage() {
    const [activeIndex, setActiveIndex] = useState(0)
    const swiperRef = useRef<SwiperInstance | null>(null)
    const tabsRef = useRef<HTMLDivElement>(null)
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()

    useEffect(() => {
        const tabs = tabsRef.current
        const tab = tabs?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
        if (!tabs || !tab) return
        const offset = tab.getBoundingClientRect().left - tabs.getBoundingClientRect().left
        tabs.scrollTo({ left: tabs.scrollLeft + offset - (tabs.clientWidth - tab.clientWidth) / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }, [activeIndex])

    function selectCard(index: number) {
        swiperRef.current?.slideToLoop(index)
    }

    function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next: number
        if (event.key === 'ArrowRight') next = (index + 1) % CARDS.length
        else if (event.key === 'ArrowLeft') next = (index + CARDS.length - 1) % CARDS.length
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = CARDS.length - 1
        else return
        event.preventDefault()
        tabsRef.current?.querySelector<HTMLButtonElement>(`#presale-tab-${next}`)?.focus({ preventScroll: true })
        selectCard(next)
    }

    return <div className="presale-page" data-page="presale">
        <header className="presale-page__heading">
            <h1 className="size-40 bold-5"><GradientText animationSpeed={3}>预售启航｜共启新篇</GradientText></h1>
            <p className="presale-page__subtitle size-24">参与预售，与 HU-CHAIN 一同探索链上新可能</p>
        </header>
        <div ref={tabsRef} className="presale-page__tabs flex items-center" role="tablist" aria-label="预售卡牌">
            {CARDS.map((_, index) => <button key={index} id={`presale-tab-${index}`} type="button" role="tab"
                className="presale-page__tab size-30" aria-selected={activeIndex === index} aria-controls="presale-panel"
                tabIndex={activeIndex === index ? 0 : -1} onClick={() => selectCard(index)} onKeyDown={(event) => handleTabKey(event, index)}>
                预售{index + 1}号
            </button>)}
        </div>
        <section id="presale-panel" className="presale-page__panel" role="tabpanel" aria-labelledby={`presale-tab-${activeIndex}`}>
            <Swiper className="presale-page__swiper" slidesPerView="auto" centeredSlides loop spaceBetween={getViewportWidthPx(40)} speed={350}
                onSwiper={(swiper) => { swiperRef.current = swiper }}
                onBeforeDestroy={() => { swiperRef.current = null }}
                onBeforeResize={(swiper) => { swiper.params.spaceBetween = getViewportWidthPx(40) }}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}>
                {CARDS.map((art, index) => <SwiperSlide key={art}>
                    <article className={`presale-page__card flex flex-column justify-end${index === 0 ? ' presale-page__card--knight' : ''}`}
                        style={{ backgroundImage: `url(${art})` }} aria-hidden={activeIndex !== index}>
                        <div className="presale-page__card-info flex flex-column items-center justify-center">
                            <h2 className="size-28">预售{index + 1}号名称</h2>
                            <p className="presale-page__price flex items-center size-40 bold-7"><img src={usdt} alt="" />1,000 USDT</p>
                        </div>
                    </article>
                </SwiperSlide>)}
            </Swiper>
        </section>
        <div className="presale-page__details">
            <dl className="presale-page__benefits flex flex-column size-26">
                <div className="presale-page__benefit flex items-center justify-between">
                    <dt className="flex items-center"><img className="presale-page__benefit-icon" src={power} alt="" />赠送算力</dt><dd>1,000 万</dd>
                </div>
                <div className="presale-page__benefit flex items-center justify-between">
                    <dt className="flex items-center"><img className="presale-page__benefit-icon" src={level} alt="" />赠送等级</dt>
                    <dd className="flex items-center"><img className="presale-page__badge" src={bronze} alt="" />青铜</dd>
                </div>
            </dl>
            <div className="presale-page__actions flex flex-column">
                <ActionButton onClick={() => showToast(`当前为预售${activeIndex + 1}号静态演示，未提交购买`)}>购买</ActionButton>
                <ActionButton variant="secondary" onClick={() => pushRoute(ROUTE_PATH.presaleOrders)}>预售订单<img className="presale-page__arrow" src={arrow} alt="" /></ActionButton>
            </div>
        </div>
        <Toast message={message} />
    </div>
}
