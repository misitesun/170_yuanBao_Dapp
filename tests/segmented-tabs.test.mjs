import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { registerUiModules } from './hu-ui-render.mjs'

test('SegmentedTabs renders a controlled semantic two-to-three item tab list', async () => {
    const hooks = registerUiModules()

    try {
        const { SegmentedTabs } = await import('../src/components/SegmentedTabs/SegmentedTabs.tsx')
        const html = renderToStaticMarkup(createElement(SegmentedTabs, {
            items: [
                { value: 'staking', label: '质押中' },
                { value: 'converted', label: '已转化' },
                { value: 'completed', label: '已完成' },
            ],
            value: 'staking',
            onChange() {},
            ariaLabel: '质押订单状态',
            idPrefix: 'stake-orders',
        }))

        assert.match(html, /role="tablist"/)
        assert.equal((html.match(/role="tab"/g) ?? []).length, 3)
        assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1)
        assert.match(html, /id="stake-orders-staking-tab"/)
        assert.match(html, /aria-controls="stake-orders-staking-panel"/)
    } finally {
        hooks.deregister()
    }
})
