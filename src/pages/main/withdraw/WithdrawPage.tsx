import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'

import recordIcon from '@/assets/deposit/record.svg'
import selectChevron from '@/assets/deposit/select-chevron.svg'
import { Picker, type PickerOption } from '@/components/Picker'
import { Input } from '@/components/Input'
import { ContractLoading } from '@/components/ContractLoading'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import { useSessionStore } from '@/features/auth/state.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { normalizeClaimAmount } from '@/features/claims/api.ts'
import { executeClaim, getClaimProgress, startNewClaim, subscribeClaimProgress } from '@/features/claims/flow.ts'
import { compareDecimalNumbers } from '@/shared/calculations/decimalNumbers.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { useClaimConfig } from './useClaimConfig.ts'
import './WithdrawPage.scss'

const COIN_OPTIONS = [{ label: '余额', value: 'USDT' }] satisfies PickerOption[]

export function WithdrawPage() {
    const { t } = useTranslation()
    const [selector, setSelector] = useState<'coin' | null>(null)
    const [amount, setAmount] = useState('')
    const { message, variant, showToast } = useToast()
    const { pushRoute } = useAppNavigate()

    const { config, failed, retry } = useClaimConfig()
    const balance = useSessionStore(state => state.user?.balances.usdt ?? null)
    const account = useSessionStore(state => state.user?.address ?? '')
    const progress = useSyncExternalStore(subscribeClaimProgress, () => getClaimProgress(account))
    const activeAccount = useRef(account)
    activeAccount.current = account
    const [submitting, setSubmitting] = useState(false)
    const busy = submitting || ['requesting', 'checking', 'sending'].includes(progress.phase)
    const locked = progress.phase !== 'idle'
    const pending = useRef(false)
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (pending.current || busy || progress.phase === 'blocked') return
        if (progress.phase === 'complete') { startNewClaim(account); return }
        let normalized = ''
        if (!locked) {
            if (!config) { showToast(t('提现配置加载中')); return }
            if (!config.enabled) { showToast(t('提取功能未开启')); return }
            normalized = normalizeClaimAmount(amount) ?? ''
            if (!normalized) { showToast(t('请输入有效提现数量')); return }
            if (compareDecimalNumbers(normalized, config.minimum) === -1) { showToast(t('最低提现额度为 {{amount}}', { amount: config.minimum })); return }
            if (balance === null) { showToast(t('可用余额待配置')); return }
            if (compareDecimalNumbers(normalized, balance) === 1) { showToast(t('余额不足')); return }
        }
        pending.current = true
        setSubmitting(true)
        const isActive = () => mounted.current && activeAccount.current === account
        try {
            try {
                await executeClaim(account, normalized)
                const result = getClaimProgress(account)
                if (isActive()) {
                    if (result.phase === 'complete') {
                        setAmount('')
                        showToast(t('提现成功'), 'success')
                    } else showToast(t('提现失败'), 'error')
                }
            } catch (error) {
                if (isActive() && !wasHttpErrorReported(error)) {
                    showToast(t('提现失败'), 'error')
                }
            }
            // The API deducts balance before wallet confirmation, even if claiming fails.
            const result = getClaimProgress(account)
            if (isActive() && (result.payload || result.phase === 'blocked')) {
                try { await refreshCurrentUser() } catch (error) {
                    if (isActive() && !wasHttpErrorReported(error)) showToast(t('申请已提交，余额刷新失败'), 'error')
                }
            }
        } finally {
            pending.current = false
            if (mounted.current) setSubmitting(false)
        }
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
                    <div className="withdraw-page__row flex items-center justify-between">
                        <span className="withdraw-page__label">{t("提现链")}</span>
                        <span className="withdraw-page__selection">BSC20</span>
                    </div>
                </section>

                <form className="withdraw-page__summary" aria-labelledby="withdraw-amount-title" onSubmit={handleSubmit}>
                    <div className="withdraw-page__amount-row flex items-center justify-between">
                        <label id="withdraw-amount-title" htmlFor="withdraw-amount" className="withdraw-page__amount-title">{t("提现数量")}</label>
                        <p className="withdraw-page__balance">{t('可用 {{amount}} 余额', { amount: balance ?? '--' })}</p>
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
                            disabled={busy}
                            onChange={(event) => setAmount(event.target.value)}
                            suffix={(
                                <button type="button" className="withdraw-page__all" disabled={busy || balance === null} onClick={() => { if (balance !== null) setAmount(balance) }}>{t("全部")}</button>
                            )}
                        />
                    </div>
                    <p className="withdraw-page__fee">{config ? t('手续费 {{fee}}%', { fee: config.feePercent }) : t('提现配置加载中')}</p>
                    {config && !config.enabled ? <p>{t('提取功能未开启')}</p> : null}
                    {failed ? <button className="auto-btn" type="button" onClick={retry}>{t('重新加载')}</button> : null}
                    <button type="submit" className="withdraw-page__submit" disabled={busy || progress.phase === 'blocked' || (!locked && (!config?.enabled || balance === null))}>
                        {t('提现')}
                    </button>
                </form>
            </main>

            <Picker
                show={selector !== null}
                title={t("选择提现币种")}
                options={COIN_OPTIONS.map(option => ({ ...option, label: t(option.label) }))}
                value={0}
                onClose={() => setSelector(null)}
            />
            <Toast message={message} variant={variant} />
            <ContractLoading show={busy} />
        </div>
    )
}
