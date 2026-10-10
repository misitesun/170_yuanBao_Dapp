import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import recordIcon from '@/assets/deposit/record.svg'
import copyIcon from '@/assets/deposit/address-copy.svg'
import selectChevron from '@/assets/deposit/select-chevron.svg'
import qrBackground from '@/assets/deposit/qr-background.png'
import { Picker, type PickerOption } from '@/components/Picker'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import { Toast, useToast } from '@/components/Toast'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'
import { useRechargeAddress } from './useRechargeAddress.ts'
import './DepositPage.scss'

const COIN_OPTIONS = [{ label: '余额', value: 'USDT' }] satisfies PickerOption[]

export function DepositPage() {
    const { t } = useTranslation()
    const [selector, setSelector] = useState<'coin' | null>(null)
    const { pushRoute } = useAppNavigate()
    const { address, loading, failed, retry } = useRechargeAddress()
    const { message, variant, showToast } = useToast()
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

                {failed ? <div className="tc"><p>{t('获取充值地址失败')}</p><button className="auto-btn" type="button" onClick={retry}>{t('重新加载')}</button></div> : null}

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
        </div>
    )
}
