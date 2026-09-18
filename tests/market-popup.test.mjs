import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

test('market popup reuses the shared bottom Popup and keeps the chart intentionally empty', async () => {
    const [component, styles, mixins] = await Promise.all([
        readFile('src/components/MarketPopup/MarketPopup.tsx', 'utf8'),
        readFile('src/components/MarketPopup/MarketPopup.scss', 'utf8'),
        readFile('src/styles/mixins.scss', 'utf8'),
    ])

    assert.match(component, /<Popup/)
    assert.match(component, /position="bottom"/)
    assert.match(component, /contentPreset=\{false\}/)
    assert.match(component, /market-asset-ring\.png/)
    assert.match(component, /market-popup__asset-ring/)
    assert.doesNotMatch(component, /market-popup__asset-badge-inner/)
    assert.match(component, /market-popup__chart-placeholder/)
    assert.match(component, /行情蜡烛图，当前暂无数据/)
    assert.doesNotMatch(component, /<canvas|<svg|candlestick|kline/i)
    assert.match(styles, /width: calc\(100% - 40px\);/)
    assert.match(styles, /max-width: 710px;/)
    assert.match(styles, /height: 1200px;/)
    assert.doesNotMatch(component, /backdrop=/)
    assert.doesNotMatch(component, /overlayClassName=/)
    assert.match(styles, /margin-bottom: 20px;/)
    assert.match(styles, /@include hu-popup-surface\(40px\);/)
    assert.match(mixins, /@mixin hu-popup-surface\(\$radius\)/)
    assert.match(mixins, /linear-gradient\(180deg, #2F1F53 0%, #1A1948 100%\)/)
    assert.match(mixins, /linear-gradient\(180deg, #F934FF 0%, #5039FE 50%, #41DEFF 100%\)/)
    assert.match(mixins, /\n\s*1px\n\s*\);/)
    assert.match(styles, /min-height: 380px;/)
    assert.match(styles, /&__asset-ring \{ width: 132px; height: 132px; \}/)
    assert.match(styles, /&__asset-icon \{ width: 88px; height: 88px;/)
    assert.doesNotMatch(styles, /&__asset-badge-inner/)
})

test('home check-in dialogs share the market popup surface without sharing business content', async () => {
    const [home, styles] = await Promise.all([
        readFile('src/pages/main/home/HomePage.tsx', 'utf8'),
        readFile('src/pages/main/home/HomePage.scss', 'utf8'),
    ])

    assert.match(home, /contentClassName="home-page__checkin-popup"/)
    assert.match(home, /contentClassName="home-page__checkin-popup home-page__reserve-popup"/)
    assert.match(styles, /&__checkin-popup \{\s*@include hu-popup-surface\(30px\);/)
})

test('market popup owns HU and points presentation and limits conversion to points', async () => {
    const [component, assets] = await Promise.all([
        readFile('src/components/MarketPopup/MarketPopup.tsx', 'utf8'),
        readFile('src/components/MarketPopup/marketAssets.ts', 'utf8'),
    ])

    assert.match(assets, /type: 'hu'/)
    assert.match(assets, /type: 'points'/)
    assert.match(assets, /HU实时价格/)
    assert.match(assets, /积分实时价格/)
    assert.match(assets, /hu-token\.png/)
    assert.match(assets, /points-token\.png/)
    assert.match(component, /assetType === 'points'/)
    assert.match(component, /积分兑换算力/)
    assert.match(component, /onConvertPower/)

    await Promise.all([
        access('src/assets/user/hu-token.png'),
        access('src/assets/user/points-token.png'),
        access('src/assets/user/market.png'),
        access('src/assets/common/market-asset-ring.png'),
    ])
})

test('OTC and User asset controls both open the shared market popup', async () => {
    const [otc, user] = await Promise.all([
        readFile('src/pages/main/otc/OtcPage.tsx', 'utf8'),
        readFile('src/pages/main/user/UserPage.tsx', 'utf8'),
    ])

    for (const source of [otc, user]) {
        assert.match(source, /<MarketPopup/)
        assert.match(source, /handleOpenMarket\(asset\.(?:type|marketType)\)/)
        assert.match(source, /assetType=\{marketAssetType\}/)
        assert.match(source, /pushRoute\(ROUTE_PATH\.pointsConvert\)/)
    }

    assert.match(otc, /MARKET_ASSET_LIST/)
    assert.match(user, /marketType: 'hu'/)
    assert.match(user, /marketType: 'points'/)
})
