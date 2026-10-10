import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred, ADDRESS } from './helpers/yuanbao-runtime.mjs'
const config = (flag = '1') => ({ member_transfer_switch: flag, member_transfer_bao_min: '1.000001', member_transfer_bao_fee: '0.5' })
test('transfer config uses authenticated GET and only exact switch one enables transfers', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async value => { calls.push(value); return config() } } })('src/features/transfers/api.ts')
    const signal = new AbortController().signal
    const result = await api.getTransferConfig(signal)
    assert.equal(result.minimum, '1.000001')
    assert.equal(result.feePercent, '0.5')
    assert.equal(calls[0].url, '/api/transfers/config')
    assert.equal(calls[0].signal, signal)
    assert.equal(calls[0].authentication, undefined)
    for (const flag of ['', '0', '2']) assert.equal(api.parseTransferConfig(config(flag)).enabled, false)
    for (const value of [{}, [], config(null), { ...config(), member_transfer_bao_fee: 0 }, { ...config(), member_transfer_bao_min: '-1' }]) assert.throws(() => api.parseTransferConfig(value))
})
test('transfer submits only recipient and precise six-decimal string, ignoring unused successful bodies while failures reject', async () => {
    const calls = []
    let response
    const api = runtime({ '@/services/http/index.ts': { request: async value => { calls.push(value); return response } } })('src/features/transfers/api.ts')
    assert.equal(api.normalizeTransferAmount('9007199254740993.123456789'), '9007199254740993.123456')
    for (const invalid of ['', '0', '-1', '1e3', '0.0000001']) assert.equal(api.normalizeTransferAmount(invalid), null)
    for (response of [[], undefined, null, 'ok', { amount: false }]) {
        assert.equal(await api.submitTransfer(ADDRESS, '12.1234567'), undefined)
        assert.deepEqual({ ...calls.at(-1).data }, { to_address: ADDRESS, amount: '12.123456' })
        assert.equal(calls.at(-1).url, '/api/transfers')
        assert.equal(calls.at(-1).method, 'POST')
    }
    await assert.rejects(api.submitTransfer('invalid', '10'))
    const failed = runtime({ '@/services/http/index.ts': { request: async () => { throw new Error('HTTP 400') } } })('src/features/transfers/api.ts')
    await assert.rejects(failed.submitTransfer(ADDRESS, '10'), /HTTP 400/)
})
test('transfer config only loads on open and cancels requests on close or retry', async () => {
    const slots = [], requests = []
    let cursor = 0, effect
    const { useTransferConfig: renderHook } = runtime({
        react: {
            useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }] },
            useEffect: fn => { effect = fn },
        },
        '@/features/transfers/api.ts': { getTransferConfig: signal => { const pending = deferred(); requests.push({ signal, ...pending }); return pending.promise } },
    })('src/pages/main/assets/useTransferConfig.ts')
    const render = show => { cursor = 0; return renderHook(show) }
    render(false)
    assert.equal(effect(), undefined)
    assert.equal(requests.length, 0)
    render(true)
    const cleanup = effect()
    requests[0].reject(new Error('offline'))
    await new Promise(setImmediate)
    assert.equal(render(true).failed, true)
    render(true).retry()
    cleanup()
    render(true)
    const leaving = effect()
    leaving()
    assert.equal(requests[1].signal.aborted, true)
    render(false)
    effect()
    requests[1].resolve({ enabled: true })
    await new Promise(setImmediate)
    assert.equal(render(false).config, null)
})

test('transfer records request both directions using pagination only and strictly preserve wire fields', async () => {
    const rows = [{ id: 21, ccy: 'balance_bao', amount: '9007199254740993.123456', fee: '0.123456', type: 1, address: '0x529...9EE7', created_at: '2026-10-10 14:00:00' },
        { id: 20, ccy: 'balance_bao', amount: '10', fee: '0', type: 2, address: '', created_at: '2026-10-10 13:00:00' }]
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async call => { calls.push(call); return { transfers: rows } } } })('src/features/transfers/api.ts')
    const signal = new AbortController().signal
    const records = await api.getTransferRecords(2, signal)
    assert.equal(calls[0].url, '/api/transfers')
    assert.deepEqual({ ...calls[0].params }, { page_no: 2, page_size: 20 })
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].signal, signal)
    assert.equal(records[0].amount, rows[0].amount)
    assert.equal(records[0].fee, rows[0].fee)
    assert.equal(records[1].type, 2)
    assert.equal(records[1].address, '')
    assert.equal(api.parseTransferRecords({ transfers: [] }).length, 0)
    for (const value of [null, [], {}, { transfers: null }]) assert.throws(() => api.parseTransferRecords(value))
    for (const field of Object.keys(rows[0])) {
        const missing = { ...rows[0] }; delete missing[field]
        assert.throws(() => api.parseTransferRecords({ transfers: [missing] }), field)
    }
    for (const change of [{ type: 0 }, { type: '1' }, { ccy: 'balance_usdt' }, { amount: 10 }, { fee: null }, { amount: '-1' }, { fee: '-1' }, { address: null }, { created_at: 'invalid' }]) {
        assert.throws(() => api.parseTransferRecords({ transfers: [{ ...rows[0], ...change }] }))
    }
    await assert.rejects(api.getTransferRecords(0))
})
