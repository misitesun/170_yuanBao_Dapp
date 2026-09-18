import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const RECHARGE_ASSETS = [
    'copy.svg',
    'qr-backdrop.png',
    'qr-code.png',
    'qr-scanner-frame.png',
    'records.png',
    'select-arrow.png',
]

test('user recharge page keeps the approved static interactions and shared input', async () => {
    const [page, styles] = await Promise.all([
        readFile('src/pages/main/user-recharge/UserRechargePage.tsx', 'utf8'),
        readFile('src/pages/main/user-recharge/UserRechargePage.scss', 'utf8'),
    ])

    for (const text of ['充值币种', '充值链', '充值地址', '请输入充值金额', '确认充值', '最小充值金额为:0.01USDT']) {
        assert.match(page, new RegExp(text))
    }

    assert.match(page, /import \{ Input \} from '@\/components\/Input'/)
    assert.match(page, /<Input[\s\S]*id="user-recharge-amount"/)
    assert.match(page, /copyTextToClipboard\(RECHARGE_ADDRESS\)/)
    assert.match(page, /<Picker/)
    assert.match(page, /<Toast message=\{message\}/)
    assert.doesNotMatch(styles, /\.app-input/)
})

test('user recharge page uses exact exported assets and route wiring', async () => {
    await Promise.all(RECHARGE_ASSETS.map((name) => access(`src/assets/user-recharge/${name}`)))

    const [router, routes, userPage, preview] = await Promise.all([
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/pages/main/user/UserPage.tsx', 'utf8'),
        readFile('src/showcase/UserRechargePreview.tsx', 'utf8'),
    ])

    assert.match(routes, /userRecharge:\s*'\/user\/recharge'/)
    assert.match(router, /ROUTE_PATH\.userRecharge/)
    assert.match(router, /path="\/preview\/user-recharge"/)
    assert.match(userPage, /pushRoute\(ROUTE_PATH\.userRecharge\)/)
    assert.match(preview, /<UserRechargePage \/>/)
})
