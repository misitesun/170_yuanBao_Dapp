import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'
import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function mountHome(pack = { orders: [], loading: false, failed: false, retry: () => {} }) {
    const states = [], feedback = [], routes = [], purchases = [], refreshes = []
    let cursor = 0, reported = false
    const jsx = (type, props) => ({ type, props })
    const products = ['A', 'B', 'C'].map((name, index) => ({ id: index + 10, name: `后端${name}`, image: `/products/${index}.png`, price: `${index + 1}.123456` }))
    let activityConfig = { enabled: true, canSell: true, canBuy: false, sellStart: '10:00', sellEnd: '15:00', buyStart: '16:00', buyEnd: '17:00' }
    const modules = {
        '@/features/orders/useOrderConfig.ts': { useOrderConfig: () => ({ config: activityConfig, failed: false, retry: () => {} }) },
        '@/features/orders/api.ts': {
            ...runtime({ '@/services/http/index.ts': {} })('src/features/orders/api.ts'),
            buyCard: (id) => { const pending = deferred(); purchases.push({ id, ...pending }); return pending.promise },
        },
        '@/features/auth/session.ts': { refreshCurrentUser: () => { const pending = deferred(); refreshes.push(pending); return pending.promise } },
        '@/services/http/index.ts': { wasHttpErrorReported: () => reported },
        './useHomeCardOrders.ts': { useHomeCardOrders: () => pack },
        '@/features/products/useProducts.ts': { useProducts: () => ({ products, loading: false, failed: false, retry: () => {} }) },
        '@/components/DropletLoading': { DropletLoading: 'loading' },
        '@/components/ContractLoading': { ContractLoading: 'loading-overlay' },
        '@/components/Popup': { Popup: 'popup' },
        '@/components/ActionButton': { ActionButton: 'action' },
        '@/router': { ROUTE_PATH: { auction: '/auction', cardPack: '/card-pack' }, useAppNavigate: () => ({ pushRoute: (path) => routes.push(path) }) },
        'react-i18next': i18nRuntime,
        react: {
            useState: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial
                return [states[slot], (value) => { states[slot] = value }]
            },
            useRef: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = { current: initial }
                return states[slot]
            },
            useEffect: () => {},
        },
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        'swiper/modules': { A11y: 'a11y', FreeMode: 'free-mode' },
        'swiper/react': { Swiper: 'swiper', SwiperSlide: 'slide' },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (...args) => feedback.push(args) }) },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/home/HomePage.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    runInNewContext(outputText, { exports, require: (name) => {
        if (name.startsWith('@/assets/')) return { default: name }
        if (name.endsWith('.scss') || name.startsWith('swiper/css')) return {}
        assert.ok(name in modules, `unexpected navigation or IO boundary: ${name}`)
        return modules[name]
    } })
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(exports.HomePage())
        return nodes
    }
    return {
        render, feedback, routes, purchases, refreshes, products,
        popup: () => render().find((node) => node.type === 'popup'),
        purchaseButton: () => render().find((node) => node.props.className === 'home-page__purchase flex-center'),
        confirm: () => render().find((node) => node.type === 'action' && node.props.children === '确认购买'),
        setConfig: (value) => { activityConfig = { ...activityConfig, ...value } },
        setReported: () => { reported = true },
    }
}
const flush = () => new Promise(setImmediate)

test('home navigation and carousel display remote data; inactive purchases show the participation message', () => {
    const page = mountHome()
    const initial = page.render()
    assert.equal(initial.filter((node) => node.type === 'empty').length, 1)
    assert.equal(initial.filter((node) => node.type === 'swiper').length, 1)
    for (const className of ['home-page__auction-button', 'home-page__pack-entry']) {
        page.render().find((node) => node.type === 'button' && node.props.className.includes(className)).props.onClick()
    }
    assert.deepEqual(page.routes, ['/auction', '/card-pack'])
    for (const [index, item] of page.products.entries()) {
        page.render().find((node) => node.type === 'swiper').props.onRealIndexChange({ realIndex: index })
        assert.equal(page.render().find((node) => node.type === 'h1').props.children, item.name)
        assert.equal(page.render().find((node) => node.props.className === 'home-page__amount').props.children, item.price)
    }
    page.setConfig({ canSell: false })
    page.purchaseButton().props.onClick()
    assert.equal(page.feedback.at(-1)[0], '当前不在买卡时间')
    assert.equal(page.popup().props.show, false)
    assert.equal(page.purchases.length, 0)
})

test('home requires confirmation, freezes the selected product, prevents duplicate writes and refreshes only after success', async () => {
    const page = mountHome()
    page.purchaseButton().props.onClick()
    assert.equal(page.popup().props.show, true)
    assert.equal(page.purchases.length, 0)
    page.popup().props.onClose()
    assert.equal(page.popup().props.show, false)
    page.purchaseButton().props.onClick()
    page.render().find((node) => node.type === 'swiper').props.onRealIndexChange({ realIndex: 2 })
    assert.ok(page.render().some((node) => node.type === 'p' && node.props.children === '后端A'))
    const confirm = page.confirm().props.onClick
    confirm()
    confirm()
    assert.equal(page.purchases.length, 1)
    assert.equal(page.purchases[0].id, 10)
    assert.equal(page.confirm().props.loading, true)
    assert.equal(page.render().find(node => node.type === 'loading-overlay').props.show, true)
    page.popup().props.onClose()
    assert.equal(page.popup().props.show, true)
    page.purchases[0].resolve()
    await flush()
    assert.equal(page.popup().props.show, false)
    assert.equal(page.refreshes.length, 1)
    assert.deepEqual(page.feedback[0], ['购买成功', 'success'])
    page.refreshes[0].reject(new Error('refresh failed'))
    await flush()
    assert.equal(page.feedback.at(-1)[0], '购买成功，余额刷新失败，请稍后重试')
    assert.ok(!page.feedback.some(([message]) => message === '购买失败，请重试'))
    assert.equal(page.purchaseButton().props.disabled, false)
})

test('failed purchases retain confirmation for retry and do not refresh; reported HTTP errors are not duplicated', async () => {
    const page = mountHome()
    page.purchaseButton().props.onClick()
    page.confirm().props.onClick()
    page.purchases[0].reject(new Error('failure'))
    await flush()
    assert.equal(page.popup().props.show, true)
    assert.equal(page.refreshes.length, 0)
    assert.deepEqual(page.feedback, [['购买失败，请重试', 'error']])
    page.setReported()
    page.confirm().props.onClick()
    page.purchases[1].reject(new Error('HTTP failure'))
    await flush()
    assert.equal(page.feedback.length, 1)
    assert.equal(page.confirm().props.loading, false)
    assert.equal(page.render().find(node => node.type === 'loading-overlay').props.show, false)
})


test('home pack renders actual product metadata, empty, loading and retry states', () => {
    const pack = { orders: [{ id: 1, productId: 8, product: { name: '订单卡名', image: '/order-image.png' } }, { id: 2, productId: 99, product: null }], loading: false, failed: false, retry: () => { retries++ } }
    let retries = 0
    const page = mountHome(pack)
    let nodes = page.render()
    assert.ok(nodes.some(node => node.type === 'img' && node.props.src === '/order-image.png'))
    assert.ok(nodes.some(node => node.props['aria-label'] === '订单卡名'))
    assert.ok(!nodes.some(node => node.type === 'span' && node.props.children === '订单卡名'))
    const carousel = nodes.find(node => node.type === 'swiper' && node.props.className === 'home-page__pack-cards')
    assert.equal(carousel.props.slidesPerView, 'auto')
    assert.equal(carousel.props.freeMode, true)
    assert.equal(carousel.props.grabCursor, true)
    assert.ok(carousel.props.modules.includes('free-mode'))
    assert.ok(nodes.some(node => node.props['aria-label'] === '#99'))
    nodes.find(node => node.props.className?.startsWith('home-page__pack-card home-page__pack-card--')).props.onClick()
    assert.deepEqual(page.routes, ['/card-pack'])
    pack.orders = []
    assert.ok(page.render().some(node => node.type === 'empty'))
    pack.loading = true
    assert.ok(!page.render().some(node => node.type === 'loading'))
    assert.ok(!page.render().some(node => node.type === 'empty'))
    pack.loading = false
    pack.failed = true
    nodes = page.render()
    assert.ok(nodes.some(node => node.props.children === '卡包加载失败'))
    nodes.find(node => node.type === 'button' && node.props.children === '重新加载').props.onClick()
    assert.equal(retries, 1)
})


test('unconfigured image URLs stay empty without src warnings or visible ID placeholders', () => {
    const page = mountHome({ orders: [{ id: 1, productId: 2, product: { name: '未配置图片', image: '' } }], loading: false, failed: false, retry: () => {} })
    page.products.forEach(product => { product.image = '' })
    const nodes = page.render()
    assert.ok(!nodes.some(node => node.type === 'img' && node.props.src === ''))
    assert.ok(!nodes.some(node => node.type === 'span' && String(node.props.children).startsWith('#')))
    const logo = nodes.find(node => node.type === 'button' && node.props['aria-label'] === '未配置图片')
    assert.equal(logo.props.children.type, 'img')
    assert.equal(logo.props.children.props.src, undefined)
})
