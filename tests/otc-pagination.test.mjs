import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
    getMockOtcPage,
    MOCK_OTC_ORDERS,
    OTC_PAGE_SIZE,
} from '../src/pages/main/otc/pagination.ts'
import {
    getSellAllValue,
    hasSellQuantity,
} from '../src/pages/main/otc/sellUtils.ts'

test('OTC mock pagination exposes four more rows per page and stops at the end', () => {
    const first = getMockOtcPage(1)
    const second = getMockOtcPage(2)
    const final = getMockOtcPage(3)

    assert.equal(OTC_PAGE_SIZE, 4)
    assert.equal(first.items.length, 4)
    assert.equal(first.hasMore, true)
    assert.equal(second.items.length, 8)
    assert.equal(second.hasMore, true)
    assert.equal(final.items.length, MOCK_OTC_ORDERS.length)
    assert.equal(final.hasMore, false)
    assert.deepEqual(second.items.slice(0, first.items.length), first.items)
})

test('OTC mock pagination normalizes invalid page and page-size values', () => {
    const normalized = getMockOtcPage(0, 0)

    assert.equal(normalized.page, 1)
    assert.equal(normalized.items.length, 1)
    assert.equal(normalized.hasMore, true)
})

test('OTC sell form keeps quantity validation contract-free and fills all from the selected order', () => {
    assert.equal(getSellAllValue('4,800'), '4800')
    assert.equal(getSellAllValue('392'), '392')
    assert.equal(hasSellQuantity(''), false)
    assert.equal(hasSellQuantity('   '), false)
    assert.equal(hasSellQuantity('0.25'), true)
})

test('OTC assets keep the artwork followed by two adjacent market cards', async () => {
    const [page, style] = await Promise.all([
        readFile('src/pages/main/otc/OtcPage.tsx', 'utf8'),
        readFile('src/pages/main/otc/OtcPage.scss', 'utf8'),
    ])

    assert.match(page, /stakingCoins/)
    assert.match(page, /otc-page__asset-art-slide/)
    assert.match(page, /alt="HU与USDT资产"/)
    assert.match(page, /spaceBetween=\{getViewportWidthPx\(10\)\}/)
    assert.match(style, /\.swiper-slide\.otc-page__asset-art-slide \{ width: 210px; \}/)
    assert.match(style, /width: 200px;[\s\S]*height: 244px;/)
    assert.match(style, /\.swiper-slide \{ width: 464px; \}/)
    assert.match(page, /viewBox="0 0 158 69"/)
    assert.match(page, /function MarketLinkIcon/)
    assert.match(page, /<MarketPopup/)
    assert.match(page, /handleOpenMarket\(asset\.type\)/)
    assert.match(style, /&__sell-field \.app-input \{[\s\S]*--app-input-background: var\(--app-box-bg\);/)
    assert.doesNotMatch(page, /chart-placeholder/)
    assert.match(style, /width: 222\.422px;/)
    assert.match(style, /width: 158px; height: 69px;/)
    assert.match(style, /linear-gradient\(121deg, rgb\(0 255 230 \/ 50%\)/)
})

test('OTC post-buy entry and second-level route stay connected', async () => {
    const [otcSource, routeSource, routerSource] = await Promise.all([
        readFile('src/pages/main/otc/OtcPage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
    ])

    assert.match(otcSource, /pushRoute\(ROUTE_PATH\.otcPostBuy\)/)
    assert.match(routeSource, /otcPostBuy:\s*'\/otc\/post-buy'/)
    assert.match(routerSource, /ROUTE_PATH\.otcPostBuy\.slice\(1\)/)
})

test('OTC order entry navigates to the paged second-level order route', async () => {
    const [otcSource, routeSource, routerSource] = await Promise.all([
        readFile('src/pages/main/otc/OtcPage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
    ])

    assert.match(otcSource, /pushRoute\(ROUTE_PATH\.otcOrders\)/)
    assert.match(routeSource, /otcOrders:\s*'\/otc\/orders'/)
    assert.match(routerSource, /ROUTE_PATH\.otcOrders\.slice\(1\)/)
})
