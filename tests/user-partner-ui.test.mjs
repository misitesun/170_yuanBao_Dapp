import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const PARTNER_ASSETS = [
    'partner-hero.png',
    'membership-card-bg.png',
    'dividend-benefit.png',
    'referral-benefit.png',
    'title-divider-left.png',
    'title-divider-right.png',
]

test('partner page renders the confirmed static content and feedback action', async () => {
    const page = await readFile('src/pages/main/user-partner/UserPartnerPage.tsx', 'utf8')

    for (const text of ['成为合伙人', '成为 HU CHAIN 合伙人', '携手共建生态，共享平台成长', '500 USDT', '确认加入', '合伙人专属权益', '分红收益', '推广奖励', '提取手续费总额的']) {
        assert.match(page, new RegExp(text))
    }
    assert.match(page, /<SecondaryHeader title="成为合伙人" showGap=\{false\}/)
    assert.match(page, /showToast\('加入合伙人当前为静态演示，未提交交易'\)/)
    assert.match(page, /<Toast message=\{message\}/)
    assert.doesNotMatch(page, /提现/)
})

test('partner page uses supplied semantic artwork and exposes app and preview routes', async () => {
    await Promise.all(PARTNER_ASSETS.map((name) => access(`src/assets/user-partner/${name}`)))

    const [routes, router, userPage, preview] = await Promise.all([
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/pages/main/user/UserPage.tsx', 'utf8'),
        readFile('src/showcase/UserPartnerPreview.tsx', 'utf8'),
    ])

    assert.match(routes, /userPartner: '\/user\/partner'/)
    assert.match(router, /ROUTE_PATH\.userPartner/)
    assert.match(router, /path="\/preview\/user-partner"/)
    assert.match(userPage, /pushRoute\(ROUTE_PATH\.userPartner\)/)
    assert.match(preview, /<PagePullRefresh><UserPartnerPage \/><\/PagePullRefresh>/)
})

test('partner page lets the hero artwork extend behind its transparent header', async () => {
    const styles = await readFile('src/pages/main/user-partner/UserPartnerPage.scss', 'utf8')

    assert.match(styles, /\.secondary-header-bar \{ background-color: transparent; \}/)
    assert.match(styles, /&__hero[\s\S]*padding: 510px 30px 24px;/)
    assert.match(styles, /&__amount[\s\S]*font-size: 56px;/)
    assert.match(styles, /&__membership \.action-button[\s\S]*min-height: 98px;/)
})
