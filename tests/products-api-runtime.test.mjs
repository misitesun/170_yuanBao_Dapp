import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

const product = (changes = {}) => ({ id: 8, name: '后端商品', image: '/products/8.png', price: '9007199254740993.123456', purch_usdt: '10.001000', purch_bao: '5', gift_energy: '1', stock: 2, ...changes })

test('products uses the public endpoint, forwards cancellation and preserves remote values and ordering', async () => {
    const calls = []
    const load = runtime({ '@/services/http/index.ts': { request: async (config) => {
        calls.push(config)
        return { products: [product(), product({ id: 2, name: '第二张' })] }
    } } })
    const api = load('src/features/products/api.ts')
    const signal = new AbortController().signal
    const items = await api.getProducts(signal)
    assert.equal(calls[0].url, '/api/products')
    assert.equal(calls[0].authentication, 'none')
    assert.equal(calls[0].signal, signal)
    assert.deepEqual(Array.from(items, (item) => item.id), [8, 2])
    assert.equal(items[0].price, product().price)
    assert.equal(items[0].image, '/products/8.png')
    assert.equal(items[0].purchUsdt, '10.001000')
    assert.equal(items[0].purchBao, '5')
    assert.equal(items[0].giftEnergy, '1')
    assert.equal(items[0].stock, 2)
    assert.equal(api.parseProducts({ products: [product({ stock: -1 })] })[0].stock, -1)
    assert.equal(api.parseProducts({ products: [] }).length, 0)
    for (const bad of [[], {}, { data: { products: [] } }, { products: [product({ price: 100 })] }, { products: [product({ image: null })] }, { products: [product({ stock: '2' })] }, { products: [product({ stock: undefined })] }]) {
        assert.throws(() => api.parseProducts(bad))
    }
})

function mountProducts() {
    const states = [], requests = []
    let cursor = 0, effect
    const load = runtime({ react: {
        useState: (initial) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = initial
            return [states[slot], (value) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }]
        },
        useEffect: (fn) => { effect = fn },
    }, './api.ts': { getProducts: (signal) => {
        const pending = deferred()
        requests.push({ signal, ...pending })
        return pending.promise
    } } })
    const { useProducts: renderProductsHook } = load('src/features/products/useProducts.ts')
    return { requests, render: () => { cursor = 0; return renderProductsHook() }, start: () => effect() }
}
const flush = () => new Promise(setImmediate)

test('products loading, failure, retry, empty success and cleanup discard late results', async () => {
    const page = mountProducts()
    assert.equal(page.render().loading, true)
    const cleanup = page.start()
    page.requests[0].reject(new Error('network'))
    await flush()
    assert.equal(page.render().failed, true)
    assert.equal(page.render().loading, false)
    page.render().retry()
    cleanup()
    page.render()
    const cleanupRetry = page.start()
    assert.equal(page.render().loading, true)
    assert.equal(page.render().failed, false)
    page.requests[1].resolve([])
    await flush()
    assert.equal(page.render().products.length, 0)
    assert.equal(page.render().failed, false)
    assert.equal(page.render().loading, false)
    cleanupRetry()
    page.render()
    const cleanupLate = page.start()
    cleanupLate()
    assert.equal(page.requests[2].signal.aborted, true)
    page.requests[2].resolve([{ id: 99 }])
    await flush()
    assert.equal(page.render().products.length, 0)
})

test('auction renders remote cards and rejects empty stock or unavailable participation', () => {
    const feedback = []
    const jsx = (type, props) => ({ type, props })
    let data = { products: [{ stock: 0, id: 42, name: '接口原文名称', image: '/products/42.png', purchUsdt: '123.456789', purchBao: '0.000001' }], loading: false, failed: false }
    let activityConfig = { enabled: true, canSell: false, canBuy: true, sellStart: '10:00', sellEnd: '15:00', buyStart: '16:00', buyEnd: '17:00' }
    const load = runtime({
        react: { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }), useEffect: () => {} },
        '@/features/auth/session.ts': { refreshCurrentUser: async () => {} },
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        '@/features/orders/useOrderConfig.ts': { useOrderConfig: () => ({ config: activityConfig, failed: false }) },
        '@/features/orders/api.ts': runtime({ '@/services/http/index.ts': {} })('src/features/orders/api.ts'),
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/features/products/useProducts.ts': { useProducts: () => data },
        '@/assets/common/participation-clock.png': {}, '@/assets/auction/price-coins.png': {},
        '@/components/ContractLoading': { ContractLoading: 'loading-overlay' },
        '@/components/Popup': { Popup: 'popup' }, '@/components/ActionButton': { ActionButton: 'action' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
        '@/components/Empty': { Empty: 'empty' }, '@/components/DropletLoading': { DropletLoading: 'loading' },
    })
    const { AuctionPage } = load('src/pages/main/auction/AuctionPage.tsx')
    function render() {
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(AuctionPage())
        return nodes
    }
    const nodes = render()
    assert.equal(nodes.find((node) => node.type === 'h2').props.children, '接口原文名称')
    assert.equal(nodes.find((node) => node.props.className === 'auction-page__card-image').props.src, '/products/42.png')
    assert.ok(nodes.some((node) => node.type === 'span' && Array.isArray(node.props.children) && node.props.children.join('') === '123.456789余额+0.000001宝气'))
    nodes.find((node) => node.type === 'button').props.onClick()
    assert.deepEqual(feedback, ['该产品已抢购完'])
    data.products[0].stock = 1
    activityConfig = { ...activityConfig, canBuy: false }
    assert.ok(render().some((node) => node.type === 'p' && node.props.children === '当前不在抢拍时间'))
    render().find((node) => node.props.className === 'auction-page__bid flex-center').props.onClick()
    assert.equal(feedback.at(-1), '当前不在抢拍时间')
    // Deliberately reorder the products: background must follow ID, not list position or image name.
    data = { products: [3, 1, 2, 42].map((id) => ({ id, name: `商品${id}`, image: `/remote/custom-${id}.png`, purchUsdt: '1', purchBao: '2' })), loading: false, failed: false }
    const mapped = render()
    assert.deepEqual(mapped.filter((node) => node.type === 'article').map((node) => node.props.className), [
        'auction-page__card auction-page__card--green',
        'auction-page__card auction-page__card--red',
        'auction-page__card auction-page__card--blue',
        'auction-page__card auction-page__card--blue',
    ])
    assert.deepEqual(mapped.filter((node) => node.props.className === 'auction-page__card-image').map((node) => node.props.src),
        [3, 1, 2, 42].map((id) => `/remote/custom-${id}.png`))
    data = { products: [], loading: false, failed: false }
    assert.ok(render().some((node) => node.type === 'empty'))
    data = { products: [], loading: true, failed: false }
    assert.ok(!render().some((node) => node.type === 'loading'))
    let retries = 0
    data = { products: [], loading: false, failed: true, retry: () => retries++ }
    render().find((node) => node.type === 'button').props.onClick()
    assert.equal(retries, 1)
})

test('auction submits one card once and distinguishes mutation failure from post-success refresh failure', async () => {
    const slots = [], calls = [], feedback = []
    let cursor = 0, productRetries = 0, configRetries = 0, failRefresh = false
    const jsx = (type, props) => ({ type, props })
    const config = { enabled: true, canBuy: true, canSell: true, buyStart: '10:00', buyEnd: '17:00' }
    const orderApi = runtime({ '@/services/http/index.ts': {} })('src/features/orders/api.ts')
    const { AuctionPage } = runtime({
        react: {
            useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] },
            useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
            useEffect: () => {},
        },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/features/orders/api.ts': { ...orderApi, bidCard: id => { const pending = deferred(); calls.push({ id, ...pending }); return pending.promise } },
        '@/features/orders/useOrderConfig.ts': { useOrderConfig: () => ({ config, failed: false, retry: () => { configRetries++ } }) },
        '@/features/products/useProducts.ts': { useProducts: () => ({ products: [{ id: 2, name: '接口卡', image: '/2.png', stock: 1, purchUsdt: '100', purchBao: '1' }], loading: false, failed: false, retry: () => { productRetries++ } }) },
        '@/features/auth/session.ts': { refreshCurrentUser: async () => { if (failRefresh) throw new Error('refresh failed') } },
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        '@/assets/common/participation-clock.png': {}, '@/assets/auction/price-coins.png': {},
        '@/components/ContractLoading': { ContractLoading: 'loading-overlay' },
        '@/components/Popup': { Popup: 'popup' }, '@/components/ActionButton': { ActionButton: 'action' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: text => feedback.push(text) }) },
        '@/components/Empty': { Empty: 'empty' }, '@/components/DropletLoading': { DropletLoading: 'loading' },
    })('src/pages/main/auction/AuctionPage.tsx')
    function nodes(node) { return !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] }
    const button = () => { cursor = 0; return nodes(AuctionPage()).find(node => node.props.className === 'auction-page__bid flex-center') }
    const all = () => { cursor = 0; return nodes(AuctionPage()) }
    const popup = () => all().find(node => node.type === 'popup')
    const confirm = () => all().find(node => node.type === 'action' && node.props.children === '确认抢拍')
    button().props.onClick()
    assert.equal(calls.length, 0)
    assert.equal(popup().props.show, true)
    assert.ok(all().some(node => node.props.children === '将扣除 100 余额 + 1 宝气'))
    all().find(node => node.type === 'action' && node.props.children === '取消').props.onClick()
    assert.equal(popup().props.show, false)
    assert.equal(calls.length, 0)
    button().props.onClick()
    const firstClick = confirm().props.onClick
    firstClick()
    firstClick()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].id, 2)
    assert.equal(button().props.disabled, true)
    assert.equal(all().find(node => node.type === 'loading-overlay').props.show, true)
    assert.equal(confirm().props.children, '确认抢拍')
    popup().props.onClose()
    assert.equal(popup().props.show, true)
    calls[0].reject(new Error('insufficient funds'))
    await new Promise(setImmediate)
    assert.equal(feedback.at(-1), '抢拍失败，请重试')
    assert.equal(productRetries, 0)
    assert.equal(button().props.disabled, false)
    assert.equal(all().find(node => node.type === 'loading-overlay').props.show, false)
    assert.equal(popup().props.show, true)
    failRefresh = true
    confirm().props.onClick()
    calls[1].resolve()
    await new Promise(setImmediate)
    assert.equal(productRetries, 1)
    assert.equal(configRetries, 1)
    assert.equal(popup().props.show, false)
    assert.ok(feedback.includes('抢拍成功'))
    assert.equal(feedback.at(-1), '抢拍成功，余额刷新失败')
    assert.equal(button().props.disabled, false)
    assert.equal(all().find(node => node.type === 'loading-overlay').props.show, false)
})
