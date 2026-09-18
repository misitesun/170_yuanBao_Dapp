export type StakeOrderStatus = 'staking' | 'redeemed' | 'converted'
export type StakeOrderAsset = 'USDT' | 'HU'

export interface MockStakeOrder {
    id: string
    asset: StakeOrderAsset
    amount: string
    equivalent?: string
    power?: string
    extraConversionPower?: string
    fee?: string
    createdAt: string
    status: StakeOrderStatus
}

export const STAKE_ORDER_PAGE_SIZE = 4

const STATUS_TIME_PREFIX: Record<StakeOrderStatus, string> = {
    staking: '2024/08/12',
    redeemed: '2024/08/12',
    converted: '2024/08/12',
}

function createMockStakeOrders(status: StakeOrderStatus): readonly MockStakeOrder[] {
    return Array.from({ length: 12 }, (_, index) => {
        const asset: StakeOrderAsset = index % 2 === 0 ? 'USDT' : 'HU'
        return {
            id: `${status}-stake-order-${index + 1}`,
            asset,
            amount: '1,00.008842',
            equivalent: asset === 'HU' ? '≈24.1283948 USDT' : undefined,
            power: status === 'redeemed'
                ? undefined
                : asset === 'HU'
                    ? status === 'converted' ? '880,000 USDT' : '880,000 万'
                    : '10,000 万',
            extraConversionPower: status === 'converted' ? '10,000 万' : undefined,
            fee: status === 'redeemed' ? `1.23 ${asset}` : undefined,
            createdAt: `${STATUS_TIME_PREFIX[status]} 12:00`,
            status,
        }
    })
}

export const MOCK_STAKE_ORDERS: Readonly<Record<StakeOrderStatus, readonly MockStakeOrder[]>> = {
    staking: createMockStakeOrders('staking'),
    redeemed: createMockStakeOrders('redeemed'),
    converted: createMockStakeOrders('converted'),
}

export interface MockStakeOrderPage {
    items: readonly MockStakeOrder[]
    hasMore: boolean
    page: number
}

export function getMockStakeOrderPage(
    status: StakeOrderStatus,
    requestedPage: number,
    pageSize = STAKE_ORDER_PAGE_SIZE,
): MockStakeOrderPage {
    const safePage = Math.max(1, Math.floor(requestedPage))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const orders = MOCK_STAKE_ORDERS[status]
    const end = Math.min(safePage * safePageSize, orders.length)

    return {
        items: orders.slice(0, end),
        hasMore: end < orders.length,
        page: safePage,
    }
}
