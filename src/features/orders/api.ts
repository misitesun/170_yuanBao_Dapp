import { request } from '@/services/http/index.ts'
import { API_PAGE_SIZE, boolean, dateTime, decimal, integer, list, object, string } from '../api-fields.ts'
import { validateOrderQuantity } from './quantity.ts'

export interface OrderConfig {
    enabled: boolean
    canSell: boolean
    canBuy: boolean
    sellStart: string
    sellEnd: string
    buyStart: string
    buyEnd: string
}

function time(value: unknown): string {
    const text = string(value)
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text)) throw new Error('活动时间格式错误')
    return text
}

export function parseOrderConfig(value: unknown): OrderConfig {
    const row = object(object(value).data)
    const enabled = !['', '0', 'off', 'false'].includes(string(row.enabled).toLowerCase())
    return {
        enabled, canSell: boolean(row.can_sell), canBuy: boolean(row.can_buy),
        sellStart: time(row.sell_start), sellEnd: time(row.sell_end),
        buyStart: time(row.buy_start), buyEnd: time(row.buy_end),
    }
}

export async function getOrderConfig(signal?: AbortSignal): Promise<OrderConfig> {
    return parseOrderConfig(await request<unknown>({ url: '/api/orders/config', authentication: 'none', signal }))
}

export function getParticipationMessage(config: OrderConfig | null, side: 'sell' | 'buy'): string | null {
    if (!config) return '活动配置加载中'
    if (!config.enabled) return '元宝卡暂未开启'
    if (side === 'sell' ? config.canSell : config.canBuy) return null
    return side === 'sell' ? '当前不在买卡时间' : '当前不在抢拍时间'
}

/** Success is HTTP acknowledgement only; the response body is not consumed. */
export async function buyCard(productId: number, quantity = 1): Promise<void> {
    await request<unknown, { product_id: number; quantity: number }>({
        url: '/api/orders/sell', method: 'POST', data: { product_id: integer(productId, 1), quantity: validateOrderQuantity(quantity) },
    })
}

export async function bidCard(productId: number, quantity = 1): Promise<void> {
    await request<unknown, { product_id: number; quantity: number }>({
        url: '/api/orders/buy', method: 'POST', data: { product_id: integer(productId, 1), quantity: validateOrderQuantity(quantity) },
    })
}

export interface CardOrder {
    id: number
    productId: number
    side: 1 | 2
    status: 0 | 1 | 2
    amount: string
    payUsdt: string
    payBao: string
    createdAt: string
    product: { id: number; name: string; image: string } | null
}

export function parseCardOrders(value: unknown): CardOrder[] {
    return list(object(value).orders).map((value) => {
        const row = object(value)
        const side = integer(row.side, 1)
        const status = integer(row.status)
        if ((side !== 1 && side !== 2) || (status !== 0 && status !== 1 && status !== 2)) throw new Error('订单类型或状态格式错误')
        const product = row.product === null ? null : object(row.product)
        return {
            id: integer(row.id, 1), productId: integer(row.product_id, 1), side, status,
            amount: decimal(row.amount), payUsdt: decimal(row.pay_usdt), payBao: decimal(row.pay_bao),
            createdAt: dateTime(row.created_at),
            product: product ? { id: integer(product.id, 1), name: string(product.name), image: string(product.image) } : null,
        }
    })
}

export async function getCardOrders(side: 1 | 2, status: 0 | 1 | 2, page: number, signal?: AbortSignal): Promise<CardOrder[]> {
    return parseCardOrders(await request<unknown>({ url: '/api/orders', params: { side, status, page_no: page, page_size: API_PAGE_SIZE }, signal }))
}

export async function getHomeCardOrders(page: number, signal?: AbortSignal): Promise<CardOrder[]> {
    return parseCardOrders(await request<unknown>({ url: '/api/orders',
        params: { page_no: integer(page, 1), page_size: API_PAGE_SIZE }, signal }))
}

export interface OrderRelease {
    id: number
    amount: string
    releaseUsdt: string
    todayUsdt: string
    releaseBao: string
    todayBao: string
    releaseCount: number
    totalCount: number
    status: 0 | 1
    createdAt: string
}

export function parseOrderReleases(value: unknown): OrderRelease[] {
    return list(object(value).order_releases).map((value) => {
        const row = object(value)
        const status = integer(row.status)
        if (status !== 0 && status !== 1) throw new Error('释放状态格式错误')
        return {
            id: integer(row.id, 1), amount: decimal(row.amount),
            releaseUsdt: decimal(row.release_usdt), todayUsdt: decimal(row.today_usdt),
            releaseBao: decimal(row.release_bao), todayBao: decimal(row.today_bao),
            releaseCount: integer(row.release_count), totalCount: integer(row.total_count),
            status, createdAt: dateTime(row.created_at),
        }
    })
}

export async function getOrderReleases(status: 0 | 1, page: number, signal?: AbortSignal): Promise<OrderRelease[]> {
    return parseOrderReleases(await request<unknown>({
        url: '/api/order_releases', params: { status, page_no: page, page_size: API_PAGE_SIZE }, signal,
    }))
}
