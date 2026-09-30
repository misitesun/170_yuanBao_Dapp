import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import recordIcon from '@/assets/deposit/record.svg'
import copyIcon from '@/assets/deposit/address-copy.svg'
import selectChevron from '@/assets/deposit/select-chevron.svg'
import qrBackground from '@/assets/deposit/qr-background.png'
import qrExample from '@/assets/deposit/qr-example-56586a.png'
import { Picker, type PickerOption } from '@/components/Picker'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import './DepositPage.scss'

const COIN_OPTIONS = [{ label: '余额', value: 'USDT' }] satisfies PickerOption[]
const CHAIN_OPTIONS: PickerOption[] = []

export function DepositPage() {
    const { t } = useTranslation()
    const [selector, setSelector] = useState<'coin' | 'chain' | null>(null)
    const { pushRoute } = useAppNavigate()

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
                    <button
                        type="button"
                        className="deposit-page__row flex items-center justify-between"
                        aria-label={t("选择充值链")}
                        aria-haspopup="dialog"
                        aria-expanded={selector === 'chain'}
                        onClick={() => setSelector('chain')}
                    >
                        <span className="deposit-page__label">{t("充值链")}</span>
                        <span className="deposit-page__selection flex items-center">{t("待配置")}<img src={selectChevron} alt="" /></span>
                    </button>
                    <div className="deposit-page__address-row flex justify-between">
                        <span className="deposit-page__label">{t("充值地址")}</span>
                        <div className="deposit-page__address-content flex items-center">
                            <span className="deposit-page__address">--</span>
                            <button type="button" className="deposit-page__copy" aria-label={t("复制充值地址")} disabled title={t("充值地址待配置")}>
                                <img src={copyIcon} alt="" />
                            </button>
                        </div>
                    </div>
                </section>

                <figure className="deposit-page__qr">
                    <div className="deposit-page__qr-frame" aria-label={t("充值二维码设计示例")}>
                        <span className="deposit-page__corner deposit-page__corner--top-left" aria-hidden="true" />
                        <span className="deposit-page__corner deposit-page__corner--top-right" aria-hidden="true" />
                        <span className="deposit-page__corner deposit-page__corner--bottom-left" aria-hidden="true" />
                        <span className="deposit-page__corner deposit-page__corner--bottom-right" aria-hidden="true" />
                        <div className="deposit-page__qr-image">
                            <img className="deposit-page__qr-background" src={qrBackground} alt="" />
                            <img className="deposit-page__qr-code" src={qrExample} alt={t("设计示例二维码")} />
                        </div>
                    </div>
                    <figcaption className="deposit-page__qr-caption tc">{t("设计示例 · 充值地址待配置")}</figcaption>
                </figure>

                <ol className="deposit-page__notice" aria-label={t("充值说明")}>
                    <li>{t("请核对充值币种与网络，勿向充值地址转入不匹配的资产。")}</li>
                    <li>{t("到账条件与最低充值金额以平台实际配置为准。")}</li>
                </ol>
            </main>

            <Picker
                show={selector !== null}
                title={selector === 'chain' ? t("选择充值链") : t("选择充值币种")}
                options={selector === 'chain' ? CHAIN_OPTIONS : COIN_OPTIONS.map(option => ({ ...option, label: t(option.label) }))}
                value={0}
                emptyText={t("暂无可用充值链")}
                onClose={() => setSelector(null)}
            />
        </div>
    )
}
