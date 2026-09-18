import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

test('points convert page renders the confirmed static flow and empty chart placeholder', async () => {
    const [page, styles, readme, router, preview] = await Promise.all([
        readFile('src/pages/main/points-convert/PointsConvertPage.tsx', 'utf8'),
        readFile('src/pages/main/points-convert/PointsConvertPage.scss', 'utf8'),
        readFile('src/pages/main/points-convert/README.md', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/showcase/PointsConvertPreview.tsx', 'utf8'),
    ])

    assert.match(page, /<SecondaryHeader title="兑换"/)
    assert.match(page, /htmlFor="points-convert-amount"/)
    assert.match(page, /<Input/)
    assert.match(page, /id="points-convert-amount"/)
    assert.match(page, /inputMode="decimal"/)
    assert.match(page, /setPointsAmount\(AVAILABLE_POINTS\)/)
    assert.match(page, /const hasEnteredPoints = pointsAmount !== '' && pointsAmount !== '0'/)
    assert.match(page, /hasEnteredPoints \? ' points-convert-page__amount--filled' : ''/)
    assert.match(page, /<output[\s\S]*htmlFor="points-convert-amount"/)
    assert.match(page, /确认兑换/)
    assert.match(page, /积分行情蜡烛图，当前暂无数据/)
    assert.match(page, /points-market\.png/)
    assert.doesNotMatch(page, /marketAssetRing/)
    assert.doesNotMatch(page, /<canvas|<svg|candlestick|kline/i)
    assert.match(styles, /height: 266px;/)
    assert.match(styles, /height: 246px;/)
    assert.match(styles, /background-image: var\(--points-convert-background\);/)
    assert.match(styles, /background-size: 750px 888px;/)
    assert.doesNotMatch(styles, /linear-gradient\(rgb\(20 19 63 \/ 60%\)/)
    assert.match(styles, /&__amount--filled \{ color: var\(--app-text\); \}/)
    assert.match(styles, /&__amount-field \.app-input/)
    assert.match(styles, /--app-input-background: transparent;/)
    assert.match(styles, /width: 84px;[\s\S]*height: 84px;/)
    assert.match(styles, /&__market-icon \{ width: 116px; height: 116px;/)
    assert.doesNotMatch(styles, /&__market-ring/)
    assert.match(styles, /min-height: 400px;/)
    assert.match(readme, /intentionally stays empty/)
    assert.match(router, /ROUTE_PATH\.pointsConvert/)
    assert.match(router, /\/preview\/points-convert/)
    assert.match(preview, /<PointsConvertPage \/>/)
})

test('points convert page uses the manually exported semantic assets', async () => {
    await Promise.all([
        access('src/assets/points-convert/background.png'),
        access('src/assets/points-convert/points-market.png'),
        access('src/assets/points-convert/points.png'),
        access('src/assets/points-convert/power.png'),
        access('src/assets/points-convert/wallet.png'),
        access('src/assets/points-convert/swap-down.png'),
    ])
})
