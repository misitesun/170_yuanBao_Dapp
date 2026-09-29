import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('transfer form preserves local values, uses pending-only actions and resets only after closing', () => {
    const states = [], feedback = []
    let cursor = 0, closes = 0
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        react: { useState: (initial) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = initial
            return [states[slot], (value) => { states[slot] = value }]
        } },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/components/Popup': { Popup: 'popup' },
        '@/components/Input': { Input: 'input' },
        '@/components/ActionButton': { ActionButton: 'action' },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/assets/TransferPopup.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    runInNewContext(outputText, { exports, require: (name) => {
        if (name.startsWith('@/assets/')) return { default: name }
        if (name.endsWith('.scss')) return {}
        assert.ok(name in modules, `unexpected boundary: ${name}`)
        return modules[name]
    } })
    function render(show = true) {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
            if (node.type === 'input') walk(node.props.suffix)
        }
        walk(exports.TransferPopup({ show, onClose: () => closes++, showToast: (text) => feedback.push(text) }))
        return nodes
    }
    const find = (type) => render().find((node) => node.type === type)
    const input = (id) => render().find((node) => node.type === 'input' && node.props.id === id)
    input('transfer-address').props.onChange({ target: { value: 'preview-address' } })
    input('transfer-amount').props.onChange({ target: { value: '12.3400' } })
    assert.equal(input('transfer-amount').props.inputMode, 'decimal')
    render().find((node) => node.type === 'button' && node.props.children === '全部').props.onClick()
    assert.deepEqual(feedback, ['可用余额待配置'])
    assert.equal(input('transfer-amount').props.value, '12.3400')
    assert.ok(render().some((node) => node.props.children === '-- 宝气'))
    assert.equal(find('action').props.type, 'submit')
    let prevented = false
    find('form').props.onSubmit({ preventDefault: () => { prevented = true } })
    assert.equal(prevented, true)
    assert.deepEqual(feedback, ['可用余额待配置', '转账功能待接入'])
    assert.equal(input('transfer-address').props.value, 'preview-address')
    assert.equal(input('transfer-amount').props.value, '12.3400')
    find('form').props.onKeyDown({ key: 'Escape' })
    find('popup').props.onClose()
    assert.equal(closes, 2)
    assert.equal(render(false).find((node) => node.type === 'popup').props.show, false)
    assert.equal(input('transfer-amount').props.value, '12.3400')
    find('popup').props.onAfterClose()
    assert.equal(input('transfer-address').props.value, '')
    assert.equal(input('transfer-amount').props.value, '')
})
