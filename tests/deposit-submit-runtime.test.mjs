import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime, deferred, ADDRESS } from './helpers/yuanbao-runtime.mjs'

function mount() {
    const states = [], transfers = [], feedback = [], refreshes = []
    let cursor = 0, cleanup, account = ADDRESS
    const address = '0xfe2E1731CB06583E143bb64eA3636Ea8D64b748f'
    const jsx = (type, props) => ({ type, props })
    const { normalizeRechargeAmount } = runtime({ '../dapp/index.ts': {}, './config.ts': {} })('src/services/contracts/usdt.ts')
    const { DepositPage } = runtime({
        react: {
            useState: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = value }] },
            useRef: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = { current: initial }; return states[slot] },
            useEffect: effect => { cleanup = effect() },
            useSyncExternalStore: (_, snapshot) => snapshot(),
        }, 'react/jsx-runtime': { jsx, jsxs: jsx },
        'qrcode.react': { QRCodeSVG: 'qr' },
        '@/assets/deposit/record.svg': {}, '@/assets/deposit/address-copy.svg': {},
        '@/assets/deposit/select-chevron.svg': {}, '@/assets/deposit/qr-background.png': {},
        '@/components/Picker': { Picker: 'picker' }, '@/components/SecondaryHeader': { SecondaryHeader: 'header' },
        '@/components/Input': { Input: 'input' }, '@/components/ActionButton': { ActionButton: 'action' },
        '@/components/ContractLoading': { ContractLoading: 'overlay' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (...args) => feedback.push(args) }) },
        '@/router': { ROUTE_PATH: {}, useAppNavigate: () => ({}) },
        '@/shared/clipboard/copyTextToClipboard.ts': {},
        './useRechargeAddress.ts': { useRechargeAddress: () => ({ address, loading: false }) },
        '@/features/auth/state.ts': { useSessionStore: selector => selector({ user: { address: account } }) },
        '@/features/auth/session.ts': { refreshCurrentUser: () => { const wait = deferred(); refreshes.push(wait); return wait.promise } },
        '@/features/deposits/flow.ts': { getDepositPhase: () => 'idle', subscribeDeposit: () => () => {},
            depositUsdt: (...args) => { const wait = deferred(); transfers.push({ args, ...wait }); return wait.promise } },
        '@/services/contracts/usdt.ts': { normalizeRechargeAmount },
        '@/services/dapp/index.ts': { waitForDappContractDataSync: async () => {} },
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
    }, { Error })('src/pages/main/deposit/DepositPage.tsx')
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node); walk(node.props?.children)
        }
        walk(DepositPage()); return nodes
    }
    const find = type => render().find(node => node.type === type)
    return { find, transfers, feedback, refreshes, address,
        input: value => find('input').props.onChange({ target: { value } }),
        submit: () => find('form').props.onSubmit({ preventDefault() {} }),
        unmount: () => cleanup(), switchAccount: () => { account = address; render() } }
}
const flush = () => new Promise(setImmediate)

test('deposit requires input, prevents duplicate sends and restores input after failure', async () => {
    const page = mount()
    assert.equal(page.find('input').props.value, '')
    await page.submit()
    assert.equal(page.transfers.length, 0)
    assert.deepEqual(page.feedback.at(-1), ['请输入有效充值数量', 'error'])
    page.input('2.5')
    const request = page.submit()
    await page.submit()
    assert.equal(page.transfers.length, 1)
    assert.deepEqual(page.transfers[0].args, [ADDRESS, page.address, '2.5'])
    assert.equal(page.find('input').props.disabled, true)
    assert.equal(page.find('action').props.loading, true)
    assert.equal(page.find('action').props.children, '确认充值')
    assert.equal(page.find('overlay').props.show, true)
    page.transfers[0].reject(new Error('已取消钱包转账'))
    await request
    assert.equal(page.find('input').props.value, '2.5')
    assert.equal(page.find('input').props.disabled, false)
    assert.equal(page.find('overlay').props.show, false)
    assert.equal(page.refreshes.length, 0)
    assert.deepEqual(page.feedback.at(-1), ['已取消钱包转账', 'error'])
})

test('deposit receipt success clears input and balance refresh failure is not a transfer failure', async () => {
    const page = mount()
    page.input('3')
    const request = page.submit()
    page.transfers[0].resolve()
    await flush()
    assert.equal(page.find('input').props.value, '')
    assert.equal(page.find('overlay').props.show, false)
    assert.deepEqual(page.feedback.at(-1), ['充值成功', 'success'])
    assert.equal(page.refreshes.length, 1)
    page.refreshes[0].reject(new Error('refresh failed'))
    await request
    assert.deepEqual(page.feedback.at(-1), ['充值成功，余额刷新失败', 'error'])
})

test('departed or changed accounts never receive old transfer results or refreshes', async () => {
    for (const exit of ['unmount', 'switchAccount']) {
        const page = mount()
        page.input('1')
        const request = page.submit()
        page[exit]()
        page.transfers[0].resolve()
        await request
        assert.equal(page.feedback.length, 0)
        assert.equal(page.refreshes.length, 0)
    }
})
