import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('deposit selectors keep missing chain data empty and never expose a usable address or submit form', () => {
    const states = [], feedback = [], navigation = []
    let cursor = 0
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        react: {
            useState: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = initial
                return [states[slot], (value) => { states[slot] = value }]
            },
        },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/router': { ROUTE_PATH: { depositRecords: '/deposit/records' }, useAppNavigate: () => ({ pushRoute: (path) => navigation.push(path) }) },
        '@/components/Picker': { Picker: 'picker' },
        '@/components/SecondaryHeader': { SecondaryHeader: 'header' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/deposit/DepositPage.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    runInNewContext(outputText, {
        exports,
        require: (name) => {
            if (name.startsWith('@/assets/')) return { default: name }
            if (name.endsWith('.scss')) return {}
            assert.ok(name in modules, `unexpected boundary: ${name}`)
            return modules[name]
        },
    })
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
            if (node.type === 'header') walk(node.props.right)
        }
        walk(exports.DepositPage())
        return nodes
    }
    const find = (type) => render().find((node) => node.type === type)
    const button = (label) => render().find((node) => node.type === 'button' && node.props['aria-label'] === label)
    assert.equal(find('picker').props.show, false)
    button('选择充值币种').props.onClick()
    assert.equal(find('picker').props.show, true)
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.value), ['USDT'])
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.label), ['余额'])
    find('picker').props.onClose()
    assert.equal(find('picker').props.show, false)
    button('选择充值链').props.onClick()
    assert.equal(find('picker').props.title, '选择充值链')
    assert.equal(find('picker').props.options.length, 0)
    assert.equal(find('picker').props.emptyText, '暂无可用充值链')
    find('picker').props.onClose()
    assert.equal(button('复制充值地址').props.disabled, true)
    assert.equal(button('复制充值地址').props.onClick, undefined)
    assert.ok(!render().some((node) => ['input', 'form'].includes(node.type)))
    assert.ok(!render().some((node) => node.type === 'button' && node.props.children === '确认充值'))
    button('充值记录').props.onClick()
    assert.deepEqual(navigation, ['/deposit/records'])
    assert.deepEqual(feedback, [])
})
