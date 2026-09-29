import { Trans, useTranslation } from 'react-i18next'
import { wasHttpErrorReported } from '@/services/http/index.ts'

import { useCallback } from 'react'

import depositIcon from '@/assets/common/action-deposit.png'
import transferIcon from '@/assets/common/action-transfer.png'
import withdrawIcon from '@/assets/common/action-withdraw.png'
import titleDivider from '@/assets/common/title-divider.png'
import baoqiIcon from '@/assets/common/token-baoqi.png'
import usdtIcon from '@/assets/common/token-usdt.png'
import yuanqiIcon from '@/assets/common/token-yuanqi.png'
import { DropletLoading } from '@/components/DropletLoading'
import { PagePullRefresh } from '@/components/PagePullRefresh'
import { Empty } from '@/components/Empty'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'

import { usePreviewList } from '../pagination/usePreviewList.ts'
import { loadAssetsPage, type AssetType } from './service.ts'
import './AssetsPage.scss'


const BALANCES = [
    { type: 'usdt', label: 'USDT', icon: usdtIcon },
    { type: 'yuanqi', label: '元气', icon: yuanqiIcon },
    { type: 'baoqi', label: '宝气', icon: baoqiIcon },
] as const

const ACTIONS = [
    { type: 'deposit', label: '充值', icon: depositIcon },
    { type: 'withdraw', label: '提现', icon: withdrawIcon },
    { type: 'transfer', label: '转账', icon: transferIcon },
] as const

function AssetsContent({ onError, onUnavailable }: { onError: (error?: unknown) => void; onUnavailable: () => void }) {
    const { t } = useTranslation()
    const ASSET_TABS = [
        { value: 'usdt', label: t('USDT明细') },
        { value: 'yuanqi', label: t('元气明细') },
        { value: 'baoqi', label: t('宝气明细') },
    ] as const
    const { state, pagination } = usePreviewList(loadAssetsPage, 'usdt' as AssetType, onError)
    const assetType = state.query
    const overview = state.overview ?? { usdt: '—', yuanqi: '—', baoqi: '—' }

    function selectAsset(value: AssetType) {
        if (value !== assetType) void pagination.replace(value).catch(onError)
    }

    return (
        <div className="assets-page">
            <section className="assets-page__hero" aria-labelledby="assets-title">
                <h1 id="assets-title" className="assets-page__title tc"><Trans i18nKey="<0>资产</0>全览" components={[<span key="accent" />]} /></h1>
                <p className="assets-page__subtitle tc">{t("珍藏每一次收获，查看你拥有的元宝卡")}</p>
                <img className="assets-page__divider" src={titleDivider} alt="" />
            </section>

            <section className="assets-page__overview" aria-label={t("资产余额")}>
                <ul className="assets-page__balances">
                    {BALANCES.map((asset) => (
                        <li key={asset.type}>
                            <article className={`assets-page__balance assets-page__balance--${asset.type}`}>
                                <h2 className="assets-page__asset-name flex items-center">
                                    <img src={asset.icon} alt="" />
                                    <span>{t(asset.label)}</span>
                                </h2>
                                <p className="assets-page__amount flex flex-column" aria-label={`${t(asset.label)} ${overview[asset.type]}`}>
                                    <span className="assets-page__integer" aria-hidden="true">{overview[asset.type].split('.')[0]}</span>
                                    {overview[asset.type].includes('.') ? <span className="assets-page__fraction" aria-hidden="true">.{overview[asset.type].split('.')[1]}</span> : null}
                                </p>
                            </article>
                        </li>
                    ))}
                </ul>

                <div className="assets-page__actions" role="group" aria-label={t("资产操作")}>
                    {ACTIONS.map((action) => (
                        <button
                            key={action.type}
                            type="button"
                            className={`assets-page__action assets-page__action--${action.type} flex-center`}
                            onClick={onUnavailable}
                        >
                            <img src={action.icon} alt="" />
                            <span>{t(action.label)}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="assets-page__details" aria-label={t("资产明细")}>
                <SegmentedTabs
                    items={ASSET_TABS}
                    value={assetType}
                    onChange={selectAsset}
                    ariaLabel={t("资产明细类型")}
                    idPrefix="assets-details"
                    className="assets-page__tabs"
                />
                {ASSET_TABS.map((tab) => (
                    <div
                        key={tab.value}
                        id={`assets-details-${tab.value}-panel`}
                        role="tabpanel"
                        aria-labelledby={`assets-details-${tab.value}-tab`}
                        hidden={assetType !== tab.value}
                        className="assets-page__panel"
                        tabIndex={0}
                        aria-busy={assetType === tab.value && (state.isFirstLoading || state.isLoadingMore)}
                    >
                        {assetType === tab.value ? (
                            <>
                                {state.isFirstLoading ? <div className="assets-page__loading flex-center"><DropletLoading size="small" ariaLabel={t("资产明细加载中")} /></div> : null}
                                <ul className="assets-page__records flex flex-column">
                                    {state.items.map((record) => (
                                        <li key={record.id}>
                                            <article className="assets-page__record">
                                                <div className="assets-page__record-heading flex justify-between">
                                                    <h3 className="assets-page__remark">{record.content}</h3>
                                                    <p className={`assets-page__change assets-page__change--${record.tone}`}>{record.amount}</p>
                                                </div>
                                                <time className="assets-page__date" dateTime={record.createdAt.replace(' ', 'T')}>{record.createdAt.replaceAll('-', '.')}</time>
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                                {!state.isFirstLoading && state.items.length === 0 ? (
                                    state.loadError ? (
                                        <div className="assets-page__empty tc">
                                            <p>{t("资产明细加载失败")}</p>
                                            <button className="auto-btn" type="button" onClick={() => void pagination.replace().catch(onError)}>{t("重新加载")}</button>
                                        </div>
                                    ) : <Empty />
                                ) : null}
                            </>
                        ) : null}
                    </div>
                ))}
            </section>
        </div>
    )
}

export function AssetsPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => { if (!wasHttpErrorReported(error)) showToast(t("资产加载失败，请重试"), 'error') }, [showToast, t])
    return (
        <>
            <PagePullRefresh onError={onError}>
                <AssetsContent onError={onError} onUnavailable={() => showToast(t("暂未开放"))} />
            </PagePullRefresh>
            <Toast message={message} variant={variant} />
        </>
    )
}
