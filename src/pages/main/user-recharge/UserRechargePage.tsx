import { useState, type FormEvent } from 'react'

import copyIcon from '@/assets/user-recharge/copy.svg'
import qrBackdrop from '@/assets/user-recharge/qr-backdrop.png'
import qrCodeImage from '@/assets/user-recharge/qr-code.png'
import qrScannerFrame from '@/assets/user-recharge/qr-scanner-frame.png'
import recordsIcon from '@/assets/user-recharge/records.png'
import selectArrowIcon from '@/assets/user-recharge/select-arrow.png'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { Picker, type PickerOption } from '@/components/Picker'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'

import './UserRechargePage.scss'

const RECHARGE_ADDRESS = '0xalifuiewhgouerg564vbfd8sv69a45s8xc4asc4as86cs'
const ASSET_OPTIONS: PickerOption[] = [{ label: 'USDT', value: 'USDT' }]
const CHAIN_OPTIONS: PickerOption[] = [{ label: 'TRX20', value: 'TRX20' }]

type PickerType = 'asset' | 'chain' | null

export function UserRechargePage() {
    const [asset, setAsset] = useState('USDT')
    const [chain, setChain] = useState('TRX20')
    const [amount, setAmount] = useState('')
    const [pickerType, setPickerType] = useState<PickerType>(null)
    const { message, showToast } = useToast()

    const pickerOptions = pickerType === 'chain' ? CHAIN_OPTIONS : ASSET_OPTIONS
    const pickerTitle = pickerType === 'chain' ? '选择充值链' : '选择充值币种'

    function handlePickerConfirm(option?: PickerOption) {
        if (typeof option?.value !== 'string') return

        if (pickerType === 'chain') {
            setChain(option.value)
            return
        }

        setAsset(option.value)
    }

    async function handleCopyAddress() {
        const copied = await copyTextToClipboard(RECHARGE_ADDRESS)
        showToast(copied ? '充值地址已复制' : `充值地址：${RECHARGE_ADDRESS}`)
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!amount.trim()) {
            showToast('请输入充值金额')
            return
        }

        showToast('充值功能当前为静态演示，未提交交易')
    }

    return (
        <div className="user-recharge-page" data-page="user-recharge">
            <SecondaryHeader
                title="充值"
                right={(
                    <button
                        type="button"
                        className="user-recharge-page__records"
                        aria-label="查看充值记录"
                        onClick={() => showToast('充值记录功能当前为静态演示')}
                    >
                        <img src={recordsIcon} alt="" />
                    </button>
                )}
            />

            <main className="user-recharge-page__main">
                <section className="user-recharge-page__method" aria-label="充值信息">
                    <button
                        type="button"
                        className="user-recharge-page__selector flex items-center justify-between"
                        aria-haspopup="dialog"
                        aria-expanded={pickerType === 'asset'}
                        onClick={() => setPickerType('asset')}
                    >
                        <span className="user-recharge-page__method-label">充值币种</span>
                        <span className="user-recharge-page__selector-value flex items-center">
                            {asset}<img src={selectArrowIcon} alt="" />
                        </span>
                    </button>

                    <button
                        type="button"
                        className="user-recharge-page__selector flex items-center justify-between"
                        aria-haspopup="dialog"
                        aria-expanded={pickerType === 'chain'}
                        onClick={() => setPickerType('chain')}
                    >
                        <span className="user-recharge-page__method-label">充值链</span>
                        <span className="user-recharge-page__selector-value flex items-center">
                            {chain}<img src={selectArrowIcon} alt="" />
                        </span>
                    </button>

                    <div className="user-recharge-page__address-row flex justify-between">
                        <span className="user-recharge-page__method-label">充值地址</span>
                        <div className="user-recharge-page__address-value flex items-center justify-between">
                            <p>
                                <span>0xalifuiewhgouerg564vbfd8sv69a</span>
                                <span>45s8xc4asc4as86cs</span>
                            </p>
                            <button
                                type="button"
                                className="user-recharge-page__copy"
                                aria-label="复制充值地址"
                                onClick={() => { void handleCopyAddress() }}
                            >
                                <img src={copyIcon} alt="" />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="user-recharge-page__qr" aria-label="充值二维码">
                    <img className="user-recharge-page__qr-frame" src={qrScannerFrame} alt="" />
                    <img className="user-recharge-page__qr-backdrop" src={qrBackdrop} alt="" />
                    <img className="user-recharge-page__qr-code" src={qrCodeImage} alt="充值地址二维码" />
                </section>

                <form className="user-recharge-page__form" onSubmit={handleSubmit} noValidate>
                    <Input
                        id="user-recharge-amount"
                        name="amount"
                        value={amount}
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label="充值金额"
                        placeholder="请输入充值金额"
                        onChange={(event) => setAmount(event.target.value)}
                    />

                    <ActionButton type="submit" className="user-recharge-page__submit size-28">
                        确认充值
                    </ActionButton>
                </form>

                <p className="user-recharge-page__warning">
                    1、请勿向上述地址充值任何非USDT资产，否则资产不可找回。<br />
                    2、最小充值金额为:0.01USDT,小于最小金额的充值将不会上账且无法退回。
                </p>
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
