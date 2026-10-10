import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime } from './helpers/yuanbao-runtime.mjs'
const order = (changes = {}) => ({ id: 5, product_id: 1, side: 1, status: 0, amount: '9007199254740993.123456', pay_usdt: '100.000001', pay_bao: '2.000001', created_at: '2026-10-10 10:30:00', product, ...changes })
const product = { id: 1, name: '远端卡名', image: '/products/remote.png', price: '100', purch_usdt: '10', purch_bao: '1', gift_energy: '1' }

test('card orders uses authenticated GET with documented side/status/pagination and preserves amount strings', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async (config) => { calls.push(config); return { orders: [order()] } } } })('src/features/orders/api.ts')
    const signal = new AbortController().signal
    const rows = await api.getCardOrders(1, 0, 2, signal)
    assert.equal(calls[0].url, '/api/orders')
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].signal, signal)
    assert.deepEqual({ ...calls[0].params }, { side: 1, status: 0, page_no: 2, page_size: 20 })
    assert.equal(rows[0].amount, order().amount)
    assert.equal(api.parseCardOrders({ orders: [] }).length, 0)
    for (const value of [{}, [], { orders: [order({ side: 0 })] }, { orders: [order({ status: 3 })] }, { orders: [order({ pay_usdt: 100 })] }, { orders: [order({ product: undefined })] }, { orders: [order({ product: { id: 1, name: 'x' } })] }]) assert.throws(() => api.parseCardOrders(value))
})

test('card pack maps every side and status, actual amounts, product metadata and full-page continuation', async () => {
    let rows = [order()]
    const calls = []
    const load = runtime({ '@/services/http/index.ts': { request: async (config) => {
        calls.push(config)
        assert.equal(config.url, '/api/orders')
        return { orders: rows }
    } } })
    const { loadCardPackPage } = load('src/pages/main/card-pack/service.ts')
    const signal = new AbortController().signal
    for (const [status, numeric] of [['pending', 0], ['won', 1], ['lost', 2]]) {
        for (const [orderType, side] of [['outgoing', 1], ['incoming', 2]]) {
            rows = [order({ side, status: numeric })]
            const result = await loadCardPackPage({ orderType, status }, 1, signal)
            const request = calls.filter((call) => call.url === '/api/orders').at(-1)
            assert.equal(request.params.side, side)
            assert.equal(request.params.status, numeric)
            assert.equal(request.signal, signal)
            const item = result.items[0]
            assert.equal(item.principal, side === 1 ? order().amount : '100.000001+2.000001')
            assert.equal(item.principalLabel, side === 1 ? '本金(元气）' : '本金(余额+宝气）')
            assert.equal(item.name, product.name)
            assert.equal(item.image, product.image)
            assert.equal(item.color, 'red')
            assert.equal(item.purchasedAt, '2026.10.10 10:30:00')
            assert.equal(result.hasMore, false)
        }
    }
    rows = Array.from({ length: 20 }, (_, index) => order({ id: index + 1 }))
    assert.equal((await loadCardPackPage({ orderType: 'outgoing', status: 'pending' }, 1)).hasMore, true)
    rows = []
    assert.equal((await loadCardPackPage({ orderType: 'outgoing', status: 'pending' }, 2)).hasMore, false)
    rows = [order({ product_id: 77, product: null })]
    const missingProduct = (await loadCardPackPage({ orderType: 'outgoing', status: 'pending' }, 1)).items[0]
    assert.equal(missingProduct.name, '#77')
    assert.equal(missingProduct.image, undefined)
})

test('home card pack only sends pagination, never side or status', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async config => { calls.push(config); return { orders: [order()] } } } })('src/features/orders/api.ts')
    const signal = new AbortController().signal
    const rows = await api.getHomeCardOrders(1, signal)
    assert.equal(calls[0].url, '/api/orders')
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].signal, signal)
    assert.deepEqual({ ...calls[0].params }, { page_no: 1, page_size: 20 })
    assert.equal(Object.hasOwn(calls[0].params, 'side'), false)
    assert.equal(Object.hasOwn(calls[0].params, 'status'), false)
    assert.equal(rows[0].product.name, product.name)
    await api.getHomeCardOrders(2)
    assert.equal(calls[1].params.page_no, 2)
})
