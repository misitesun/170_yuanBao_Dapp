import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

import { createCardPackPagination } from '../src/pages/main/card-pack/pagination.ts'

// Run actual page callbacks and pagination; replace React rendering and IO boundaries.
function mountPage() {
    const states = [], effects = [], requests = []
    let cursor = 0, refresh, more, options, refreshEnabled
    const jsx = (type, props) => ({ type, props })
    const load = (query, page) => new Promise((resolve, reject) => requests.push({ query, page, resolve, reject }))
    const modules = {
        'react-i18next': i18nRuntime,
        react: {
            useCallback: (fn) => fn,
            useState: (init) => { const slot = cursor++; if (!(slot in states)) states[slot] = init(); return [states[slot]] },
            useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
            useEffect: (effect) => { if (effects.length === 0) effects.push(effect) },
        },
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        './pagination.ts': { createCardPackPagination },
        './service.ts': { loadCardPackPreviewPage: load },
        '@/components/PagePullRefresh': {
            PagePullRefresh: 'refresh-wrapper',
            usePageRefresh: (fn, enabled) => { refresh = fn; refreshEnabled = enabled },
            usePageLoadMore: (fn, settings) => { more = fn; options = settings },
        },
        '@/components/SegmentedTabs': { SegmentedTabs: 'tabs' },
        '@/components/DropletLoading': { DropletLoading: 'loading' },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: () => {} }) },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/card-pack/CardPackPage.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    runInNewContext(outputText, {
        exports,
        require: (name) => {
            if (name.startsWith('@/assets/')) return { __esModule: true, default: name }
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
            if (typeof node.type === 'function') { walk(node.type(node.props)); return }
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(exports.CardPackPage())
        return nodes
    }
    render()
    const cleanup = effects[0]()
    return {
        requests, render, cleanup,
        tabs: (label) => render().find((node) => node.type === 'tabs' && node.props.ariaLabel === label).props,
        settings: () => { render(); return { options, refreshEnabled } },
        refresh: () => refresh(), more: () => more(),
    }
}

const release = {
    kind: 'release', id: 'release-one', principal: '109+1', wonAt: '2026.02.24 12:28',
    totalUsdtIncome: '286.00', totalBaoqiIncome: '46.00', todayUsdtIncome: '6.124875', todayBaoqiIncome: '1.293846', period: '20/180',
}
const flush = () => new Promise(setImmediate)

test('cross-mode page callbacks use valid status defaults and discard previous-mode data', async () => {
    const page = mountPage()
    page.requests[0].resolve({ items: [], hasMore: false })
    await flush()
    page.tabs('开奖状态').onChange('won')
    page.tabs('订单类型').onChange('released')
    assert.deepEqual({ ...page.requests[2].query }, { orderType: 'released', status: 'ongoing' })
    assert.equal(page.settings().options.enabled, false)
    assert.equal(page.settings().options.hasMore, false)
    await page.more()
    assert.equal(page.requests.length, 3)
    page.requests[1].resolve({ items: [{ kind: 'card', id: 'stale' }], hasMore: true })
    await flush()
    assert.equal(page.settings().options.hasMore, false)
    page.requests[2].resolve({ items: [release], hasMore: true })
    await flush()
    const nodes = page.render()
    assert.deepEqual(nodes.filter((node) => node.type === 'dd').map((node) => node.props.children), ['286.00', '46.00', '6.124875', '1.293846', '20/180'])
    assert.ok(nodes.some((node) => node.type === 'p' && typeof node.props.children === 'string' && node.props.children.startsWith('中奖时间：')))
    assert.ok(!nodes.some((node) => node.type === 'h2'))
    assert.equal(nodes.filter((node) => node.type === 'img' && node.props.src?.includes('/token-')).length, 2)
    assert.deepEqual(Array.from(page.tabs('释放状态').items, (item) => item.value), ['ongoing', 'completed'])

    page.tabs('释放状态').onChange('completed')
    page.tabs('订单类型').onChange('released')
    assert.equal(page.requests.length, 4, 'clicking the selected order type must not reset its status')
    assert.equal(page.requests[3].query.status, 'completed')
    page.requests[3].resolve({ items: [], hasMore: false })
    await flush()
    assert.ok(page.render().some((node) => node.type === 'empty'))
    assert.equal(page.settings().options.showNoMore, false)
    page.tabs('订单类型').onChange('incoming')
    assert.deepEqual({ ...page.requests[4].query }, { orderType: 'incoming', status: 'pending' })
    page.requests[4].resolve({ items: [], hasMore: false })
    await flush()
    page.tabs('开奖状态').onChange('lost')
    page.tabs('订单类型').onChange('outgoing')
    assert.deepEqual({ ...page.requests[6].query }, { orderType: 'outgoing', status: 'lost' })
    page.requests[5].resolve({ items: [], hasMore: false })
    page.requests[6].resolve({ items: [], hasMore: false })
    await flush()
    page.cleanup()
})

test('release refresh awaits its active query reload and replaces the appended list', async () => {
    const page = mountPage()
    page.requests[0].resolve({ items: [], hasMore: false })
    await flush()
    page.tabs('订单类型').onChange('released')
    page.requests[1].resolve({ items: [release], hasMore: true })
    await flush()
    const append = page.more()
    assert.equal(page.settings().refreshEnabled, false)
    page.requests[2].resolve({ items: [{ ...release, id: 'release-two' }], hasMore: false })
    await append
    assert.equal(page.render().filter((node) => node.type === 'article').length, 2)
    let refreshed = false
    const refresh = page.refresh().then(() => { refreshed = true })
    assert.equal(page.settings().options.enabled, false)
    assert.equal(page.settings().options.hasMore, false)
    assert.deepEqual({ ...page.requests[3].query }, { orderType: 'released', status: 'ongoing' })
    await Promise.resolve()
    assert.equal(refreshed, false)
    page.requests[3].resolve({ items: [release], hasMore: true })
    await refresh
    assert.equal(page.render().filter((node) => node.type === 'article').length, 1)
    assert.equal(page.settings().options.loadingIndicator, 'droplet')
    assert.equal(page.settings().refreshEnabled, true)
    page.cleanup()
})
