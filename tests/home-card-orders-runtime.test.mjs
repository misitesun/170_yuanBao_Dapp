import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'
test('home orders hook requests page one, supports retry and cancels obsolete IO', async () => {
    const states = [], requests = []
    let cursor = 0, effect
    const hook = runtime({ react: {
        useState: initial => { const slot = cursor++; if (!(slot in states)) states[slot] = initial;
            return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }] },
        useEffect: fn => { effect = fn },
    }, '@/features/orders/api.ts': { getHomeCardOrders: (page, signal) => {
        const pending = deferred(); requests.push({ page, signal, ...pending }); return pending.promise
    } } })('src/pages/main/home/useHomeCardOrders.ts')
    const render = () => { cursor = 0; return hook.useHomeCardOrders() }
    assert.equal(render().loading, true)
    let cleanup = effect()
    assert.equal(requests[0].page, 1)
    requests[0].reject(new Error('offline'))
    await new Promise(setImmediate)
    assert.equal(render().failed, true)
    render().retry()
    cleanup()
    render()
    cleanup = effect()
    requests[1].resolve([{ id: 1 }])
    await new Promise(setImmediate)
    assert.equal(render().orders.length, 1)
    assert.equal(render().loading, false)
    cleanup()
    render().retry()
    render()
    cleanup = effect()
    cleanup()
    assert.equal(requests[2].signal.aborted, true)
    requests[2].resolve([{ id: 2 }])
    await new Promise(setImmediate)
    assert.equal(render().orders.length, 0)
})
