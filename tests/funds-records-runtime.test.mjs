import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime } from './helpers/yuanbao-runtime.mjs'

function mountPage(folder, name, initialState) {
    let state = initialState
    const feedback = [], replacements = [], loads = []
    const jsx = (type, props) => ({ type, props })
    const pagination = {
        replace: async query => { replacements.push(query); state = { ...state, query: query ?? state.query, items: [], isFirstLoading: true, hasMore: false } },
        loadMore: async () => { loads.push(true) },
    }
    const page = runtime({
        react: { useCallback: fn => fn },
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        '@/components/DropletLoading': { DropletLoading: 'loading' },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/SecondaryHeader': { SecondaryHeader: 'header' },
        '@/components/SegmentedTabs': { SegmentedTabs: 'tabs' },
        '@/components/PagePullRefresh': { PagePullRefresh: 'refresh' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: text => feedback.push(text) }) },
        '@/services/http/index.ts': { wasHttpErrorReported: error => error?.reported },
        'src/pages/main/funds-records/useFundsRecords.ts': { useFundsRecords: () => ({ state, pagination }) },
    })(`src/pages/main/${folder}/${name}.tsx`)[name]
    function render() {
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) return node.forEach(walk)
            if (!node || typeof node !== 'object') return
            if (typeof node.type === 'function') return walk(node.type(node.props))
            nodes.push(node); walk(node.props?.children)
        }
        walk(page())
        return nodes
    }
    return { render, replacements, loads, feedback, setState: next => { state = { ...state, ...next } } }
}
const ready = { query: 'pending', items: [], isFirstLoading: false, isLoadingMore: false, loadError: false, hasMore: false }

test('deposit renders real fields, separates loading/failure/empty and retries the failed page', async () => {
    const page = mountPage('deposit-records', 'DepositRecordsPage', { ...ready, query: null,
        items: [{ id: 2, createdAt: '2026-10-10 15:33:58', from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', amount: '9007199254740993.123456', txId: 'REAL_HASH' }] })
    let nodes = page.render()
    assert.equal(nodes.filter(n => n.type === 'article').length, 1)
    assert.ok(nodes.some(n => n.props.children === '0xf39****2266'))
    assert.ok(!nodes.some(n => n.props.children === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'))
    assert.ok(nodes.some(n => n.props.children === '交易哈希：REAL_HASH'))
    assert.equal(nodes.find(n => n.type === 'time').props.dateTime, '2026-10-10T15:33:58')
    assert.equal(nodes.find(n => n.type === 'time').props.children, '2026.10.10 15:33:58')
    assert.ok(!nodes.some(n => n.props.children === '静态示例'))
    page.setState({ items: [], isFirstLoading: true })
    nodes = page.render()
    assert.ok(!nodes.some(n => n.type === 'loading'))
    assert.ok(!nodes.some(n => n.type === 'empty'))
    page.setState({ isFirstLoading: false, loadError: true })
    nodes = page.render()
    assert.ok(!nodes.some(n => n.type === 'empty'))
    await nodes.find(n => n.type === 'button').props.onClick()
    assert.equal(page.replacements.length, 1)
    page.setState({ isFirstLoading: false, loadError: false })
    assert.equal(page.render().find(n => n.type === 'empty').props.text, '暂无充值记录')
    page.setState({ loadError: true, items: [{ id: 1, createdAt: '2026-10-10 15:33:58', from: 'FULL', amount: '1', txId: 'HASH' }] })
    page.render().find(n => n.type === 'button').props.onClick()
    assert.equal(page.loads.length, 1)
})

test('withdraw shows distinct requested/received/fee values, switches documented filters and has no invented fields/actions', () => {
    const page = mountPage('withdraw-records', 'WithdrawRecordsPage', { ...ready,
        items: [{ id: 8, createdAt: '2026-10-10 15:05:13', requestedAmount: '100', amount: '99.5', fee: '0.5', status: 1 }] })
    const nodes = page.render()
    const tabs = nodes.find(n => n.type === 'tabs')
    assert.deepEqual(Array.from(tabs.props.items, item => item.label), ['提币中', '成功', '失败'])
    assert.equal(tabs.props.value, 'pending')
    for (const label of ['申请金额', '到账金额', '手续费']) assert.ok(nodes.some(n => n.props.children === label))
    assert.equal(nodes.find(n => n.type === 'time').props.dateTime, '2026-10-10T15:05:13')
    assert.equal(nodes.find(n => n.type === 'time').props.children, '2026.10.10 15:05:13')
    assert.ok(!nodes.some(n => n.type === 'button' || n.props.children === '静态示例'))
    tabs.props.onChange('succeeded')
    assert.deepEqual(page.replacements, ['succeeded'])
    assert.ok(!page.render().some(n => n.type === 'loading'))
    assert.ok(!page.render().some(n => n.type === 'article'))
    page.setState({ isFirstLoading: false, items: [] })
    assert.equal(page.render().find(n => n.type === 'empty').props.text, '暂无提现记录')
    page.render().find(n => n.type === 'tabs').props.onChange('failed')
    assert.deepEqual(page.replacements, ['succeeded', 'failed'])
    assert.equal(page.render().find(n => n.props.role === 'tabpanel').props.id, 'withdraw-records-failed-panel')
})

test('page feedback deduplicates globally reported HTTP errors', () => {
    const page = mountPage('deposit-records', 'DepositRecordsPage', ready)
    const onError = page.render().find(n => n.type === 'refresh').props.onError
    onError({ reported: true })
    assert.equal(page.feedback.length, 0)
    onError(new Error('invalid payload'))
    assert.deepEqual(page.feedback, ['充值记录加载失败，请重试'])
})

test('records hook registers actual work and disarms load-more during page one replacement', async () => {
    const states = [], requests = [], errors = []
    let cursor = 0, effect, refresh, more
    const hook = runtime({ react: {
        useState: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial; return [states[slot]] },
        useEffect: fn => { effect = fn },
        useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    }, '@/components/PagePullRefresh': {
        usePageRefresh: (callback, enabled) => { refresh = { callback, enabled } },
        usePageLoadMore: (callback, options) => { more = { callback, options } },
    } })('src/pages/main/funds-records/useFundsRecords.ts').useFundsRecords
    const loader = async (query, page, signal) => { requests.push({ query, page, signal }); return { items: ['real'], hasMore: true } }
    const onError = error => errors.push(error)
    const render = () => { cursor = 0; return hook(loader, 'pending', onError) }
    render(); const cleanup = effect()
    assert.equal(more.options.enabled, false)
    assert.equal(more.options.hasMore, false)
    await new Promise(setImmediate)
    render()
    assert.equal(more.options.enabled, true)
    const work = refresh.callback()
    render()
    assert.equal(more.options.enabled, false)
    assert.equal(more.options.hasMore, false)
    await work
    assert.equal(render().state.items[0], 'real')
    cleanup()
    assert.equal(requests.at(-1).signal.aborted, true)
    assert.equal(errors.length, 0)
})
