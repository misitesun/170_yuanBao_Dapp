import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
    getMockStakeOrderPage,
    MOCK_STAKE_ORDERS,
    STAKE_ORDER_PAGE_SIZE,
} from '../src/pages/main/stake-orders/pagination.ts'

test('stake order mock pagination exposes four more rows per page for every tab', () => {
    assert.equal(STAKE_ORDER_PAGE_SIZE, 4)

    for (const status of ['staking', 'redeemed', 'converted']) {
        const first = getMockStakeOrderPage(status, 1)
        const second = getMockStakeOrderPage(status, 2)
        const final = getMockStakeOrderPage(status, 3)

        assert.equal(first.items.length, 4)
        assert.equal(first.hasMore, true)
        assert.equal(second.items.length, 8)
        assert.equal(second.hasMore, true)
        assert.equal(final.items.length, MOCK_STAKE_ORDERS[status].length)
        assert.equal(final.hasMore, false)
        assert.deepEqual(second.items.slice(0, first.items.length), first.items)
    }
})

test('stake order states expose the distinct fields shown in the design', () => {
    const staking = getMockStakeOrderPage('staking', 1).items
    const redeemed = getMockStakeOrderPage('redeemed', 1).items
    const converted = getMockStakeOrderPage('converted', 1).items

    assert.equal(staking[0].power, '10,000 万')
    assert.equal(staking[1].power, '880,000 万')
    assert.equal(staking[0].fee, undefined)
    assert.equal(staking[0].extraConversionPower, undefined)

    assert.equal(redeemed[0].fee, '1.23 USDT')
    assert.equal(redeemed[1].fee, '1.23 HU')
    assert.equal(redeemed[0].power, undefined)

    assert.equal(converted[0].power, '10,000 万')
    assert.equal(converted[1].power, '880,000 USDT')
    assert.equal(converted[0].extraConversionPower, '10,000 万')
})

test('stake order page wires tabs, pull refresh, load more and static action feedback', async () => {
    const source = await readFile('src/pages/main/stake-orders/StakeOrdersPage.tsx', 'utf8')

    assert.match(source, /<SecondaryHeader title="质押订单"/)
    assert.match(source, /<SegmentedTabs/)
    assert.match(source, /usePageRefresh\(refreshPage\)/)
    assert.match(source, /usePageLoadMore\(loadNextPage/)
    assert.match(source, /当前为静态演示，未提交赎回/)
    assert.match(source, /当前为静态演示，未提交转化/)
    assert.match(source, /额外转化算力/)
    assert.match(source, /手续费/)
})

test('stake page order entry navigates to the second-level order route', async () => {
    const [stakeSource, routeSource, routerSource] = await Promise.all([
        readFile('src/pages/main/stake/StakePage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
    ])

    assert.match(stakeSource, /pushRoute\(ROUTE_PATH\.stakeOrders\)/)
    assert.match(routeSource, /stakeOrders:\s*'\/stake\/orders'/)
    assert.match(routerSource, /ROUTE_PATH\.stakeOrders\.slice\(1\)/)
})
