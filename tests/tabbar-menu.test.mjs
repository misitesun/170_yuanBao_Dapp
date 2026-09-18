import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { registerUiModules } from './hu-ui-render.mjs'

test('static tabbar exposes all five finished destinations', async () => {
    const hooks = registerUiModules()
    try {
        const { TabbarMenu } = await import('../src/pages/main/layout/TabbarMenu.tsx')
        const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/preview/home'] }, createElement(TabbarMenu, { staticPreview: true })))
        for (const label of ['首页', '质押', '预售', 'OTC', '我的']) assert.ok(html.includes(label))
        assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1)
        assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 0)
        assert.match(html, /href="\/preview\/home"/)
        assert.match(html, /href="\/preview\/stake"/)
        assert.match(html, /href="\/preview\/presale"/)
        assert.match(html, /href="\/preview\/otc"/)
        assert.match(html, /href="\/preview\/user"/)
    } finally { hooks.deregister() }
})

test('normal tabbar navigates to built routes and preserves the selected route', async () => {
    const hooks = registerUiModules()
    try {
        const { TabbarMenu } = await import('../src/pages/main/layout/TabbarMenu.tsx')
        const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/user'] }, createElement(TabbarMenu)))
        assert.match(html, /href="\/home"/)
        assert.match(html, /href="\/user"/)
        assert.match(html, /href="\/presale"/)
        assert.match(html, /href="\/otc"/)
        assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1)
        assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 0)
    } finally { hooks.deregister() }
})
