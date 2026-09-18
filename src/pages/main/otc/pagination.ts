export interface MockOtcOrder {
    id: string
    address: string
    unitPrice: string
    remaining: string
}

export const OTC_PAGE_SIZE = 4

export const MOCK_OTC_ORDERS: readonly MockOtcOrder[] = Array.from(
    { length: 12 },
    (_, index) => ({
        id: `otc-order-${index + 1}`,
        address: `sbds****dse${index + 1}`,
        unitPrice: (0.0044 + (index % 4) * 0.0001).toFixed(4),
        remaining: (4_800 - index * 120).toLocaleString('en-US'),
    }),
)

export interface MockOtcPage {
    items: readonly MockOtcOrder[]
    hasMore: boolean
    page: number
}

export function getMockOtcPage(
    requestedPage: number,
    pageSize = OTC_PAGE_SIZE,
): MockOtcPage {
    const safePage = Math.max(1, Math.floor(requestedPage))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const end = Math.min(safePage * safePageSize, MOCK_OTC_ORDERS.length)

    return {
        items: MOCK_OTC_ORDERS.slice(0, end),
        hasMore: end < MOCK_OTC_ORDERS.length,
        page: safePage,
    }
}
