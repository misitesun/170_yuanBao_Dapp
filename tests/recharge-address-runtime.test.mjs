import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred, ADDRESS } from './helpers/yuanbao-runtime.mjs'

test('recharge address uses authenticated GET without chain params, preserves address and rejects unusable responses', async () => {
    const calls = []
    const api = runtime({ '../../services/http/index.ts': { request: async config => { calls.push(config); return { recharge_address: ADDRESS } } } })('src/features/user/api.ts')
    const signal = new AbortController().signal
    assert.equal(await api.getRechargeAddress(signal), ADDRESS)
    assert.equal(calls[0].url, '/api/users/my/recharge_address')
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].params, undefined)
    assert.equal(calls[0].signal, signal)
    for (const value of [{}, [], { recharge_address: null }, { recharge_address: 123 }, { recharge_address: '0xabc' }, { data: { recharge_address: ADDRESS } }]) assert.throws(() => api.parseRechargeAddress(value))
    const failing = runtime({ '../../services/http/index.ts': { request: async () => { throw new Error('400') } } })('src/features/user/api.ts')
    await assert.rejects(failing.getRechargeAddress(), /400/)
})

test('recharge loading supports failure retry and cancels late responses without exposing an old address', async () => {
    const slots = [], requests = []
    let cursor = 0, effect
    const { useRechargeAddress: renderHook } = runtime({
        react: {
            useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }] },
            useEffect: fn => { effect = fn },
        },
        '@/features/user/api.ts': { getRechargeAddress: signal => { const pending = deferred(); requests.push({ signal, ...pending }); return pending.promise } },
    })('src/pages/main/deposit/useRechargeAddress.ts')
    const render = () => { cursor = 0; return renderHook() }
    const flush = () => new Promise(setImmediate)
    assert.equal(render().loading, true)
    const cleanup = effect()
    requests[0].reject(new Error('400'))
    await flush()
    assert.equal(render().failed, true)
    assert.equal(render().address, null)
    render().retry()
    cleanup()
    render()
    const cleanupRetry = effect()
    assert.equal(render().loading, true)
    requests[1].resolve(ADDRESS)
    await flush()
    assert.equal(render().address, ADDRESS)
    assert.equal(render().failed, false)
    assert.equal(render().loading, false)
    cleanupRetry()
    render().retry()
    render()
    const cleanupLeaving = effect()
    assert.equal(render().address, null)
    cleanupLeaving()
    assert.equal(requests[2].signal.aborted, true)
    requests[2].resolve(ADDRESS)
    await flush()
    assert.equal(render().address, null)
})
