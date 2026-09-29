import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function mountPage(folder, pageName) {
    const states = [], feedback = []
    let cursor = 0
    const jsx = (type, props) => ({ type, props })
    const boundaries = {
        'react-i18next': i18nRuntime,
        react: { useState: (initial) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = initial
            return [states[slot], (value) => { states[slot] = value }]
        } },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/components/ActionButton': { ActionButton: 'action' },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/SecondaryHeader': { SecondaryHeader: 'header' },
        '@/components/SegmentedTabs': { SegmentedTabs: 'tabs' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
    }
    function load(filename) {
        const exports = {}
        const { outputText } = ts.transpileModule(readFileSync(`src/pages/main/${folder}/${filename}`, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
        })
        runInNewContext(outputText, { exports, require: (name) => {
            if (name.endsWith('.scss')) return {}
            if (name === './data') return load('data.ts')
            assert.ok(name in boundaries, `unexpected boundary: ${name}`)
            return boundaries[name]
        } })
        return exports
    }
    const page = load(`${pageName}.tsx`)[pageName]
    function render(props = {}) {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
            if (node.type === 'header') walk(node.props.right)
        }
        walk(page(props))
        return nodes
    }
    return { render, feedback }
}

test('deposit record preview renders cards and the shared empty state without external boundaries', () => {
    const { render } = mountPage('deposit-records', 'DepositRecordsPage')
    assert.equal(render().filter((node) => node.type === 'article').length, 6)
    assert.equal(render().find((node) => node.type === 'header').props.title, '充值记录')
    assert.ok(render().some((node) => node.props.children === '静态示例'))
    assert.ok(render().some((node) => node.type === 'p' && node.props.children.includes('示例交易哈希')))
    const empty = render({ records: [] })
    assert.equal(empty.filter((node) => node.type === 'article').length, 0)
    assert.equal(empty.find((node) => node.type === 'empty').props.text, '暂无充值记录')
})

test('withdraw record tabs switch local status cards while cancellation remains feedback only', () => {
    const { render, feedback } = mountPage('withdraw-records', 'WithdrawRecordsPage')
    const tabs = () => render().find((node) => node.type === 'tabs')
    const cards = () => render().filter((node) => node.type === 'article')
    assert.equal(tabs().props.value, 'pending')
    assert.equal(cards().length, 9)
    render().find((node) => node.type === 'action').props.onClick()
    assert.deepEqual(feedback, ['取消提现功能待接入'])
    assert.equal(cards().length, 9)
    tabs().props.onChange('approved')
    assert.equal(cards().length, 9)
    assert.ok(!render().some((node) => node.type === 'action'))
    assert.ok(!render().some((node) => node.props.className?.includes('__reason')))
    tabs().props.onChange('rejected')
    assert.equal(cards().length, 5)
    assert.equal(render().filter((node) => node.props.className?.includes('__reason')).length, 5)
    const panel = render().find((node) => node.props.role === 'tabpanel')
    assert.equal(panel.props.id, 'withdraw-records-rejected-panel')
    assert.equal(panel.props['aria-labelledby'], 'withdraw-records-rejected-tab')
    const empty = render({ recordsByStatus: { pending: [], approved: [], rejected: [] } })
    assert.equal(empty.find((node) => node.type === 'empty').props.text, '暂无提现记录')
})
