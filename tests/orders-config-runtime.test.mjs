import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'
const wire = (changes = {}) => ({ data: { enabled: '1', can_sell: true, can_buy: false, sell_start: '10:00', sell_end: '15:00', buy_start: '16:00', buy_end: '17:00', ...changes } })

test('order config reads the public data envelope and rejects invalid fields without default times', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async (config) => { calls.push(config); return wire() } } })('src/features/orders/api.ts')
    const signal = new AbortController().signal
    const config = await api.getOrderConfig(signal)
    assert.equal(calls[0].url, '/api/orders/config')
    assert.equal(calls[0].authentication, 'none')
    assert.equal(calls[0].signal, signal)
    assert.equal(config.sellStart, '10:00')
    assert.equal(config.buyStart, '16:00')
    for (const value of [{}, wire({ can_sell: 'true' }), wire({ enabled: true }), wire({ can_buy: null }), wire({ buy_end: '25:00' }), wire({ sell_start: null })]) assert.throws(() => api.parseOrderConfig(value))
})

test('participation uses raw switch and independent server permissions without a phase or device clock', () => {
    const api = runtime({ '@/services/http/index.ts': {} })('src/features/orders/api.ts')
    const message = (changes, side) => api.getParticipationMessage(api.parseOrderConfig(wire(changes)), side)
    assert.equal(api.getParticipationMessage(null, 'sell'), '活动配置加载中')
    for (const enabled of ['', '0', 'OFF', 'False']) assert.equal(message({ enabled }, 'sell'), '元宝卡暂未开启')
    assert.equal(message({ can_sell: false }, 'sell'), '当前不在买卡时间')
    assert.equal(message({ can_sell: true, can_buy: true }, 'sell'), null)
    assert.equal(message({ can_sell: true, can_buy: true }, 'buy'), null)
    assert.equal(message({ can_buy: false }, 'buy'), '当前不在抢拍时间')
})

test('config hook supports failed retry and aborts obsolete requests without late writes', async () => {
    const states = [], requests = []
    let cursor = 0, effect
    const { useOrderConfig: renderHook } = runtime({ react: {
        useState: (initial) => { const slot = cursor++; if (!(slot in states)) states[slot] = initial; return [states[slot], (value) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }] },
        useEffect: (fn) => { effect = fn },
    }, './api.ts': { getOrderConfig: (signal) => { const pending = deferred(); requests.push({ signal, ...pending }); return pending.promise } } })('src/features/orders/useOrderConfig.ts')
    const render = () => { cursor = 0; return renderHook() }
    assert.equal(render().config, null)
    const cleanup = effect()
    requests[0].reject(new Error('network'))
    await new Promise(setImmediate)
    assert.equal(render().failed, true)
    render().retry()
    cleanup()
    render()
    const cleanupRetry = effect()
    assert.equal(render().failed, false)
    requests[1].resolve({ canBuy: true })
    await new Promise(setImmediate)
    assert.equal(render().config.canBuy, true)
    cleanupRetry()
    render()
    const cleanupLate = effect()
    cleanupLate()
    requests[2].resolve({ canSell: true })
    await new Promise(setImmediate)
    assert.equal(requests[2].signal.aborted, true)
    assert.equal(render().config, null)
})


test('buyCard sends only product_id and ignores every unused successful response body while HTTP failures reject', async () => {
    let response, failure
    const calls = []
    const { buyCard } = runtime({ '@/services/http/index.ts': { request: async (config) => {
        calls.push(config)
        if (failure) throw failure
        return response
    } } })('src/features/orders/api.ts')
    for (const value of [[], null, undefined, '', { incompatible: true }]) {
        response = value
        assert.equal(await buyCard(3), undefined)
        assert.equal(calls.at(-1).url, '/api/orders/sell')
        assert.equal(calls.at(-1).method, 'POST')
        assert.deepEqual(Object.keys(calls.at(-1).data), ['product_id'])
        assert.equal(calls.at(-1).data.product_id, 3)
        assert.equal(calls.at(-1).authentication, undefined)
    }
    failure = new Error('余额不足')
    await assert.rejects(buyCard(3), /余额不足/)
    const count = calls.length
    await assert.rejects(buyCard(0))
    assert.equal(calls.length, count)
})

test('bidCard submits one product without quantity and ignores unused success bodies', async () => {
    const calls = []
    let response
    const api = runtime({ '@/services/http/index.ts': { request: async config => { calls.push(config); return response } } })('src/features/orders/api.ts')
    for (response of [[], null, undefined, 'ok', { invalid: true }]) {
        assert.equal(await api.bidCard(2), undefined)
        assert.equal(calls.at(-1).url, '/api/orders/buy')
        assert.equal(calls.at(-1).method, 'POST')
        assert.deepEqual({ ...calls.at(-1).data }, { product_id: 2 })
    }
    const failed = runtime({ '@/services/http/index.ts': { request: async () => { throw new Error('HTTP 400') } } })('src/features/orders/api.ts')
    await assert.rejects(failed.bidCard(2), /HTTP 400/)
})
