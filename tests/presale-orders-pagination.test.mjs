import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
    getMockPresaleOrderPage,
    MOCK_PRESALE_ORDERS,
    PRESALE_ORDER_PAGE_SIZE,
} from '../src/pages/main/presale-orders/pagination.ts'

test('presale order mock pagination exposes four more rows per page', () => {
    const first = getMockPresaleOrderPage(1)
    const second = getMockPresaleOrderPage(2)
    const final = getMockPresaleOrderPage(3)

    assert.equal(PRESALE_ORDER_PAGE_SIZE, 4)
    assert.equal(first.items.length, 4)
    assert.equal(first.hasMore, true)
    assert.equal(second.items.length, 8)
    assert.equal(second.hasMore, true)
    assert.equal(final.items.length, MOCK_PRESALE_ORDERS.length)
    assert.equal(final.hasMore, false)
    assert.deepEqual(second.items.slice(0, first.items.length), first.items)
})

test('presale orders render the designed fields and register page data controls', async () => {
    const source = await readFile('src/pages/main/presale-orders/PresaleOrdersPage.tsx', 'utf8')

    assert.match(source, /<SecondaryHeader title="预售订单"/)
    assert.match(source, /预售价格/)
    assert.match(source, /获得算力/)
    assert.match(source, /获得等级/)
    assert.match(source, /bronzeBadge/)
    assert.match(source, /usePageRefresh\(refreshPage\)/)
    assert.match(source, /usePageLoadMore\(loadNextPage/)
})

test('presale page order entry navigates to its second-level route', async () => {
    const [presaleSource, routeSource, routerSource] = await Promise.all([
        readFile('src/pages/main/presale/PresalePage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
    ])

    assert.match(presaleSource, /pushRoute\(ROUTE_PATH\.presaleOrders\)/)
    assert.match(routeSource, /presaleOrders:\s*'\/presale\/orders'/)
    assert.match(routerSource, /ROUTE_PATH\.presaleOrders\.slice\(1\)/)
})
