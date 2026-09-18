import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { registerUiModules } from './hu-ui-render.mjs'

test('home renders design sections and fixed data without a wallet or network', async () => {
    const hooks = registerUiModules()
    try {
        const { HomePage } = await import('../src/pages/main/home/HomePage.tsx')
        const html = renderToStaticMarkup(createElement(HomePage))
        for (const label of ['WELCOME TO', 'HU CHAIN', '每日签到', '购买矿机', '链上公示', '全网算力', '个人算力', '全网挖矿总量', 'HU总量']) assert.ok(html.includes(label), label)
        assert.equal((html.match(/7,584.988326/g) ?? []).length, 4)
        assert.equal((html.match(/<button /g) ?? []).length, 3)
        assert.ok(html.includes('24:00:00'))
        assert.doesNotMatch(html, /9:41|AT&amp;T|Toast 与 Alert/)
    } finally { hooks.deregister() }
})

test('home reserve input delegates its focus border to the shared Input', async () => {
    const styles = await readFile('src/pages/main/home/HomePage.scss', 'utf8')

    assert.match(styles, /&__reserve-field \.app-input \{[\s\S]*--app-input-background: var\(--app-box-bg\);/)
    assert.doesNotMatch(styles, /&__reserve-field \.app-input \{[\s\S]*var\(--app-action-gradient\) border-box;/)
})

test('shared button forwards form semantics and blocks loading interaction', async () => {
    const hooks = registerUiModules()
    try {
        const { ActionButton } = await import('../src/components/ActionButton/ActionButton.tsx')
        const html = renderToStaticMarkup(createElement(ActionButton, { loading: true, type: 'submit', name: 'purchase', variant: 'outline' }, '购买'))
        assert.match(html, /type="submit"/)
        assert.match(html, /disabled=""/)
        assert.match(html, /aria-busy="true"/)
        assert.match(html, /name="purchase"/)
        const idle = renderToStaticMarkup(createElement(ActionButton, null, '签到'))
        assert.match(idle, /type="button"/)
        assert.doesNotMatch(idle, /disabled|aria-busy/)
    } finally { hooks.deregister() }
})

test('reserve check-in accepts positive whole day counts only', async () => {
    const hooks = registerUiModules()
    try {
        const { isValidReserveCheckinDays } = await import('../src/pages/main/home/utils.ts')
        assert.equal(isValidReserveCheckinDays('1'), true)
        assert.equal(isValidReserveCheckinDays(' 30 '), true)
        for (const value of ['', '0', '-1', '1.5', '三']) {
            assert.equal(isValidReserveCheckinDays(value), false, value)
        }
    } finally { hooks.deregister() }
})

test('static countdown preserves supplied values and exposes a complete accessible label', async () => {
    const hooks = registerUiModules()
    try {
        const { Countdown } = await import('../src/components/Countdown/Countdown.tsx')
        const html = renderToStaticMarkup(createElement(Countdown, { label: '上所倒计时：', tone: 'cyan', value: ['00', '00', '00'] }))
        assert.match(html, /aria-label="上所倒计时： 00:00:00"/)
        assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 3)
    } finally { hooks.deregister() }
})
