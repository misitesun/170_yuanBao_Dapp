import { useState, type FormEvent } from 'react'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { Radio } from '@/components/Radio'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH } from '@/router/routes.ts'
import { useAppNavigate } from '@/router/useAppNavigate.ts'
import hero from '@/assets/stake/staking-coins.png'
import star from '@/assets/stake/star.png'
import usdt from '@/assets/stake/usdt.svg'
import hu from '@/assets/stake/hu.png'
import arrow from '@/assets/stake/arrow-right.svg'
import './StakePage.scss'

const ASSETS = [
    { symbol: 'USDT', balance: '2,874.889542', amount: '2874.889542', icon: usdt },
    { symbol: 'HU', balance: '10,124.346788', amount: '10124.346788', icon: hu },
] as const

export function StakePage() {
    const [assetIndex, setAssetIndex] = useState(0)
    const [amount, setAmount] = useState('')
    const [invalid, setInvalid] = useState(false)
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()
    const selected = ASSETS[assetIndex] ?? ASSETS[0]

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!amount.trim()) {
            setInvalid(true)
            showToast('请输入质押金额')
            return
        }
        setInvalid(false)
        showToast('校验通过，当前为静态演示，未提交质押')
    }

    return <div className="stake-page" data-page="stake">
        <section className="stake-page__hero flex flex-column items-center tc">
            <div className="stake-page__hero-art" aria-hidden="true">
                <img className="stake-page__coins" src={hero} alt="" />
                <img className="stake-page__star stake-page__star--right" src={star} alt="" />
                <img className="stake-page__star stake-page__star--left" src={star} alt="" />
            </div>
            <h1 className="stake-page__title bold-7">开启质押计划</h1>
            <p className="app-color size-28 mt-20">支持 USDT 与 HU，即可发起质押</p>
        </section>
        <form className="stake-page__form" onSubmit={handleSubmit} noValidate>
            <fieldset className="stake-page__assets flex flex-column">
                <legend className="stake-page__legend">选择质押资产</legend>
                {ASSETS.map((asset, index) => <label key={asset.symbol} className={`stake-page__asset flex items-center ${assetIndex === index ? 'stake-page__asset--selected' : ''}`}>
                    <span className="stake-page__asset-details flex flex-column">
                        <span className="size-24">质押资产</span>
                        <span className="stake-page__symbol flex items-center size-32 bold-7"><img src={asset.icon} alt="" />{asset.symbol}</span>
                    </span>
                    <span className="stake-page__balance flex flex-column tr">
                        <span className="stake-page__muted size-24">资产余额</span>
                        <span className="size-28">{asset.balance}</span>
                    </span>
                    <Radio name="stake-asset" value={asset.symbol} checked={assetIndex === index} aria-label={asset.symbol} onChange={() => { setAssetIndex(index); setAmount(''); setInvalid(false) }} />
                </label>)}
            </fieldset>
            <div className="stake-page__amount-heading flex items-center justify-between">
                <label htmlFor="stake-amount" className="size-30">质押金额</label>
                <button type="button" className="stake-page__max size-24" onClick={() => { setAmount(selected.amount); setInvalid(false) }}>全部质押</button>
            </div>
            <Input id="stake-amount" name="amount" inputMode="decimal" autoComplete="off" placeholder="输入您希望质押的数量" value={amount} aria-invalid={invalid || undefined}
                onChange={(event) => { setAmount(event.target.value); setInvalid(false) }} suffix={<img src={selected.icon} alt={selected.symbol} />} />
            <p className="stake-page__estimate tr size-24">可获得 <span className="app-color">0.00</span>算力</p>
            <div className="stake-page__actions flex flex-column">
                <ActionButton type="submit">立即质押</ActionButton>
                <ActionButton variant="secondary" onClick={() => pushRoute(ROUTE_PATH.stakeOrders)}>质押订单<img src={arrow} alt="" className="stake-page__arrow" /></ActionButton>
            </div>
        </form>
        <Toast message={message} />
    </div>
}
