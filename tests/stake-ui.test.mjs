import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { registerUiModules } from './hu-ui-render.mjs'

test('stake page renders native grouped radios and an accessible empty amount field', async () => {
    const hooks = registerUiModules()
    try {
        const { StakePage } = await import('../src/pages/main/stake/StakePage.tsx')
        const html = renderToStaticMarkup(createElement(
            MemoryRouter,
            null,
            createElement(StakePage),
        ))
        assert.equal((html.match(/type="radio"/g) ?? []).length, 2)
        assert.equal((html.match(/name="stake-asset"/g) ?? []).length, 2)
        assert.equal((html.match(/checked=""/g) ?? []).length, 1)
        assert.match(html, /for="stake-amount"/)
        assert.match(html, /id="stake-amount"/)
        assert.match(html, /inputMode="decimal"/)
        assert.match(html, /type="submit"/)
        assert.match(html, /2,874.889542/)
        assert.match(html, /10,124.346788/)
    } finally { hooks.deregister() }
})

test('Input and Radio preserve native form and accessibility props', async () => {
    const hooks = registerUiModules()
    try {
        const { Input } = await import('../src/components/Input/Input.tsx')
        const { Radio } = await import('../src/components/Radio/Radio.tsx')
        const input = renderToStaticMarkup(createElement(Input, { id: 'amount', name: 'amount', value: '12', disabled: true, 'aria-invalid': true, onChange() {} }))
        assert.match(input, /id="amount"/)
        assert.match(input, /disabled=""/)
        assert.match(input, /aria-invalid="true"/)
        assert.match(input, /value="12"/)
        assert.match(input, /app-input--focus-gradient/)
        const compatibilityInput = renderToStaticMarkup(createElement(Input, { focusVariant: 'default', 'aria-label': 'Compatibility amount' }))
        assert.match(compatibilityInput, /app-input--focus-default/)
        const prefixedInput = renderToStaticMarkup(createElement(Input, { prefix: createElement('span', null, 'prefix'), 'aria-label': 'Search' }))
        assert.match(prefixedInput, /app-input__prefix/)
        assert.match(prefixedInput, /aria-label="Search"/)
        const radio = renderToStaticMarkup(createElement(Radio, { name: 'asset', value: 'HU', checked: true, disabled: true, onChange() {} }))
        assert.match(radio, /type="radio"/)
        assert.match(radio, /name="asset"/)
        assert.match(radio, /checked=""/)
        assert.match(radio, /disabled=""/)
    } finally { hooks.deregister() }
})
