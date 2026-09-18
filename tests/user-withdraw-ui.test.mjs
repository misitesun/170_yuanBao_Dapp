import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

test('user withdrawal page renders the confirmed static form and local interactions', async () => {
    const [page, styles, inputSource, inputStyles, readme, routes, router, userPage, preview] = await Promise.all([
        readFile('src/pages/main/user-withdraw/UserWithdrawPage.tsx', 'utf8'),
        readFile('src/pages/main/user-withdraw/UserWithdrawPage.scss', 'utf8'),
        readFile('src/components/Input/Input.tsx', 'utf8'),
        readFile('src/components/Input/Input.scss', 'utf8'),
        readFile('src/pages/main/user-withdraw/README.md', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/pages/main/user/UserPage.tsx', 'utf8'),
        readFile('src/showcase/UserWithdrawPreview.tsx', 'utf8'),
    ])

    for (const text of ['提取币种', '提取链', '提取数量', '可用：', '手续费 0.1%', '全部']) {
        assert.match(page, new RegExp(text))
    }
    assert.match(page, /<SecondaryHeader[\s\S]*title="提取"[\s\S]*right=/)
    assert.match(page, /aria-label="查看提取记录"/)
    assert.match(page, /pushRoute\(ROUTE_PATH\.userWithdrawRecords\)/)
    assert.match(page, /<Input[\s\S]*id="user-withdraw-amount"[\s\S]*inputMode="decimal"/)
    assert.doesNotMatch(page, /focusVariant=/)
    assert.match(page, /setAmount\(AVAILABLE_BALANCE\)/)
    assert.match(page, /<Picker/)
    assert.match(page, /ASSET_OPTIONS/)
    assert.match(page, /CHAIN_OPTIONS/)
    assert.match(page, /<ActionButton type="submit"/)
    assert.match(page, /<Toast message=\{message\}/)
    assert.doesNotMatch(page, /提现/)

    assert.match(styles, /height: 188px;/)
    assert.match(styles, /min-height: 94px;/)
    assert.match(styles, /min-height: 103px;/)
    assert.doesNotMatch(styles, /app-input:focus-within/)
    assert.doesNotMatch(styles, /var\(--app-action-gradient\) border-box/)
    assert.match(inputSource, /focusVariant = 'gradient'/)
    assert.match(inputStyles, /&--focus-gradient:focus-within/)
    assert.match(inputStyles, /background: var\(--app-action-gradient\);/)
    assert.match(inputStyles, /&--focus-gradient:focus-within::before \{ opacity: 1; \}/)
    assert.match(styles, /&__submit\.action-button \{ margin-top: 58px; font-size: 28px; \}/)
    assert.doesNotMatch(styles, /position:\s*(?:absolute|fixed|sticky)/)

    assert.match(readme, /750×1624/)
    assert.match(readme, /no page content is positioned outside normal flow/)
    assert.match(routes, /userWithdraw: '\/user\/withdraw'/)
    assert.match(router, /ROUTE_PATH\.userWithdraw/)
    assert.match(router, /\/preview\/user-withdraw/)
    assert.match(userPage, /pushRoute\(ROUTE_PATH\.userWithdraw\)/)
    assert.match(preview, /<UserWithdrawPage \/>/)
})

test('user withdrawal page uses the supplied semantic assets', async () => {
    await Promise.all([
        access('src/assets/user-withdraw/records.png'),
        access('src/assets/user-withdraw/select-arrow.png'),
    ])
})
