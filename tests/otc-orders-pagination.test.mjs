import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
    getMockOtcTradeOrderPage,
    MOCK_OTC_TRADE_ORDERS,
    OTC_ORDER_PAGE_SIZE,
} from '../src/pages/main/otc-orders/pagination.ts'

test('OTC order tabs expose four more rows per page and stop at the end', () => {
    assert.equal(OTC_ORDER_PAGE_SIZE, 4)

    for (const tab of ['buy', 'sell']) {
        const first = getMockOtcTradeOrderPage(tab, 1)
        const second = getMockOtcTradeOrderPage(tab, 2)
        const final = getMockOtcTradeOrderPage(tab, 3)

        assert.equal(first.items.length, 4)
        assert.equal(first.hasMore, true)
        assert.equal(second.items.length, 8)
        assert.equal(second.hasMore, true)
        assert.equal(final.items.length, MOCK_OTC_TRADE_ORDERS[tab].length)
        assert.equal(final.hasMore, false)
        assert.deepEqual(second.items.slice(0, first.items.length), first.items)
    }
})

test('OTC order fixtures preserve the states shown in both designs', () => {
    const buyOrders = MOCK_OTC_TRADE_ORDERS.buy
    const sellOrders = MOCK_OTC_TRADE_ORDERS.sell

    assert.deepEqual(buyOrders.slice(0, 4).map((order) => order.status), [
        'trading',
        'trading',
        'cancelled',
        'completed',
    ])
    assert.equal(sellOrders.every((order) => order.status === 'completed'), true)
    assert.equal(sellOrders.every((order) => order.tab === 'sell'), true)
})

test('OTC orders page connects semantic tabs, refresh, pagination and local feedback', async () => {
    const [source, cardSource] = await Promise.all([
        readFile('src/pages/main/otc-orders/OtcOrdersPage.tsx', 'utf8'),
        readFile('src/pages/main/otc-orders/components/OtcTradeOrderCard.tsx', 'utf8'),
    ])

    assert.match(source, /<SecondaryHeader title="全部订单"/)
    assert.match(source, /挂买订单/)
    assert.match(source, /挂卖订单/)
    assert.match(source, /usePageRefresh\(refreshPage\)/)
    assert.match(source, /usePageLoadMore\(loadNextPage/)
    assert.match(source, /pushRoute\(ROUTE_PATH\.otcBuyOrderDetail\)/)
    assert.match(cardSource, /撤销挂买单/)
    assert.match(cardSource, /查看详情/)
})

test('buy-order detail preserves the six design fields and three completed records', async () => {
    const { getMockOtcBuyOrderDetail } = await import('../src/pages/main/otc-orders/detailData.ts')
    const detail = getMockOtcBuyOrderDetail()

    assert.deepEqual({
        orderNumber: detail.orderNumber,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        total: detail.total,
        tradedQuantity: detail.tradedQuantity,
        tradedTotal: detail.tradedTotal,
    }, {
        orderNumber: 'PPI2345678910',
        quantity: '5,000',
        unitPrice: '0.2345',
        total: '12,000',
        tradedQuantity: '2,3120',
        tradedTotal: '5,340',
    })
    assert.equal(detail.trades.length, 3)
    assert.equal(detail.trades.every((trade) => trade.status === 'completed'), true)
})

test('buy-order detail route, preview and static third-level feedback stay connected', async () => {
    const [pageSource, routeSource, routerSource] = await Promise.all([
        readFile('src/pages/main/otc-orders/OtcBuyOrderDetailPage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
    ])

    assert.match(pageSource, /<SecondaryHeader title="订单详情"/)
    assert.match(pageSource, /usePageRefresh\(refreshPage\)/)
    assert.match(pageSource, /成交记录详情当前为静态演示/)
    assert.match(routeSource, /otcBuyOrderDetail:\s*'\/otc\/orders\/buy\/detail'/)
    assert.match(routerSource, /ROUTE_PATH\.otcBuyOrderDetail\.slice\(1\)/)
    assert.match(routerSource, /\/preview\/otc-buy-order-detail/)
})
