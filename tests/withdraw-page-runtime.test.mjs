import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

test('withdraw fixed chain validates amounts, submits once and isolates balance refresh failure from successful application', async () => {
    const states = [], feedback = [], navigation = []
    let cursor = 0
    const calls = []
    let refreshed = 0
    let refreshFailure = true
    const submission = deferred()
    let progress = { phase: 'idle' }
    let requestFailure
    let reported = false
    let ambiguousFailure = false
    let config = { enabled: true, minimum: '10', feePercent: '1' }
    const load = runtime({ '@/services/http/index.ts': { request: async () => {} } })
    const api = load('src/features/claims/api.ts')
    const calculations = load('src/shared/calculations/decimalNumbers.ts')
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        './useClaimConfig.ts': { useClaimConfig: () => ({ config, failed: false, retry: () => {} }) },
        '@/features/auth/state.ts': { useSessionStore: selector => selector({ user: { address: '0x52908400098527886E0F7030069857D2E4169EE7', balances: { usdt: '100.000001' } } }) },
        '@/features/auth/session.ts': { refreshCurrentUser: async () => { refreshed++; if (refreshFailure) throw new Error('refresh failed') } },
        '@/features/claims/api.ts': { normalizeClaimAmount: api.normalizeClaimAmount },
        '@/features/claims/flow.ts': { getClaimProgress: () => progress, subscribeClaimProgress: () => () => {}, startNewClaim: () => { progress = { phase: 'idle' } }, executeClaim: async (_account, amount) => { calls.push(amount); progress = { phase: 'requesting' }; if (requestFailure) { progress = ambiguousFailure ? { phase: 'blocked', message: '提现申请结果待确认，请联系平台核对，勿重复申请' } : { phase: 'idle' }; throw requestFailure }; await submission.promise; progress = { phase: 'complete', payload: {} } } },
        '@/shared/calculations/decimalNumbers.ts': calculations,
        '@/services/http/index.ts': { wasHttpErrorReported: () => reported },
        react: {
            useRef: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = { current: initial }; return states[slot] },
            useEffect: () => {},
            useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
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
        '@/components/ContractLoading': { ContractLoading: 'loading-overlay' },
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
    assert.equal(find('loading-overlay').props.show, false)
    button('选择提现币种').props.onClick()
    assert.equal(find('picker').props.show, true)
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.value), ['USDT'])
    assert.deepEqual(Array.from(find('picker').props.options, (item) => item.label), ['余额'])
    find('picker').props.onClose()
    assert.equal(find('picker').props.show, false)
    assert.equal(button('选择提现链'), undefined)
    assert.ok(render().some(node => node.props.children === 'BSC20'))
    assert.ok(render().some(node => node.props.children === '可用 100.000001 余额'))
    assert.ok(render().some(node => node.props.children === '手续费 1%'))
    const input = find('input')
    assert.equal(input.props.inputMode, 'decimal')
    assert.equal(input.props.value, '')
    input.props.onChange({ target: { value: '12.3400' } })
    assert.equal(find('input').props.value, '12.3400')
    render().find(node => node.type === 'button' && node.props.children === '全部').props.onClick()
    assert.equal(find('input').props.value, '100.000001')
    const event = { preventDefault: () => {} }
    find('input').props.onChange({ target: { value: '0.0000001' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '请输入有效提现数量')
    find('input').props.onChange({ target: { value: '9.9999999' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '最低提现额度为 10')
    find('input').props.onChange({ target: { value: '101' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '余额不足')
    config = { ...config, enabled: false }
    await find('form').props.onSubmit(event)
    assert.equal(feedback.pop(), '提取功能未开启')
    config = { ...config, enabled: true }
    find('input').props.onChange({ target: { value: '12.1234567' } })
    const handler = find('form').props.onSubmit
    const first = handler(event)
    await handler(event)
    assert.deepEqual(calls, ['12.123456'])
    assert.equal(find('input').props.disabled, true)
    assert.equal(find('loading-overlay').props.show, true)
    assert.equal(render().find(node => node.type === 'button' && node.props.type === 'submit').props.children, '提现')
    submission.resolve()
    await first
    assert.equal(find('loading-overlay').props.show, false)
    assert.equal(refreshed, 1)
    assert.ok(feedback.includes('提现成功'))
    assert.ok(feedback.includes('申请已提交，余额刷新失败'))
    assert.ok(!feedback.includes('提现申请失败，请重试'))
    assert.equal(render().find(node => node.type === 'button' && node.props.type === 'submit').props.disabled, false)
    assert.equal(find('input').props.disabled, false)
    await find('form').props.onSubmit(event)
    assert.equal(calls.length, 1)
    assert.equal(find('input').props.disabled, false)
    // HTTP feedback is already presented by the app; failure must unlock the form.
    requestFailure = Object.assign(new Error('Internal Server Error.'), { status: 500 })
    reported = true
    const feedbackBefore = feedback.length
    find('input').props.onChange({ target: { value: '20' } })
    await find('form').props.onSubmit(event)
    assert.equal(feedback.length, feedbackBefore)
    assert.equal(find('input').props.disabled, false)
    assert.equal(find('loading-overlay').props.show, false)
    assert.equal(render().find(node => node.type === 'button' && node.props.type === 'submit').props.disabled, false)
    assert.equal(refreshed, 1)
    await find('form').props.onSubmit(event)
    assert.deepEqual(calls, ['12.123456', '20', '20'])
    assert.equal(feedback.length, feedbackBefore)
    // Even a retained ambiguous result must not produce a second HTTP Toast.
    ambiguousFailure = true
    await find('form').props.onSubmit(event)
    assert.equal(feedback.length, feedbackBefore)
    assert.equal(render().find(node => node.props.role === 'status'), undefined)
    assert.equal(render().find(node => node.type === 'button' && node.props.type === 'submit').props.children, '提现')
    // Wallet/RPC failures use one short failure Toast, never raw details in the form.
    progress = { phase: 'idle' }
    reported = false
    refreshFailure = false
    await find('form').props.onSubmit(event)
    assert.equal(feedback.at(-1), '提现失败')
    assert.equal(feedback.length, feedbackBefore + 1)
    assert.ok(!render().some(node => node.props.children === progress.message))
    for (const phase of ['ready', 'uncertain', 'expired', 'blocked']) {
        progress = { phase, payload: { id: 12 } }
        assert.equal(find('input').props.disabled, false)
        const all = render().find(node => node.type === 'button' && node.props.children === '全部')
        assert.equal(all.props.disabled, false)
        find('input').props.onChange({ target: { value: '30' } })
        assert.equal(find('input').props.value, '30')
        all.props.onClick()
        assert.equal(find('input').props.value, '100.000001')
    }
    // Editing a failed form must not replace the existing signed withdrawal on retry.
    progress = { phase: 'ready', payload: { id: 12 } }
    requestFailure = undefined
    find('input').props.onChange({ target: { value: '30' } })
    await find('form').props.onSubmit(event)
    assert.equal(calls.at(-1), '')
    button('提现记录').props.onClick()
    assert.deepEqual(navigation, ['/withdraw/records'])
})
