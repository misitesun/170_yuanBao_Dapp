import { getCardOrders, getOrderReleases } from '@/features/orders/api.ts'
import { API_PAGE_SIZE, formatApiTime } from '@/features/api-fields.ts'
import type { CardPackCardOrder, CardPackColor, CardPackPageLoader } from './types.ts'

// IDs and card colors follow the developer-confirmed 1 red / 2 blue / 3 green mapping.
const ORDER_COLORS: Readonly<Record<number, CardPackColor>> = { 1: 'red', 2: 'blue', 3: 'green' }
const ORDER_STATUSES = { pending: 0, won: 1, lost: 2 } as const

export const loadCardPackPage: CardPackPageLoader = async (query, page, signal) => {
    if (query.orderType === 'released') {
        const orders = await getOrderReleases(query.status === 'ongoing' ? 1 : 0, page, signal)
        return {
            items: orders.map((order) => ({
                kind: 'release', id: String(order.id), principal: order.amount,
                createdAt: formatApiTime(order.createdAt), totalUsdtIncome: order.releaseUsdt,
                totalBaoqiIncome: order.releaseBao, todayUsdtIncome: order.todayUsdt,
                todayBaoqiIncome: order.todayBao, period: `${order.releaseCount}/${order.totalCount}`,
            })),
            hasMore: orders.length === API_PAGE_SIZE,
        }
    }
    const side = query.orderType === 'outgoing' ? 1 : 2
    const orders = await getCardOrders(side, ORDER_STATUSES[query.status], page, signal)
    const items = orders.map<CardPackCardOrder>((order) => {
        const product = order.product
        return {
            kind: 'card', id: String(order.id), color: ORDER_COLORS[order.productId] ?? 'blue',
            name: product?.name ?? `#${order.productId}`, image: product?.image,
            principal: side === 1 ? order.amount : `${order.payUsdt}+${order.payBao}`,
            principalLabel: side === 1 ? '本金(元气）' : '本金(余额+宝气）',
            principalAsset: side === 1 ? 'yuanqi' : 'usdt-baoqi',
            purchasedAt: formatApiTime(order.createdAt),
        }
    })
    return { items, hasMore: orders.length === API_PAGE_SIZE }
}
