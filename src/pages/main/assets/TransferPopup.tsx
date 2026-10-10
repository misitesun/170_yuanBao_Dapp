import { ContractLoading } from '@/components/ContractLoading'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import baoqiIcon from '@/assets/common/token-baoqi.png'
import { ActionButton } from '@/components/ActionButton'
import { Input } from '@/components/Input'
import { Popup } from '@/components/Popup'
import type { useToast } from '@/components/Toast'

import { useSessionStore } from '@/features/auth/state.ts'
import { isTransferAddress, normalizeTransferAmount, submitTransfer } from '@/features/transfers/api.ts'
import { compareDecimalNumbers } from '@/shared/calculations/decimalNumbers.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { useTransferConfig } from './useTransferConfig.ts'
import './TransferPopup.scss'

interface TransferPopupProps {
    show: boolean
    onClose: () => void
    showToast: ReturnType<typeof useToast>['showToast']
    onSuccess: () => Promise<void>
    onSubmittingChange: (submitting: boolean) => void
}

export function TransferPopup({ show, onClose, showToast, onSuccess, onSubmittingChange }: TransferPopupProps) {
    const { t } = useTranslation()
    const [address, setAddress] = useState('')
    const [amount, setAmount] = useState('')

    const { config, failed, retry } = useTransferConfig(show)
    const user = useSessionStore(state => state.user)
    const balance = user?.balances.baoqi ?? null
    const [submitting, setSubmitting] = useState(false)
    const pending = useRef(false)
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    function close() { if (!pending.current) onClose() }
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (pending.current || !show) return
        if (!config) { showToast(t('转账配置加载中')); return }
        if (!config.enabled) { showToast(t('转账未开启')); return }
        const recipient = address.trim()
        if (!isTransferAddress(recipient)) { showToast(t('请输入有效接收地址')); return }
        if (recipient.toLowerCase() === user?.address.toLowerCase()) { showToast(t('不能转账给自己')); return }
        const normalized = normalizeTransferAmount(amount)
        if (!normalized) { showToast(t('请输入有效转账数量')); return }
        if (compareDecimalNumbers(normalized, config.minimum) === -1) { showToast(t('最低转账额度为 {{amount}}', { amount: config.minimum })); return }
        if (compareDecimalNumbers(config.feePercent, '100') !== -1) { showToast(t('到账金额必须大于0')); return }
        if (balance === null || compareDecimalNumbers(normalized, balance) === 1) { showToast(t('余额不足')); return }
        pending.current = true
        setSubmitting(true)
        onSubmittingChange(true)
        try {
            await submitTransfer(recipient, normalized)
        } catch (error) {
            pending.current = false
            if (mounted.current) {
                setSubmitting(false)
                onSubmittingChange(false)
                if (!wasHttpErrorReported(error)) showToast(t('转账失败，请重试'), 'error')
            }
            return
        }
        if (mounted.current) {
            showToast(t('转账成功'), 'success')
            setAddress('')
            setAmount('')
            onClose()
        }
        try { await onSuccess() } catch (error) {
            if (mounted.current && !wasHttpErrorReported(error)) showToast(t('转账成功，资产刷新失败'), 'error')
        }
        pending.current = false
        if (mounted.current) { setSubmitting(false); onSubmittingChange(false) }
    }

    function resetInputs() {
        setAddress('')
        setAmount('')
    }

    return (
        <>
            <Popup show={show} title={<span id="transfer-title">{t("转账")}</span>} onClose={close} closeOnOverlayClick={!submitting}
                onAfterClose={resetInputs} contentClassName="transfer-popup">
                <form className="transfer-popup__form" role="dialog" aria-modal="true" aria-labelledby="transfer-title"
                    onSubmit={handleSubmit} onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
                    <div className="transfer-popup__field">
                        <label htmlFor="transfer-address" className="transfer-popup__label">{t("接收地址")}</label>
                        <Input id="transfer-address" name="address" autoComplete="off" spellCheck={false}
                            placeholder={t("请输入对方账户地址")} value={address} disabled={submitting}
                            onChange={(event) => setAddress(event.target.value)} />
                    </div>
                    <div className="transfer-popup__field transfer-popup__field--amount">
                        <div className="transfer-popup__amount-heading flex items-center justify-between">
                            <label htmlFor="transfer-amount" className="transfer-popup__label">{t("转账数量")}</label>
                            <button type="button" className="transfer-popup__all"
                                disabled={submitting || balance === null} onClick={() => { if (balance !== null) setAmount(balance) }}>{t("全部")}</button>
                        </div>
                        <Input id="transfer-amount" name="amount" inputMode="decimal" autoComplete="off"
                            placeholder={t("请输入转出数量")} value={amount} disabled={submitting}
                            onChange={(event) => setAmount(event.target.value)}
                            suffix={<img src={baoqiIcon} alt={t("宝气")} />} />
                    </div>
                    <p className="transfer-popup__balance flex items-center justify-between">
                        <span>{t("可用余额")}</span><span className="transfer-popup__balance-value">{t('{{amount}} 宝气', { amount: balance ?? '--' })}</span>
                    </p>
                    {config ? <p className="transfer-popup__balance">{t('最低转账额度为 {{amount}}', { amount: config.minimum })} · {t('手续费 {{fee}}%', { fee: config.feePercent })}</p> : null}

                    {failed ? <button type="button" className="auto-btn" onClick={retry}>{t('重新加载')}</button> : null}
                    <ActionButton className="transfer-popup__confirm" type="submit" animated={false} loading={submitting}
                        aria-disabled={config && !config.enabled ? true : undefined}
                        disabled={submitting || !config || (config.enabled && balance === null)}>{t("确认")}</ActionButton>
                </form>
            </Popup>
            <ContractLoading show={submitting} />
        </>
    )
}
