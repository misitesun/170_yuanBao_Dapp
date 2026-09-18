import { useState } from 'react'

import { ActionButton } from '@/components/ActionButton'
import { NoticeCarousel } from '@/components/Carousel/NoticeCarousel'
import { Countdown } from '@/components/Countdown'
import { Input } from '@/components/Input'
import { Popup } from '@/components/Popup'
import { Toast, useToast } from '@/components/Toast'
import checkinIcon from '@/assets/home/checkin.png'
import reserveIcon from '@/assets/home/checkin-reserve.png'
import checkinDecoration from '@/assets/home/checkin-decoration.png'
import miningMachine from '@/assets/home/mining-machine.png'
import networkPower from '@/assets/home/network-power.png'
import personalPower from '@/assets/home/personal-power.png'
import minedTotal from '@/assets/home/mined-total.png'
import huTotal from '@/assets/home/hu-total.png'
import noticeIcon from '@/assets/layout/headbar/notification.png'
import { isValidReserveCheckinDays } from './utils'
import './HomePage.scss'

const NOTICES = [
    '亲爱的用户：为了给您提供更加优质、便捷、丰富的功能',
    'Welcome to HU CHAIN. Connect to the digital world. Explore new possibilities.',
] as const

const STATS = [
    { label: '全网算力', icon: networkPower },
    { label: '个人算力', icon: personalPower },
    { label: '全网挖矿总量', icon: minedTotal },
    { label: 'HU总量', icon: huTotal },
] as const

/** Design-only data; no API, translation or wallet interaction in phase one. */
export function HomePage() {
    const [showCheckinPopup, setShowCheckinPopup] = useState(false)
    const [showReservePopup, setShowReservePopup] = useState(false)
    const [reserveDays, setReserveDays] = useState('')
    const { message, showToast } = useToast()

    function handleCheckinConfirm() {
        setShowCheckinPopup(false)
        showToast('签到功能当前为静态演示，未提交签到')
    }

    function handleReserveClose() {
        setShowReservePopup(false)
        setReserveDays('')
    }

    function handleReserveConfirm() {
        if (!isValidReserveCheckinDays(reserveDays)) {
            showToast('请输入正确的预约签到天数')
            return
        }

        handleReserveClose()
        showToast('预约签到功能当前为静态演示，未提交预约')
    }

    return (
        <div className="home-page" data-page="home">
            <section className="home-page__hero flex flex-column justify-end tc">
                <h1 className="home-page__headline bold-7">WELCOME TO <span>HU CHAIN</span></h1>
                <p className="home-page__subtitle size-28 mt-20">Connect to the digital world. Explore new possibilities.</p>
            </section>
            <div className="home-page__content flex flex-column">
                <div className="home-page__notice flex items-center">
                    <img src={noticeIcon} alt="" />
                    <NoticeCarousel items={NOTICES} />
                </div>
                <section className="home-page__countdowns flex justify-between" aria-label="项目倒计时">
                    <Countdown label="HU减半倒计时：" />
                    <Countdown label="上所倒计时：" tone="cyan" />
                </section>
                <section className="home-page__checkin" aria-labelledby="checkin-title">
                    <img className="home-page__checkin-art" src={checkinDecoration} alt="" />
                    <h2 id="checkin-title" className="size-32 bold-6">每日签到</h2>
                    <p className="size-28 mt-20">累计签到 <span className="home-page__pink">238</span> 天</p>
                    <p className="home-page__muted size-24 mt-20">当前签到手续费 0.01%</p>
                    <div className="home-page__checkin-actions flex flex-column">
                        <ActionButton
                            icon={<img src={checkinIcon} alt="" />}
                            onClick={() => setShowCheckinPopup(true)}
                        >
                            立即签到
                        </ActionButton>
                        <ActionButton
                            variant="outline"
                            icon={<img src={reserveIcon} alt="" />}
                            onClick={() => setShowReservePopup(true)}
                        >
                            预约签到
                        </ActionButton>
                    </div>
                </section>
                <section className="home-page__mining" aria-labelledby="mining-title">
                    <h2 id="mining-title" className="home-page__section-title flex items-center size-32 bold-6">购买矿机</h2>
                    <div className="home-page__miner-card grid">
                        <img className="home-page__miner-art" src={miningMachine} alt="HU 矿机" />
                        <div className="home-page__miner-info flex flex-column items-center tc">
                            <p className="home-page__price bold-6"><span className="size-48">10</span><span className="size-32">USDT/台</span></p>
                            <p className="home-page__power size-24">赠送算力 10.00万</p>
                            <p className="size-24">每个账户仅购买1次</p>
                            <ActionButton variant="soft" size="small">立即购买</ActionButton>
                        </div>
                    </div>
                </section>
                <section aria-labelledby="stats-title">
                    <div className="flex items-center justify-between">
                        <h2 id="stats-title" className="home-page__section-title flex items-center size-32 bold-6">链上公示</h2>
                        <p className="home-page__sync flex items-center size-24">即时同步</p>
                    </div>
                    <div className="home-page__stats grid grid-2 mt-30">
                        {STATS.map((stat) => <article className="home-page__stat" key={stat.label}>
                            <img src={stat.icon} alt="" />
                            <p className="home-page__stat-value size-36 bold-5">7,584.988326</p>
                            <p className="home-page__muted size-24 mt-4">{stat.label}</p>
                        </article>)}
                    </div>
                </section>
            </div>
            <Popup
                show={showCheckinPopup}
                title="每日签到"
                contentClassName="home-page__checkin-popup"
                onClose={() => setShowCheckinPopup(false)}
            >
                <div className="home-page__checkin-popup-body tc">
                    <p className="size-28">
                        需支付手续费 <span className="home-page__checkin-popup-fee bold-6">0.01</span> BNB
                    </p>
                    <ActionButton onClick={handleCheckinConfirm}>确认签到</ActionButton>
                </div>
            </Popup>
            <Popup
                show={showReservePopup}
                title="预约签到"
                contentClassName="home-page__checkin-popup home-page__reserve-popup"
                onClose={handleReserveClose}
            >
                <div className="home-page__reserve-popup-body">
                    <div className="home-page__reserve-field">
                        <Input
                            value={reserveDays}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label="预约签到天数"
                            placeholder="请输入预约签到天数"
                            onChange={(event) => setReserveDays(event.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                    <dl className="home-page__reserve-fees flex flex-column">
                        <div className="flex items-center justify-between">
                            <dt>单日手续费</dt>
                            <dd>-- BNB</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>合计手续费</dt>
                            <dd>-- BNB</dd>
                        </div>
                    </dl>
                    <ActionButton onClick={handleReserveConfirm}>确认预约</ActionButton>
                </div>
            </Popup>
            <Toast message={message} />
        </div>
    )
}
