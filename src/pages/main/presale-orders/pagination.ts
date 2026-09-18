export interface MockPresaleOrder {
    id: string
    name: string
    createdAt: string
    price: string
    power: string
    level: string
}

export const PRESALE_ORDER_PAGE_SIZE = 4

export const MOCK_PRESALE_ORDERS: readonly MockPresaleOrder[] = Array.from(
    { length: 12 },
    (_, index) => ({
        id: `presale-order-${index + 1}`,
        name: '预售1号名称',
        createdAt: '2024/08/12 12:00',
        price: '1,00.008842',
        power: '128',
        level: '青铜',
    }),
)

export interface MockPresaleOrderPage {
    items: readonly MockPresaleOrder[]
    hasMore: boolean
    page: number
}

export function getMockPresaleOrderPage(
    requestedPage: number,
    pageSize = PRESALE_ORDER_PAGE_SIZE,
): MockPresaleOrderPage {
    const safePage = Math.max(1, Math.floor(requestedPage))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const end = Math.min(safePage * safePageSize, MOCK_PRESALE_ORDERS.length)

    return {
        items: MOCK_PRESALE_ORDERS.slice(0, end),
        hasMore: end < MOCK_PRESALE_ORDERS.length,
        page: safePage,
    }
}
