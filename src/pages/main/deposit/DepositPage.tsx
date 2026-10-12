import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import recordIcon from '@/assets/deposit/record.svg'
import copyIcon from '@/assets/deposit/address-copy.svg'
import selectChevron from '@/assets/deposit/select-chevron.svg'
import qrBackground from '@/assets/deposit/qr-background.png'
import { Picker, type PickerOption } from '@/components/Picker'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Input } from '@/components/Input'
import { ActionButton } from '@/components/ActionButton'
import { ContractLoading } from '@/components/ContractLoading'
import { useSessionStore } from '@/features/auth/state.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { depositUsdt, getDepositPhase, subscribeDeposit } from '@/features/deposits/flow.ts'
import { normalizeRechargeAmount } from '@/services/contracts/usdt.ts'
import { waitForDappContractDataSync } from '@/services/dapp/index.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import { Toast, useToast } from '@/components/Toast'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'
import { useRechargeAddress } from './useRechargeAddress.ts'
import './DepositPage.scss'

const COIN_OPTIONS = [{ label: '余额', value: 'USDT' }] satisfies PickerOption[]
const RECHARGE_ERRORS = ['请输入有效充值数量', '充值地址无效', '充值合约未配置', '充值合约精度无效',
    '充值数量超出币种精度', '钱包账户已变化，请重新登录', '请切换到充值网络', '已取消钱包转账',
    '转账结果待确认，请检查钱包交易记录，勿重复转账', '余额不足', 'Gas费用不足', '交易执行失败']

export function DepositPage() {
    const { t } = useTranslation()
    const [selector, setSelector] = useState<'coin' | null>(null)
    const { pushRoute } = useAppNavigate()
    const { address, loading, failed, retry } = useRechargeAddress()
    const { message, variant, showToast } = useToast()
    const [amount, setAmount] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const account = useSessionStore(state => state.user?.address ?? '')
    const phase = useSyncExternalStore(subscribeDeposit, () => getDepositPhase(account), () => 'idle')
    const busy = submitting || phase === 'sending'
    const pending = useRef(false)
    const mounted = useRef(true)
    const currentAccount = useRef(account)
    currentAccount.current = account
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (pending.current || busy || !address) return
        const normalized = normalizeRechargeAmount(amount)
        if (!normalized) { showToast(t('请输入有效充值数量'), 'error'); return }
        pending.current = true
        setSubmitting(true)
        const isActive = () => mounted.current && currentAccount.current === account
        let success = false
        try {
            await depositUsdt(account, address, normalized)
            success = true
        } catch (error) {
            if (isActive() && !wasHttpErrorReported(error)) {
                const key = error instanceof Error && RECHARGE_ERRORS.includes(error.message)
                    ? error.message : '充值转账失败，请检查钱包记录'
                showToast(t(key), 'error')
            }
        } finally {
            pending.current = false
            if (mounted.current) setSubmitting(false)
        }
        if (!success || !isActive()) return
        setAmount('')
        showToast(t('充值成功'), 'success')
        try {
            await waitForDappContractDataSync()
            if (isActive()) await refreshCurrentUser()
        } catch (error) {
            if (isActive() && !wasHttpErrorReported(error)) showToast(t('充值成功，余额刷新失败'), 'error')
        }
    }
    async function handleCopy() {
        if (!address) return
        const copied = await copyTextToClipboard(address)
        showToast(copied ? t('复制成功') : t('复制失败'), copied ? 'success' : 'error')
    }

    return (
        <div className="deposit-page min-vh-100">
            <SecondaryHeader
                title={t("充值")}
                right={(
                    <button
                        type="button"
                        className="deposit-page__record"
                        aria-label={t("充值记录")}
                        onClick={() => pushRoute(ROUTE_PATH.depositRecords)}
                    ><img src={recordIcon} alt="" /></button>
                )}
            />
            <main className="deposit-page__content">
                <section className="deposit-page__information" aria-label={t("充值信息")}>
                    <button
                        type="button"
                        className="deposit-page__row flex items-center justify-between"
                        disabled={busy}
                        aria-label={t("选择充值币种")}
                        aria-haspopup="dialog"
                        aria-expanded={selector === 'coin'}
                        onClick={() => setSelector('coin')}
                    >
                        <span className="deposit-page__label">{t("充值币种")}</span>
                        <span className="deposit-page__selection flex items-center">{t("余额")}<img src={selectChevron} alt="" /></span>
                    </button>
                    <div className="deposit-page__row flex items-center justify-between">
                        <span className="deposit-page__label">{t("充值链")}</span>
                        <span className="deposit-page__selection">BSC20</span>
                    </div>
                    <div className="deposit-page__address-row flex justify-between">
                        <span className="deposit-page__label">{t("充值地址")}</span>
                        <div className="deposit-page__address-content flex items-center">
                            <span className="deposit-page__address">{address ?? (loading ? t("充值地址加载中") : "--")}</span>
                            <button type="button" className="deposit-page__copy" aria-label={t("复制充值地址")} disabled={!address} onClick={() => void handleCopy()}>
                                <img src={copyIcon} alt="" />
                            </button>
                        </div>
                    </div>
                </section>

                {failed ? <div className="tc"><p>{t('获取充值地址失败')}</p><button className="auto-btn" type="button" disabled={busy} onClick={retry}>{t('重新加载')}</button></div> : null}

                {address ? (
                    <figure className="deposit-page__qr" aria-label={t('充值二维码')}>
                        <div className="deposit-page__qr-frame">
                            <span className="deposit-page__corner deposit-page__corner--top-left" aria-hidden="true" />
                            <span className="deposit-page__corner deposit-page__corner--top-right" aria-hidden="true" />
                            <span className="deposit-page__corner deposit-page__corner--bottom-left" aria-hidden="true" />
                            <span className="deposit-page__corner deposit-page__corner--bottom-right" aria-hidden="true" />
                            <div className="deposit-page__qr-image">
                                <img className="deposit-page__qr-background" src={qrBackground} alt="" />
                                <QRCodeSVG className="deposit-page__qr-code" value={address} size={300} level="M" marginSize={4} title={t('充值二维码')} role="img" />
                            </div>
                        </div>
                    </figure>
                ) : null}

                <form className="deposit-page__form" onSubmit={handleSubmit} aria-labelledby="deposit-amount-label">
                    <label id="deposit-amount-label" htmlFor="deposit-amount" className="deposit-page__label">{t('充值数量')}</label>
                    <Input id="deposit-amount" name="amount" type="text" inputMode="decimal" autoComplete="off"
                        placeholder={t('请输入充值数量')} value={amount} disabled={busy}
                        onChange={event => setAmount(event.target.value)} suffix={t('余额')} />
                    <ActionButton type="submit" loading={busy} disabled={!address || loading || !account}>{t('确认充值')}</ActionButton>
                </form>

                <ol className="deposit-page__notice" aria-label={t("充值说明")}>
                    <li>{t("请核对充值币种与网络，勿向充值地址转入不匹配的资产。")}</li>
                    <li>{t("到账条件与最低充值金额以平台实际配置为准。")}</li>
                </ol>
            </main>

            <Picker
                show={selector !== null}
                className="deposit-page__coin-picker"
                title={t("选择充值币种")}
                options={COIN_OPTIONS.map(option => ({ ...option, label: t(option.label) }))}
                value={0}
                onClose={() => setSelector(null)}
            />
            <Toast message={message} variant={variant} />
            <ContractLoading show={busy} />
        </div>
    )
}
