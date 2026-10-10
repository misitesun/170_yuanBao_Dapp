import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

test('transfer validates recipient and amount, prevents duplicate writes and isolates successful transfer from refresh failure', async () => {
    const states = [], feedback = []
    let cursor = 0, closes = 0
    let requestFailure = false
    const calls = [], busy = []
    const pending = deferred()
    const load = runtime({ '@/services/http/index.ts': { request: async () => {} } })
    const api = load('src/features/transfers/api.ts')
    const calculations = load('src/shared/calculations/decimalNumbers.ts')
    let config = { enabled: true, minimum: '1', feePercent: '2' }
    const ownAddress = '0x52908400098527886E0F7030069857D2E4169EE7'
    const recipient = '0xf390000000000000000000000000000000002266'
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        './useTransferConfig.ts': { useTransferConfig: () => ({ config, failed: false, retry: () => {} }) },
        '@/features/auth/state.ts': { useSessionStore: selector => selector({ user: { address: ownAddress, balances: { baoqi: '100.000001' } } }) },
        '@/features/transfers/api.ts': { ...api, submitTransfer: async (address, amount) => { calls.push({ address, amount }); if (requestFailure) throw new Error('failed'); await pending.promise } },
        '@/shared/calculations/decimalNumbers.ts': calculations,
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        react: { useEffect: () => {}, useRef: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = { current: initial }; return states[slot] }, useState: (initial) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = initial
            return [states[slot], (value) => { states[slot] = value }]
        } },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/components/ContractLoading': { ContractLoading: 'loading-overlay' },
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
        walk(exports.TransferPopup({ show, onClose: () => closes++, showToast: (text) => feedback.push(text), onSuccess: async () => { throw new Error('refresh') }, onSubmittingChange: value => busy.push(value) }))
        return nodes
    }
    const find = (type) => render().find((node) => node.type === type)
    const input = (id) => render().find((node) => node.type === 'input' && node.props.id === id)
    const event = { preventDefault: () => {} }
    input('transfer-address').props.onChange({ target: { value: 'invalid' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '请输入有效接收地址')
    input('transfer-address').props.onChange({ target: { value: ownAddress.toLowerCase() } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '不能转账给自己')
    input('transfer-address').props.onChange({ target: { value: recipient } })
    input('transfer-amount').props.onChange({ target: { value: '0.0000001' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '请输入有效转账数量')
    input('transfer-amount').props.onChange({ target: { value: '0.9999999' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '最低转账额度为 1')
    input('transfer-amount').props.onChange({ target: { value: '101' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '余额不足')
    config = { ...config, enabled: false }
    assert.equal(find('action').props['aria-disabled'], true)
    assert.ok(!render().some(node => node.type === 'p' && node.props.children === '转账未开启'))
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '转账未开启')
    assert.equal(calls.length, 0)
    config = { ...config, enabled: true }
    render().find(node => node.type === 'button' && node.props.children === '全部').props.onClick()
    assert.equal(input('transfer-amount').props.value, '100.000001')
    assert.ok(render().some(node => node.props.children === '100.000001 宝气'))
    input('transfer-amount').props.onChange({ target: { value: '12.1234567' } })
    const handler = find('form').props.onSubmit
    const first = handler(event)
    await handler(event)
    assert.deepEqual(calls, [{ address: recipient, amount: '12.123456' }])
    assert.equal(find('action').props.disabled, true)
    assert.equal(find('loading-overlay').props.show, true)
    assert.equal(find('action').props.children, '确认')
    assert.equal(input('transfer-address').props.disabled, true)
    find('popup').props.onClose()
    find('form').props.onKeyDown({ key: 'Escape' })
    assert.equal(closes, 0)
    pending.resolve()
    await first
    assert.equal(closes, 1)
    assert.equal(find('loading-overlay').props.show, false)
    assert.deepEqual(busy, [true, false])
    assert.ok(feedback.includes('转账成功'))
    assert.ok(feedback.includes('转账成功，资产刷新失败'))
    assert.ok(!feedback.includes('转账失败，请重试'))
    assert.equal(input('transfer-address').props.value, '')
    assert.equal(input('transfer-amount').props.value, '')
    requestFailure = true
    input('transfer-address').props.onChange({ target: { value: recipient } })
    input('transfer-amount').props.onChange({ target: { value: '10' } })
    await find('form').props.onSubmit(event)
    assert.equal(find('loading-overlay').props.show, false)
    assert.equal(find('action').props.disabled, false)
    assert.equal(input('transfer-amount').props.value, '10')
    assert.equal(feedback.at(-1), '转账失败，请重试')
})
