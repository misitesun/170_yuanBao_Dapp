export type OtcOrderTab = 'buy' | 'sell'
export type OtcOrderStatus = 'trading' | 'cancelled' | 'completed'

export interface MockOtcTradeOrder {
    id: string
    tab: OtcOrderTab
    status: OtcOrderStatus
    createdAt: string
    unitPrice: string
    quantity: string
    total: string
}

export interface MockOtcTradeOrderPage {
    items: readonly MockOtcTradeOrder[]
    hasMore: boolean
    page: number
}

export const OTC_ORDER_PAGE_SIZE = 4

const BUY_ORDER_STATUSES: readonly OtcOrderStatus[] = [
    'trading',
    'trading',
    'cancelled',
    'completed',
    'completed',
    'completed',
    'trading',
    'cancelled',
    'completed',
    'completed',
    'completed',
    'completed',
]

function createMockOrders(
    tab: OtcOrderTab,
    statuses: readonly OtcOrderStatus[],
): readonly MockOtcTradeOrder[] {
    return statuses.map((status, index) => ({
        id: `${tab}-otc-order-${index + 1}`,
        tab,
        status,
        createdAt: '2025.12.30 09:34:54',
        unitPrice: '0.453216',
        quantity: '48',
        total: '32.3424',
    }))
}

export const MOCK_OTC_TRADE_ORDERS: Readonly<Record<OtcOrderTab, readonly MockOtcTradeOrder[]>> = {
    buy: createMockOrders('buy', BUY_ORDER_STATUSES),
    sell: createMockOrders('sell', Array.from({ length: 12 }, () => 'completed')),
}

export function getMockOtcTradeOrderPage(
    tab: OtcOrderTab,
    requestedPage: number,
    pageSize = OTC_ORDER_PAGE_SIZE,
): MockOtcTradeOrderPage {
    const safePage = Math.max(1, Math.floor(requestedPage))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const orders = MOCK_OTC_TRADE_ORDERS[tab]
    const end = Math.min(safePage * safePageSize, orders.length)

    return {
        items: orders.slice(0, end),
        hasMore: end < orders.length,
        page: safePage,
    }
}
