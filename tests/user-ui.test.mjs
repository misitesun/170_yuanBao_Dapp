import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const USER_ASSETS = [
    'header-glow.png',
    'avatar.png',
    'balance-eye.png',
    'orders.png',
    'level-newcomer.png',
    'level-partner.png',
    'hu-card-bg.png',
    'points-card-bg.png',
    'partner-banner.png',
]

test('user page keeps the approved static sections and local interactions', async () => {
    const page = await readFile('src/pages/main/user/UserPage.tsx', 'utf8')

    for (const text of ['USDT资产预览', '充值', '提取', 'HU资产', '积分资产', '算力资产', '成为合伙人', '我的团队']) {
        assert.match(page, new RegExp(text))
    }
    assert.doesNotMatch(page, /切换账户|user-page__switch-account/)
    assert.match(page, /usePageRefresh\(refreshPage\)/)
    assert.match(page, /copyTextToClipboard/)
    assert.match(page, /setShowBalance/)
    assert.match(page, /<MarketPopup/)
    assert.match(page, /handleOpenMarket\(asset\.marketType\)/)
    assert.match(page, /<Toast message=\{message\}/)
    assert.match(page, /pushRoute\(ROUTE_PATH\.userPartner\)/)
    assert.match(page, /pushRoute\(ROUTE_PATH\.userTeam\)/)
    assert.match(page, /pushRoute\(ROUTE_PATH\.userWithdraw\)/)
    assert.match(page, /pushRoute\(ROUTE_PATH\.userRecharge\)/)
    assert.doesNotMatch(page, /showStaticFeedback\('充值'\)/)
    assert.doesNotMatch(page, /showStaticFeedback\('提取'\)/)
    assert.doesNotMatch(page, /提现/)
})

test('user page uses semantic exported artwork and has a development preview', async () => {
    await Promise.all(USER_ASSETS.map((name) => access(`src/assets/user/${name}`)))

    const router = await readFile('src/router/AppRouter.tsx', 'utf8')
    const preview = await readFile('src/showcase/UserPreview.tsx', 'utf8')
    const tabbar = await readFile('src/pages/main/layout/TabbarMenu.tsx', 'utf8')

    assert.match(router, /path="\/preview\/user"/)
    assert.match(preview, /<UserPage \/>/)
    assert.match(preview, /bottomInset="tabbar"/)
    assert.match(tabbar, /'\/preview\/user'/)
})

test('user page keeps the supplied header artwork and partner badge gradients', async () => {
    const styles = await readFile('src/pages/main/user/UserPage.scss', 'utf8')

    assert.match(styles, /header-glow\.png/)
    assert.match(styles, /linear-gradient\(90deg, #2c0041 0%, #200057 100%\) padding-box/)
    assert.match(styles, /linear-gradient\(90deg, #9069ff 0%, #f8d99a 100%\) border-box/)
    assert.match(styles, /&__partner-action\.action-button[\s\S]*font-size: 24px;[\s\S]*white-space: nowrap;/)
    assert.match(styles, /&__orders \{[\s\S]*padding: 0;[\s\S]*border: 0;[\s\S]*appearance: none;[\s\S]*background: transparent;/)
    assert.doesNotMatch(styles, /switch-account/)
})
