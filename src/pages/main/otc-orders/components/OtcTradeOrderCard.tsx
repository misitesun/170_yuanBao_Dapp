import { ActionButton } from '@/components/ActionButton'

import type { MockOtcTradeOrder } from '../pagination.ts'

import './OtcTradeOrderCard.scss'

const STATUS_TEXT = {
    trading: '交易中',
    cancelled: '已撤销',
    completed: '已完成',
} as const

export interface OtcTradeOrderCardProps {
    order: MockOtcTradeOrder
    showDetailAction?: boolean
    onDetail?: () => void
    onCancel?: () => void
}

export function OtcTradeOrderCard({
    order,
    showDetailAction = false,
    onDetail,
    onCancel,
}: OtcTradeOrderCardProps) {
    const actionName = order.tab === 'buy' ? '买入' : '出售'

    return (
        <article className={`otc-trade-order-card otc-trade-order-card--${order.tab} flex flex-column`}>
            <header className="otc-trade-order-card__header flex items-start justify-between">
                <div>
                    <p className="otc-trade-order-card__status bold-6">
                        <strong className="size-30">{actionName}</strong><span className="size-24">/{STATUS_TEXT[order.status]}</span>
                    </p>
                    <time
                        className="otc-trade-order-card__time size-24"
                        dateTime={order.createdAt.replaceAll('.', '-').replace(' ', 'T')}
                    >
                        {order.createdAt}
                    </time>
                </div>

                {showDetailAction && onDetail ? (
                    <button
                        type="button"
                        className="otc-trade-order-card__detail flex items-center size-24"
                        onClick={onDetail}
                    >
                        查看详情 <span aria-hidden="true">›</span>
                    </button>
                ) : null}
            </header>

            <dl className="otc-trade-order-card__metrics grid">
                <div>
                    <dt className="size-20">交易单价(USDT)</dt>
                    <dd className="size-26 bold-5">{order.unitPrice}</dd>
                </div>
                <div>
                    <dt className="size-20">交易数量(HU)</dt>
                    <dd className="size-26 bold-5">{order.quantity}</dd>
                </div>
                <div>
                    <dt className="size-20">交易总额(USDT)</dt>
                    <dd className="size-26 bold-5">{order.total}</dd>
                </div>
            </dl>

            {order.tab === 'buy' && order.status === 'trading' && onCancel ? (
                <ActionButton
                    size="small"
                    variant="soft"
                    className="otc-trade-order-card__cancel"
                    onClick={onCancel}
                >
                    撤销挂买单
                </ActionButton>
            ) : null}
        </article>
    )
}
