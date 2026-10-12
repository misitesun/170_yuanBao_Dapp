import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('deposit fixes BSC20, generates a QR for the exact real address and keeps failure retry without sample QR and enables transfer only after address loading', async () => {
    const states = [], feedback = [], navigation = []
    let cursor = 0
    let retried = false
    const copied = []
    let data = { address: null, loading: true, failed: false, retry: () => { retried = true } }
    const jsx = (type, props) => ({ type, props })
    const modules = {
        '@/features/auth/state.ts': { useSessionStore: selector => selector({ user: { address: '0x52908400098527886E0F7030069857D2E4169EE7' } }) },
        '@/features/auth/session.ts': { refreshCurrentUser: async () => {} },
        '@/features/deposits/flow.ts': { depositUsdt: async () => {}, getDepositPhase: () => 'idle', subscribeDeposit: () => () => {} },
        '@/services/contracts/usdt.ts': { normalizeRechargeAmount: value => value || null },
        '@/services/dapp/index.ts': { waitForDappContractDataSync: async () => {} },
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        '@/components/Input': { Input: 'input' },
        '@/components/ActionButton': { ActionButton: 'action' },
        '@/components/ContractLoading': { ContractLoading: 'overlay' },
        'react-i18next': i18nRuntime,
        'qrcode.react': { QRCodeSVG: 'qrcode' },
        react: {
            useRef: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = { current: initial }; return states[slot] },
            useEffect: () => {},
            useSyncExternalStore: (_, snapshot) => snapshot(),
            useState: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = initial
                return [states[slot], (value) => { states[slot] = value }]
            },
        },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/router': { ROUTE_PATH: { depositRecords: '/deposit/records' }, useAppNavigate: () => ({ pushRoute: (path) => navigation.push(path) }) },
        './useRechargeAddress.ts': { useRechargeAddress: () => data },
        '@/shared/clipboard/copyTextToClipboard.ts': { copyTextToClipboard: async address => { copied.push(address); return true } },
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
    assert.equal(button('选择充值链'), undefined)
    assert.ok(render().some(node => node.props.children === 'BSC20'))
    assert.equal(button('复制充值地址').props.disabled, true)
    assert.equal(find('qrcode'), undefined)
    assert.equal(find('action').props.disabled, true)
    assert.ok(!render().some(node => node.type === 'img' && node.props.src?.default?.includes('qr-example')))
    data = { ...data, loading: false, failed: true }
    assert.equal(find('qrcode'), undefined)
    render().find(node => node.type === 'button' && node.props.children === '重新加载').props.onClick()
    assert.equal(retried, true)
    data = { ...data, failed: false, address: '0x52908400098527886E0F7030069857D2E4169EE7' }
    assert.equal(button('复制充值地址').props.disabled, false)
    assert.ok(render().some(node => node.props.children === data.address))
    assert.equal(find('qrcode').props.value, data.address)
    assert.ok(find('qrcode').props.marginSize >= 4)
    button('复制充值地址').props.onClick()
    await new Promise(setImmediate)
    assert.deepEqual(copied, [data.address])
    assert.equal(find('input').props.value, '')
    assert.equal(find('action').props.children, '确认充值')
    assert.equal(find('action').props.disabled, false)
    button('充值记录').props.onClick()
    assert.deepEqual(navigation, ['/deposit/records'])
    assert.deepEqual(feedback, ['复制成功'])
    data = { ...data, address: '0xfe2E1731CB06583E143bb64eA3636Ea8D64b748f' }
    assert.equal(find('qrcode').props.value, data.address)
    button('复制充值地址').props.onClick()
    await new Promise(setImmediate)
    assert.equal(copied.at(-1), find('qrcode').props.value)
    data = { ...data, address: null, loading: true }
    assert.equal(find('qrcode'), undefined)
})
