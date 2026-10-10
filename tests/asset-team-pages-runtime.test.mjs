import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createListPagination } from '../src/pages/main/pagination/pagination.ts'
const TEAM_EMPTY_OVERVIEW = { invitationCode: '', invitationContent: '', level: null, statistics: [] }

// Execute the actual page and registration hook; replace DOM and external IO boundaries only.
function mountPage(kind) {
    const requests = [], effects = [], states = [], errors = [], routes = []
    let cursor = 0, refresh, loadMore, options, refreshEnabled
    const load = (query, page) => new Promise((resolve, reject) => requests.push({ query, page, resolve, reject }))
    const jsx = (type, props) => ({ type, props })
    const react = {
        useCallback: (fn) => fn,
        useState: (init) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = typeof init === 'function' ? init() : init
            return [states[slot], (value) => { states[slot] = value }]
        },
        useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
        useEffect: (effect) => { if (effects.length === 0) effects.push(effect) },
    }
    const modules = {
        'react-i18next': i18nRuntime,
        react,
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        '@/router': { ROUTE_PATH: { deposit: '/deposit', withdraw: '/withdraw' }, useAppNavigate: () => ({ pushRoute: (path) => routes.push(path) }) },
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        './pagination.ts': { createListPagination },
        '@/components/PagePullRefresh': {
            PagePullRefresh: 'refresh-wrapper',
            usePageRefresh: (fn, enabled) => { refresh = fn; refreshEnabled = enabled },
            usePageLoadMore: (fn, settings) => { loadMore = fn; options = settings },
        },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (...args) => errors.push(args) }) },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/DropletLoading': { DropletLoading: 'loading' },
        '@/components/SegmentedTabs': { SegmentedTabs: 'tabs' },
        '@/components/Input': { Input: 'input' },
        '@/stores/dapp/index.ts': { useDappStore: (selector) => selector({ walletAddress: '' }) },
        '@/shared/clipboard/copyTextToClipboard.ts': { copyTextToClipboard: async () => true },
        '@/shared/formatters/maskWalletAddress.ts': { maskWalletAddress: () => '--' },
        './service.ts': {
            loadAssetsPage: load,
            loadTeamPage: load, TEAM_EMPTY_OVERVIEW,
        },
        './TransferPopup': { TransferPopup: 'transfer-popup' },
    }
    function compile(path) {
        const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
        })
        const exports = {}
        runInNewContext(outputText, {
            exports,
            require: (name) => {
                if (name.startsWith('@/assets/')) return { default: name }
                if (name.endsWith('.scss')) return {}
                assert.ok(name in modules, `unexpected boundary: ${name}`)
                return modules[name]
            },
        })
        return exports
    }
    modules['../pagination/usePreviewList.ts'] = compile('src/pages/main/pagination/usePreviewList.ts')
    const pageName = kind === 'assets' ? 'AssetsPage' : 'TeamPage'
    const page = compile(`src/pages/main/${kind}/${pageName}.tsx`)[pageName]
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            if (typeof node.type === 'function') { walk(node.type(node.props)); return }
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(page())
        return nodes
    }
    render()
    const cleanup = effects[0]()
    return {
        requests, render, cleanup, errors, routes,
        refresh: () => refresh(), more: () => loadMore(),
        settings: () => ({ options, refreshEnabled }),
    }
}
const flush = () => new Promise(setImmediate)

test('asset actions navigate to deposit and withdraw and open the existing transfer popup without extra requests', () => {
    const page = mountPage('assets')
    const actions = page.render().filter((node) => node.type === 'button' && node.props.className?.includes('assets-page__action--'))
    const initialRequests = page.requests.length
    assert.equal(page.render().find((node) => node.type === 'transfer-popup').props.show, false)
    for (const action of actions) action.props.onClick()
    assert.deepEqual(page.routes, ['/deposit', '/withdraw'])
    const popup = page.render().find((node) => node.type === 'transfer-popup')
    assert.equal(popup.props.show, true)
    popup.props.onClose()
    assert.equal(page.render().find((node) => node.type === 'transfer-popup').props.show, false)
    assert.equal(page.requests.length, initialRequests)
    assert.deepEqual(page.errors, [])
    page.cleanup()
})

for (const kind of ['assets', 'team']) {
    test(`${kind} registers awaited refresh and append, then distinguishes empty, first-load and failure`, async () => {
        const page = mountPage(kind)
        const loading = page.render()
        assert.ok(!loading.some((node) => node.type === 'loading'))
        assert.ok(!loading.some((node) => node.type === 'empty'))
        assert.equal(page.settings().refreshEnabled, false)
        assert.equal(page.settings().options.enabled, false)
        assert.equal(page.settings().options.hasMore, false)
        await page.more()
        assert.equal(page.requests.length, 1)
        page.requests[0].resolve({ items: [], hasMore: false })
        await flush()
        assert.ok(page.render().some((node) => node.type === 'empty'))
        assert.equal(page.settings().options.showNoMore, false)
        assert.equal(page.settings().refreshEnabled, true)
        assert.equal(page.settings().options.loadingIndicator, 'droplet')

        let refreshed = false
        const refresh = page.refresh().then(() => { refreshed = true })
        page.render()
        await Promise.resolve()
        assert.equal(refreshed, false)
        assert.equal(page.settings().options.hasMore, false)
        assert.equal(page.settings().options.enabled, false)
        const item = kind === 'assets'
            ? { id: 'new', amount: '+1.00', tone: 'income', content: '每日释放', createdAt: '2026-09-29 00:00:00' }
            : { id: 'new', name: 'member', joinedAt: '2026-09-29 00:00:00', kpi: '0', teamKpi: '0', level: null }
        page.requests[1].resolve({ items: [item], hasMore: true })
        await refresh
        assert.ok(!page.render().some((node) => node.type === 'empty'))
        assert.equal(page.settings().options.showNoMore, true)
        const more = page.more()
        page.render()
        assert.equal(page.settings().options.enabled, false)
        page.requests[2].resolve({ items: [], hasMore: false })
        await more
        page.render()
        assert.equal(page.settings().options.hasMore, false)
        assert.equal(page.settings().options.showNoMore, true)

        const failed = page.refresh()
        page.requests[3].reject(new Error('failure'))
        await assert.rejects(failed, /failure/)
        const failureNodes = page.render()
        assert.ok(!failureNodes.some((node) => node.type === 'empty'))
        const retry = failureNodes.find((node) => node.type === 'button' && node.props.children === '重新加载')
        assert.ok(retry)
        retry.props.onClick()
        assert.equal(page.requests[4].page, 1)
        page.requests[4].resolve({ items: [], hasMore: false })
        await flush()
        assert.ok(page.render().some((node) => node.type === 'empty'))
        page.cleanup()
    })
}

test('asset Tab switching immediately closes append and discards an older pending load', async () => {
    const page = mountPage('assets')
    page.requests[0].resolve({ items: [{ id: 'old', amount: '+1.00', tone: 'income', content: '每日释放', createdAt: '2026-09-29 00:00:00' }], hasMore: true })
    await flush()
    page.render()
    const oldMore = page.more()
    const tabs = page.render().find((node) => node.type === 'tabs')
    tabs.props.onChange('yuanqi')
    page.render()
    assert.equal(page.settings().options.enabled, false)
    assert.equal(page.settings().options.hasMore, false)
    assert.equal(page.settings().options.showNoMore, false)
    assert.equal(page.requests[2].query, 'yuanqi')
    page.requests[1].resolve({ items: [{ id: 'stale' }], hasMore: true })
    await oldMore
    page.requests[2].resolve({ items: [], hasMore: false })
    await flush()
    const nodes = page.render()
    assert.ok(nodes.some((node) => node.type === 'empty'))
    assert.ok(!nodes.some((node) => node.type === 'article' && node.props.className?.startsWith('assets-page__record')))
    page.cleanup()
})

test('transfer records tab clears old balance rows, displays counterparty and fee and keeps pagination isolated', async () => {
    const page = mountPage('assets')
    page.requests[0].resolve({ items: [{ id: 1, amount: '+1', tone: 'income', content: '余额旧记录', createdAt: '2026-10-10 12:00:00' }], hasMore: true })
    await flush()
    const tabs = page.render().find(node => node.type === 'tabs')
    assert.equal(tabs.props.items.at(-1).label, '转账记录')
    tabs.props.onChange('transfers')
    page.render()
    assert.equal(page.requests[1].query, 'transfers')
    assert.equal(page.settings().options.hasMore, false)
    assert.ok(!page.render().some(node => node.props.children === '余额旧记录'))
    page.requests[1].resolve({ items: [
        { id: 2, amount: '-10', tone: 'expense', content: '转出', createdAt: '2026-10-10 14:00:00', transfer: { address: '0x529...9EE7', fee: '0.5' } },
        { id: 3, amount: '+100', tone: 'income', content: '转入', createdAt: '2026-10-10 13:00:00', transfer: { address: '0xf39...2266', fee: '0' } },
        { id: 4, amount: '+1', tone: 'income', content: '转入', createdAt: '2026-10-10 12:00:00', transfer: { address: '', fee: '0' } },
    ], hasMore: true })
    await flush()
    const nodes = page.render()
    assert.ok(nodes.some(node => node.type === 'h3' && node.props.children === '转出给 0x529...9EE7'))
    assert.ok(nodes.some(node => node.type === 'h3' && node.props.children === '由 0xf39...2266 转入'))
    assert.ok(nodes.some(node => node.type === 'h3' && node.props.children === '由 -- 转入'))
    assert.ok(nodes.some(node => node.props.children === '-10 宝气'))
    assert.ok(nodes.some(node => node.props.children === '手续费：0.5 宝气'))
    const more = page.more()
    assert.equal(page.requests[2].query, 'transfers')
    assert.equal(page.requests[2].page, 2)
    tabs.props.onChange('baoqi')
    page.requests[2].resolve({ items: [{ id: 3, content: '过期转账' }], hasMore: false })
    await more
    page.requests[3].resolve({ items: [], hasMore: false })
    await flush()
    assert.ok(!page.render().some(node => node.props.children === '过期转账'))
    assert.ok(page.render().some(node => node.type === 'empty'))
    page.cleanup()
})
