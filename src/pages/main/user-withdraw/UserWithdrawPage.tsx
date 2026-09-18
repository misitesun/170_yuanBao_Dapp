import { useState, type FormEvent } from 'react'

import recordsIcon from '@/assets/user-withdraw/records.png'
import selectArrowIcon from '@/assets/user-withdraw/select-arrow.png'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { Picker, type PickerOption } from '@/components/Picker'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import './UserWithdrawPage.scss'

const AVAILABLE_BALANCE = '4568.2684'
const ASSET_OPTIONS: PickerOption[] = [{ label: 'USDT', value: 'USDT' }]
const CHAIN_OPTIONS: PickerOption[] = [{ label: 'TRX20', value: 'TRX20' }]

type PickerType = 'asset' | 'chain' | null

export function UserWithdrawPage() {
    const [asset, setAsset] = useState('USDT')
    const [chain, setChain] = useState('TRX20')
    const [amount, setAmount] = useState('')
    const [pickerType, setPickerType] = useState<PickerType>(null)
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()

    const pickerOptions = pickerType === 'chain' ? CHAIN_OPTIONS : ASSET_OPTIONS
    const pickerTitle = pickerType === 'chain' ? '选择提取链' : '选择提取币种'

    function handlePickerConfirm(option?: PickerOption) {
        if (typeof option?.value !== 'string') return

        if (pickerType === 'chain') {
            setChain(option.value)
            return
        }

        setAsset(option.value)
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!amount.trim()) {
            showToast('请输入提取数量')
            return
        }

        showToast('提取功能当前为静态演示，未提交交易')
    }

    return (
        <div className="user-withdraw-page" data-page="user-withdraw">
            <SecondaryHeader
                title="提取"
                right={(
                    <button
                        type="button"
                        className="user-withdraw-page__records"
                        aria-label="查看提取记录"
                        onClick={() => pushRoute(ROUTE_PATH.userWithdrawRecords)}
                    >
                        <img src={recordsIcon} alt="" />
                    </button>
                )}
            />

            <main className="user-withdraw-page__main">
                <section className="user-withdraw-page__method" aria-label="提取方式">
                    <button
                        type="button"
                        className="user-withdraw-page__selector flex items-center justify-between"
                        aria-haspopup="dialog"
                        aria-expanded={pickerType === 'asset'}
                        onClick={() => setPickerType('asset')}
                    >
                        <span className="user-withdraw-page__selector-label size-28">提取币种</span>
                        <span className="user-withdraw-page__selector-value flex items-center size-28">
                            {asset}<img src={selectArrowIcon} alt="" />
                        </span>
                    </button>
                    <button
                        type="button"
                        className="user-withdraw-page__selector flex items-center justify-between"
                        aria-haspopup="dialog"
                        aria-expanded={pickerType === 'chain'}
                        onClick={() => setPickerType('chain')}
                    >
                        <span className="user-withdraw-page__selector-label size-28">提取链</span>
                        <span className="user-withdraw-page__selector-value flex items-center size-28">
                            {chain}<img src={selectArrowIcon} alt="" />
                        </span>
                    </button>
                </section>

                <form className="user-withdraw-page__form" onSubmit={handleSubmit} noValidate>
                    <div className="user-withdraw-page__amount-heading flex items-center justify-between">
                        <label htmlFor="user-withdraw-amount" className="size-28">提取数量</label>
                        <p className="user-withdraw-page__available size-24">可用：{AVAILABLE_BALANCE} {asset}</p>
                    </div>

                    <div className="user-withdraw-page__amount-field">
                        <Input
                            id="user-withdraw-amount"
                            name="amount"
                            value={amount}
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label="提取数量"
                            suffix={(
                                <button
                                    type="button"
                                    className="user-withdraw-page__all size-24 bold-6"
                                    onClick={() => setAmount(AVAILABLE_BALANCE)}
                                >
                                    全部
                                </button>
                            )}
                            onChange={(event) => setAmount(event.target.value)}
                        />
                    </div>

                    <p className="user-withdraw-page__fee size-24">手续费 0.1%</p>
                    <ActionButton type="submit" className="user-withdraw-page__submit size-28">提取</ActionButton>
                </form>
            </main>

            <Picker
                show={pickerType !== null}
                options={pickerOptions}
                value={0}
                title={pickerTitle}
                onClose={() => setPickerType(null)}
                onConfirm={({ option }) => handlePickerConfirm(option)}
            />
            <Toast message={message} />
        </div>
    )
}
