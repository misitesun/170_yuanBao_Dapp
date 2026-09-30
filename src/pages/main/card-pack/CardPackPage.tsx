import { Trans, useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import redCard from '@/assets/common/card-red.png'
import blueCard from '@/assets/common/card-blue.png'
import greenCard from '@/assets/common/card-green.png'
import energyIcon from '@/assets/common/energy-icon.png'
import usdtIcon from '@/assets/common/token-usdt.png'
import baoqiIcon from '@/assets/common/token-baoqi.png'
import divider from '@/assets/common/title-divider.png'
import pendingIcon from '@/assets/card-pack/status-pending.png'
import wonIcon from '@/assets/card-pack/status-won.png'
import lostIcon from '@/assets/card-pack/status-lost.png'
import redEmblem from '@/assets/card-pack/card-red-emblem.png'
import blueEmblem from '@/assets/card-pack/card-blue-emblem.png'
import greenEmblem from '@/assets/card-pack/card-green-emblem.png'
import redEnergyIcon from '@/assets/card-pack/energy-red.png'
import { DropletLoading } from '@/components/DropletLoading'
import { Empty } from '@/components/Empty'
import { PagePullRefresh, usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Toast, useToast } from '@/components/Toast'

import { createCardPackPagination } from './pagination.ts'
import { loadCardPackPreviewPage } from './service.ts'
import type { CardPackCardOrder, CardPackOrderType, CardPackQuery, CardPackReleaseOrder, CardPackReleaseStatus, CardPackStatus } from './types.ts'
import './CardPackPage.scss'

const RELEASE_METRICS = [
    { key: 'totalUsdtIncome', label: '累计收益(元气)', tone: 'usdt' },
    { key: 'totalBaoqiIncome', label: '累计收益(宝气)', tone: 'baoqi' },
    { key: 'todayUsdtIncome', label: '今日收益(元气)', tone: 'default' },
    { key: 'todayBaoqiIncome', label: '今日收益(宝气)', tone: 'default' },
    { key: 'period', label: '周期(天)', tone: 'default' },
] as const
const CARD_IMAGES = {
    red: { card: redCard, emblem: redEmblem, energy: redEnergyIcon },
    blue: { card: blueCard, emblem: blueEmblem, energy: energyIcon },
    green: { card: greenCard, emblem: greenEmblem, energy: energyIcon },
}

function DualCurrencyIcon() {
    return (
        <span className="card-pack-page__currency-stack" aria-hidden="true">
            <img src={usdtIcon} alt="" />
            <img src={baoqiIcon} alt="" />
        </span>
    )
}

function CardPackItem({ order }: { order: CardPackCardOrder }) {
    const { t } = useTranslation()
    const images = CARD_IMAGES[order.color]

    return (
        <li className={`card-pack-page__card card-pack-page__card--${order.color}`}>
            <div className="card-pack-page__surface" aria-hidden="true" />
            <img className="card-pack-page__card-image" src={images.card} alt={t(order.name)} />
            <div className="card-pack-page__details">
                <h2 className="card-pack-page__name flex items-center">
                    <img src={images.emblem} alt="" />
                    <span>{t(order.name)}</span>
                </h2>
                <div className="card-pack-page__principal flex flex-column">
                    <p className="card-pack-page__label">{t(order.principalLabel)}</p>
                    <p className="card-pack-page__amount flex items-center">
                        {order.principalAsset === 'usdt-baoqi' ? <DualCurrencyIcon /> : <img src={images.energy} alt="" />}
                        <span>{order.principal}</span>
                    </p>
                    <p className="card-pack-page__date">{t('购买时间：{{time}}', { time: order.purchasedAt })}</p>
                </div>
            </div>
        </li>
    )
}

function ReleaseOrderItem({ order }: { order: CardPackReleaseOrder }) {
    const { t } = useTranslation()
    return (
        <li className="card-pack-page__release-order">
            <div className="card-pack-page__surface" aria-hidden="true" />
            <article className="card-pack-page__release-content" aria-label={t("释放订单收益")}>
                <div className="card-pack-page__release-principal flex flex-column">
                    <p className="card-pack-page__label">{t("本金(余额+宝气）")}</p>
                    <p className="card-pack-page__amount flex items-center">
                        <DualCurrencyIcon />
                        <span>{order.principal}</span>
                    </p>
                    <p className="card-pack-page__date">{t('中奖时间：{{time}}', { time: order.wonAt })}</p>
                </div>
                <dl className="card-pack-page__release-metrics">
                    {RELEASE_METRICS.map((metric) => (
                        <div key={metric.key} className={`card-pack-page__release-metric card-pack-page__release-metric--${metric.tone}`}>
                            <dt>{t(metric.label)}</dt>
                            <dd>{order[metric.key]}</dd>
                        </div>
                    ))}
                </dl>
            </article>
        </li>
    )
}

function CardPackContent({ onError }: { onError: () => void }) {
    const { t } = useTranslation()
    const ORDER_TYPES = [
        { value: 'outgoing', label: t('拍出订单') },
        { value: 'incoming', label: t('拍入订单') },
        { value: 'released', label: t('释放订单') },
    ] as const
    const STATUSES = [
        { value: 'pending', label: <><img src={pendingIcon} alt="" /><span>{t('待开奖')}</span></> },
        { value: 'won', label: <><img src={wonIcon} alt="" /><span>{t('已中奖')}</span></> },
        { value: 'lost', label: <><img src={lostIcon} alt="" /><span>{t('未中奖')}</span></> },
    ] as const
    const RELEASE_STATUSES = [
        { value: 'ongoing', label: <><img src={pendingIcon} alt="" /><span>{t('进行中')}</span></> },
        { value: 'completed', label: <><img src={wonIcon} alt="" /><span>{t('已完成')}</span></> },
    ] as const
    const [pagination] = useState(() => createCardPackPagination(loadCardPackPreviewPage))
    const state = useSyncExternalStore(pagination.subscribe, pagination.getSnapshot, pagination.getSnapshot)
    const query = state.query
    const isRelease = query.orderType === 'released'
    const statusPrefix = isRelease ? 'card-pack-release-status' : 'card-pack-status'

    useEffect(() => {
        void pagination.replace().catch(onError)
        return pagination.invalidate
    }, [onError, pagination])

    usePageRefresh(pagination.replace, !state.isFirstLoading && !state.isLoadingMore)
    usePageLoadMore(pagination.loadMore, {
        enabled: !state.isFirstLoading && !state.isLoadingMore,
        hasMore: state.hasMore,
        loadingIndicator: 'droplet',
        showNoMore: state.items.length > 0,
    })

    function selectQuery(query: CardPackQuery) {
        if (query.orderType === state.query.orderType && query.status === state.query.status) return
        void pagination.replace(query).catch(onError)
    }

    function selectOrderType(orderType: CardPackOrderType) {
        if (orderType === query.orderType) return
        selectQuery(orderType === 'released'
            ? { orderType, status: 'ongoing' }
            : { orderType, status: query.orderType === 'released' ? 'pending' : query.status })
    }

    return (
        <div className={`card-pack-page${isRelease ? ' card-pack-page--released' : ''}`}>
            <section className="card-pack-page__hero flex flex-column items-center tc" aria-labelledby="card-pack-title">
                <h1 id="card-pack-title" className="card-pack-page__title"><Trans i18nKey="我的<0>卡包</0>" components={[<span key="accent" />]} /></h1>
                <p className="card-pack-page__subtitle">{t("珍藏每一次收获，查看你拥有的元宝卡")}</p>
                <img className="card-pack-page__divider" src={divider} alt="" />
            </section>

            <SegmentedTabs<CardPackOrderType>
                className={`card-pack-page__order-types${query.orderType === 'outgoing' ? '' : ' card-pack-page__order-types--centered'}`}
                items={ORDER_TYPES}
                value={state.query.orderType}
                onChange={selectOrderType}
                ariaLabel={t("订单类型")}
                idPrefix="card-pack-order"
            />
            <section id={`card-pack-order-${state.query.orderType}-panel`} role="tabpanel" aria-labelledby={`card-pack-order-${state.query.orderType}-tab`}>
                {query.orderType === 'released' ? <SegmentedTabs<CardPackReleaseStatus>
                    className="card-pack-page__statuses card-pack-page__statuses--release"
                    items={RELEASE_STATUSES}
                    value={query.status}
                    onChange={(status) => selectQuery({ orderType: 'released', status })}
                    ariaLabel={t("释放状态")}
                    idPrefix={statusPrefix}
                /> : <SegmentedTabs<CardPackStatus>
                    className="card-pack-page__statuses"
                    items={STATUSES}
                    value={query.status}
                    onChange={(status) => selectQuery({ orderType: query.orderType, status })}
                    ariaLabel={t("开奖状态")}
                    idPrefix={statusPrefix}
                />}
                <div
                    id={`${statusPrefix}-${query.status}-panel`}
                    className="card-pack-page__results"
                    role="tabpanel"
                    aria-labelledby={`${statusPrefix}-${query.status}-tab`}
                    aria-busy={state.isFirstLoading || state.isLoadingMore}
                >
                    {state.isFirstLoading ? <div className="card-pack-page__loading flex-center"><DropletLoading size="small" ariaLabel={t("订单加载中")} /></div> : null}
                    <ul className={`card-pack-page__list flex flex-column${isRelease ? ' card-pack-page__list--release' : ''}`} aria-label={t("卡包订单")}>
                        {state.items.map((order) => order.kind === 'release'
                            ? <ReleaseOrderItem key={order.id} order={order} />
                            : <CardPackItem key={order.id} order={order} />)}
                    </ul>
                    {!state.isFirstLoading && state.items.length === 0 ? (
                        state.loadError ? (
                            <div className="card-pack-page__empty tc">
                                <p>{t("卡包加载失败")}</p>
                                <button className="auto-btn" type="button" onClick={() => void pagination.replace().catch(onError)}>{t("重新加载")}</button>
                            </div>
                        ) : <Empty className="card-pack-page__empty" />
                    ) : null}
                </div>
            </section>
        </div>
    )
}

export function CardPackPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback(() => showToast(t("卡包加载失败，请重试"), 'error'), [showToast, t])

    return (
        <PagePullRefresh className="card-pack-refresh" onError={onError}>
            <CardPackContent onError={onError} />
            <Toast message={message} variant={variant} />
        </PagePullRefresh>
    )
}
