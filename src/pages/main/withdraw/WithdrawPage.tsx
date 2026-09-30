import { useTranslation } from 'react-i18next'
import { useState, type FormEvent } from 'react'

import recordIcon from '@/assets/deposit/record.svg'
import selectChevron from '@/assets/deposit/select-chevron.svg'
import { Picker, type PickerOption } from '@/components/Picker'
import { Input } from '@/components/Input'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import './WithdrawPage.scss'

const COIN_OPTIONS = [{ label: '余额', value: 'USDT' }] satisfies PickerOption[]
const CHAIN_OPTIONS: PickerOption[] = []

export function WithdrawPage() {
    const { t } = useTranslation()
    const [selector, setSelector] = useState<'coin' | 'chain' | null>(null)
    const [amount, setAmount] = useState('')
    const { message, variant, showToast } = useToast()
    const { pushRoute } = useAppNavigate()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        showToast(t("提现功能待接入"))
    }

    return (
        <div className="withdraw-page min-vh-100">
            <SecondaryHeader
                title={t("提现")}
                right={(
                    <button
                        type="button"
                        className="withdraw-page__record"
                        aria-label={t("提现记录")}
                        onClick={() => pushRoute(ROUTE_PATH.withdrawRecords)}
                    ><img src={recordIcon} alt="" /></button>
                )}
            />
            <main className="withdraw-page__content">
                <section className="withdraw-page__information" aria-label={t("提现信息")}>
                    <button
                        type="button"
                        className="withdraw-page__row flex items-center justify-between"
                        aria-label={t("选择提现币种")}
                        aria-haspopup="dialog"
                        aria-expanded={selector === 'coin'}
                        onClick={() => setSelector('coin')}
                    >
                        <span className="withdraw-page__label">{t("提现币种")}</span>
                        <span className="withdraw-page__selection flex items-center">{t("余额")}<img src={selectChevron} alt="" /></span>
                    </button>
                    <button
                        type="button"
                        className="withdraw-page__row flex items-center justify-between"
                        aria-label={t("选择提现链")}
                        aria-haspopup="dialog"
                        aria-expanded={selector === 'chain'}
                        onClick={() => setSelector('chain')}
                    >
                        <span className="withdraw-page__label">{t("提现链")}</span>
                        <span className="withdraw-page__selection flex items-center">{t("待配置")}<img src={selectChevron} alt="" /></span>
                    </button>
                </section>

                <form className="withdraw-page__summary" aria-labelledby="withdraw-amount-title" onSubmit={handleSubmit}>
                    <div className="withdraw-page__amount-row flex items-center justify-between">
                        <label id="withdraw-amount-title" htmlFor="withdraw-amount" className="withdraw-page__amount-title">{t("提现数量")}</label>
                        <p className="withdraw-page__balance">{t("可用：-- 余额")}</p>
                    </div>
                    <div className="withdraw-page__amount-input">
                        <Input
                            id="withdraw-amount"
                            name="amount"
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder={t("请输入提现数量")}
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            suffix={(
                                <button type="button" className="withdraw-page__all" onClick={() => showToast(t("可用余额待配置"))}>{t("全部")}</button>
                            )}
                        />
                    </div>
                    <p className="withdraw-page__fee">{t("手续费 待配置")}</p>
                    <button type="submit" className="withdraw-page__submit">{t("提现")}</button>
                </form>
            </main>

            <Picker
                show={selector !== null}
                title={selector === 'chain' ? t("选择提现链") : t("选择提现币种")}
                options={selector === 'chain' ? CHAIN_OPTIONS : COIN_OPTIONS.map(option => ({ ...option, label: t(option.label) }))}
                value={0}
                emptyText={t("暂无可用提现链")}
                onClose={() => setSelector(null)}
            />
            <Toast message={message} variant={variant} />
        </div>
    )
}
