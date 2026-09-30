import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('withdraw selectors and form keep unconfigured data empty and only update local input or pending feedback', () => {
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
        '@/router': { ROUTE_PATH: { withdrawRecords: '/withdraw/records' }, useAppNavigate: () => ({ pushRoute: (path) => navigation.push(path) }) },
        '@/components/Picker': { Picker: 'picker' },
        '@/components/Input': { Input: 'input' },
        '@/components/SecondaryHeader': { SecondaryHeader: 'header' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/withdraw/WithdrawPage.tsx', 'utf8'), {
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
            if (node.type === 'input') walk(node.props.suffix)
        }
        walk(exports.WithdrawPage())
        return nodes
    }
    const find = (type) => render().find((node) => node.type === type)
    const button = (label) => render().find((node) => node.type === 'button' && node.props['aria-label'] === label)
    assert.equal(find('picker').props.show, false)
    button('选择提现币种').props.onClick()
    assert.equal(find('picker').props.show, true)
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.value), ['USDT'])
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.label), ['余额'])
    find('picker').props.onClose()
    assert.equal(find('picker').props.show, false)
    button('选择提现链').props.onClick()
    assert.equal(find('picker').props.title, '选择提现链')
    assert.equal(find('picker').props.options.length, 0)
    assert.equal(find('picker').props.emptyText, '暂无可用提现链')
    find('picker').props.onClose()
    assert.ok(render().some((node) => node.type === 'p' && node.props.children === '可用：-- 余额'))
    assert.ok(render().some((node) => node.type === 'p' && node.props.children === '手续费 待配置'))
    const input = find('input')
    assert.equal(input.props.inputMode, 'decimal')
    assert.equal(input.props.value, '')
    input.props.onChange({ target: { value: '12.3400' } })
    assert.equal(find('input').props.value, '12.3400')
    render().find((node) => node.type === 'button' && node.props.children === '全部').props.onClick()
    assert.equal(find('input').props.value, '12.3400')
    assert.equal(feedback.pop(), '可用余额待配置')
    assert.ok(render().some((node) => node.type === 'button' && node.props.type === 'submit' && node.props.children === '提现'))
    let prevented = false
    find('form').props.onSubmit({ preventDefault: () => { prevented = true } })
    assert.equal(prevented, true)
    assert.equal(feedback.pop(), '提现功能待接入')
    button('提现记录').props.onClick()
    assert.deepEqual(navigation, ['/withdraw/records'])
    assert.deepEqual(feedback, [])
})
