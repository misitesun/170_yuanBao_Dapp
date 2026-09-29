import { useTranslation } from 'react-i18next'
import { useState, type FormEvent } from 'react'

import baoqiIcon from '@/assets/common/token-baoqi.png'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { Popup } from '@/components/Popup'
import type { useToast } from '@/components/Toast'

import './TransferPopup.scss'

interface TransferPopupProps {
    show: boolean
    onClose: () => void
    showToast: ReturnType<typeof useToast>['showToast']
}

export function TransferPopup({ show, onClose, showToast }: TransferPopupProps) {
    const { t } = useTranslation()
    const [address, setAddress] = useState('')
    const [amount, setAmount] = useState('')

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        showToast(t("转账功能待接入"))
    }

    function resetInputs() {
        setAddress('')
        setAmount('')
    }

    return (
        <Popup show={show} title={<span id="transfer-title">{t("转账")}</span>} onClose={onClose}
            onAfterClose={resetInputs} contentClassName="transfer-popup">
            <form className="transfer-popup__form" role="dialog" aria-modal="true" aria-labelledby="transfer-title"
                onSubmit={handleSubmit} onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
                <div className="transfer-popup__field">
                    <label htmlFor="transfer-address" className="transfer-popup__label">{t("接收地址")}</label>
                    <Input id="transfer-address" name="address" autoComplete="off" spellCheck={false}
                        placeholder={t("请输入对方账户地址")} value={address}
                        onChange={(event) => setAddress(event.target.value)} />
                </div>
                <div className="transfer-popup__field transfer-popup__field--amount">
                    <div className="transfer-popup__amount-heading flex items-center justify-between">
                        <label htmlFor="transfer-amount" className="transfer-popup__label">{t("转账数量")}</label>
                        <button type="button" className="transfer-popup__all"
                            onClick={() => showToast(t("可用余额待配置"))}>{t("全部")}</button>
                    </div>
                    <Input id="transfer-amount" name="amount" inputMode="decimal" autoComplete="off"
                        placeholder={t("请输入转出数量")} value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        suffix={<img src={baoqiIcon} alt={t("宝气")} />} />
                </div>
                <p className="transfer-popup__balance flex items-center justify-between">
                    <span>{t("可用余额")}</span><span className="transfer-popup__balance-value">{t("-- 宝气")}</span>
                </p>
                <ActionButton className="transfer-popup__confirm" type="submit" animated={false}>{t("确认")}</ActionButton>
            </form>
        </Popup>
    )
}
