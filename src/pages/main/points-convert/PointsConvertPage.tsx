import { useState, type CSSProperties, type FormEvent } from 'react'

import background from '@/assets/points-convert/background.png'
import pointsMarketIcon from '@/assets/points-convert/points-market.png'
import pointsIcon from '@/assets/points-convert/points.png'
import powerIcon from '@/assets/points-convert/power.png'
import swapDownIcon from '@/assets/points-convert/swap-down.png'
import walletIcon from '@/assets/points-convert/wallet.png'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'

import './PointsConvertPage.scss'

const AVAILABLE_POINTS = '52,42'
const AVAILABLE_POWER = '52,42'

/** Static conversion preview; no rate calculation, balance read or transaction submission. */
export function PointsConvertPage() {
    const [pointsAmount, setPointsAmount] = useState('0')
    const { message, showToast } = useToast()
    const hasEnteredPoints = pointsAmount !== '' && pointsAmount !== '0'

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        showToast('积分兑换算力当前为静态演示，未提交交易')
    }

    return (
        <div
            className="points-convert-page"
            data-page="points-convert"
            style={{ '--points-convert-background': `url(${background})` } as CSSProperties}
        >
            <SecondaryHeader title="兑换" />

            <main className="points-convert-page__main">
                <form className="points-convert-page__form" onSubmit={handleSubmit}>
                    <div className="points-convert-page__exchange flex flex-column">
                        <section className="points-convert-page__card points-convert-page__card--out" aria-labelledby="points-convert-out-label">
                            <header className="points-convert-page__card-header flex items-center justify-between">
                                <label id="points-convert-out-label" htmlFor="points-convert-amount" className="points-convert-page__card-label size-24">
                                    转出
                                </label>
                                <div className="points-convert-page__balance flex items-center size-24">
                                    <img src={walletIcon} alt="" />
                                    <strong className="bold-5">{AVAILABLE_POINTS}</strong>
                                    <span>积分</span>
                                    <button type="button" className="points-convert-page__all size-22 bold-5"
                                        onClick={() => setPointsAmount(AVAILABLE_POINTS)}>
                                        全部
                                    </button>
                                </div>
                            </header>

                            <div className="points-convert-page__asset-row flex items-center justify-between">
                                <span className="points-convert-page__asset-pill flex items-center size-28">
                                    <img src={pointsIcon} alt="" />积分
                                </span>
                                <div className="points-convert-page__amount-field">
                                    <Input
                                        id="points-convert-amount"
                                        name="pointsAmount"
                                        className={`points-convert-page__amount bold-5${hasEnteredPoints ? ' points-convert-page__amount--filled' : ''}`}
                                        value={pointsAmount}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        aria-label="转出积分数量"
                                        onFocus={() => {
                                            if (pointsAmount === '0') setPointsAmount('')
                                        }}
                                        onBlur={() => {
                                            if (!pointsAmount.trim()) setPointsAmount('0')
                                        }}
                                        onChange={(event) => setPointsAmount(event.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <img className="points-convert-page__swap" src={swapDownIcon} alt="转为算力" />

                        <section className="points-convert-page__card points-convert-page__card--in" aria-labelledby="points-convert-in-label">
                            <header className="points-convert-page__card-header flex items-center justify-between">
                                <h2 id="points-convert-in-label" className="points-convert-page__card-label size-24 bold-4">转入</h2>
                                <div className="points-convert-page__balance flex items-center size-24">
                                    <img src={walletIcon} alt="" />
                                    <strong className="bold-5">{AVAILABLE_POWER}</strong>
                                    <span>算力</span>
                                </div>
                            </header>

                            <div className="points-convert-page__asset-row flex items-center justify-between">
                                <span className="points-convert-page__asset-pill flex items-center size-28">
                                    <img src={powerIcon} alt="" />算力
                                </span>
                                <output className="points-convert-page__amount points-convert-page__amount--output bold-5" htmlFor="points-convert-amount">
                                    0
                                </output>
                            </div>
                        </section>
                    </div>

                    <ActionButton type="submit" className="points-convert-page__submit">确认兑换</ActionButton>
                </form>

                <section className="points-convert-page__market" aria-labelledby="points-convert-market-title">
                    <header className="points-convert-page__market-summary flex items-center">
                        <span className="points-convert-page__market-badge flex-center" aria-hidden="true">
                            <img className="points-convert-page__market-icon" src={pointsMarketIcon} alt="" />
                        </span>
                        <div className="points-convert-page__market-copy flex flex-column">
                            <h2 id="points-convert-market-title" className="size-24 bold-4">积分实时价格</h2>
                            <p className="points-convert-page__market-price size-40 bold-5">0.1596 USDT</p>
                        </div>
                        <span className="points-convert-page__change size-24">+0.16%</span>
                    </header>

                    <div className="points-convert-page__market-period flex items-center justify-between size-24">
                        <span>08/19-09/11</span>
                        <span>左右拖动查看更多早日期</span>
                    </div>

                    <div
                        className="points-convert-page__chart-placeholder"
                        role="img"
                        aria-label="积分行情蜡烛图，当前暂无数据"
                    />
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}
