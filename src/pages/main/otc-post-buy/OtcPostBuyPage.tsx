import { useState, type CSSProperties, type FormEvent } from 'react'

import background from '@/assets/otc/post-buy-background.png'
import huIcon from '@/assets/stake/assetsHu.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'

import { getOtcPostBuyValidation } from './form.ts'
import './OtcPostBuyPage.scss'

const AVAILABLE_HU = '7,584.988326'
const AVAILABLE_HU_INPUT = '7584.988326'

/** Static publishing form; no market feed, balance request, wallet or trade submission. */
export function OtcPostBuyPage() {
    const [unitPrice, setUnitPrice] = useState('')
    const [quantity, setQuantity] = useState('')
    const [invalidUnitPrice, setInvalidUnitPrice] = useState(false)
    const [invalidQuantity, setInvalidQuantity] = useState(false)
    const { message, showToast } = useToast()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const { invalidUnitPrice: nextInvalidUnitPrice, invalidQuantity: nextInvalidQuantity } = getOtcPostBuyValidation(unitPrice, quantity)
        setInvalidUnitPrice(nextInvalidUnitPrice)
        setInvalidQuantity(nextInvalidQuantity)

        if (nextInvalidUnitPrice || nextInvalidQuantity) {
            showToast(nextInvalidUnitPrice ? '请输入挂买单价' : '请输入挂买数量')
            return
        }

        showToast('发布挂买当前为静态演示，未提交订单')
    }

    return (
        <div
            className="otc-post-buy-page"
            data-page="otc-post-buy"
            style={{ '--otc-post-buy-background': `url(${background})` } as CSSProperties}
        >
            <SecondaryHeader title="发布挂买" />

            <main className="otc-post-buy-page__main">
                <section className="otc-post-buy-page__summary tc" aria-label="HU 行情与可用余额">
                    <p className="otc-post-buy-page__price-label size-28">HU实时价</p>
                    <p className="otc-post-buy-page__price flex items-center justify-center bold-5">
                        <img src={usdtIcon} alt="USDT" />
                        <span>0.008842</span>
                    </p>

                    <div className="otc-post-buy-page__balances grid grid-2">
                        <article className="otc-post-buy-page__balance-card tl">
                            <img src={usdtIcon} alt="USDT" />
                            <p className="size-32 bold-5">7,584.988326</p>
                            <p className="size-28">USDT可用</p>
                        </article>
                        <article className="otc-post-buy-page__balance-card tl">
                            <img src={huIcon} alt="HU" />
                            <p className="size-32 bold-5">{AVAILABLE_HU}</p>
                            <p className="size-28">HU可用</p>
                        </article>
                    </div>
                </section>

                <form className="otc-post-buy-page__form" onSubmit={handleSubmit} noValidate>
                    <div className="otc-post-buy-page__field">
                        <label htmlFor="otc-post-buy-price" className="size-30">挂买单价</label>
                        <Input
                            id="otc-post-buy-price"
                            name="unitPrice"
                            value={unitPrice}
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="输入挂买的单价"
                            aria-invalid={invalidUnitPrice || undefined}
                            suffix={<img src={usdtIcon} alt="USDT" />}
                            onChange={(event) => {
                                setUnitPrice(event.target.value)
                                setInvalidUnitPrice(false)
                            }}
                        />
                    </div>

                    <div className="otc-post-buy-page__field">
                        <div className="flex items-center justify-between">
                            <label htmlFor="otc-post-buy-quantity" className="size-30">挂买数量</label>
                            <button
                                type="button"
                                className="otc-post-buy-page__all size-24"
                                onClick={() => {
                                    setQuantity(AVAILABLE_HU_INPUT)
                                    setInvalidQuantity(false)
                                }}
                            >
                                全部
                            </button>
                        </div>
                        <Input
                            id="otc-post-buy-quantity"
                            name="quantity"
                            value={quantity}
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="输入挂买的数量"
                            aria-invalid={invalidQuantity || undefined}
                            suffix={<img src={huIcon} alt="HU" />}
                            onChange={(event) => {
                                setQuantity(event.target.value)
                                setInvalidQuantity(false)
                            }}
                        />
                    </div>

                    <ActionButton type="submit">发布</ActionButton>
                </form>
            </main>

            <Toast message={message} />
        </div>
    )
}
