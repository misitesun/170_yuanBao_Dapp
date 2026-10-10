import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

const recharge = (changes = {}) => ({ id: 2, created_at: '2026-10-10 15:33:58', amount: '9007199254740993.123456', ccy: 'balance_usdt', from: '0x52908400098527886E0F7030069857D2E4169EE7', tx_id: `0x${'1'.repeat(64)}`, ...changes })
const claim = (changes = {}) => ({ id: 8, created_at: '2026-10-10 15:05:13', tamount: '100', amount: '99.123456', fee: '0.876544', ccy: 'balance_usdt', status: 1, ...changes })

test('records use authenticated GETs, documented envelopes, pagination and unchanged amounts', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async config => {
        calls.push(config)
        return config.url === '/api/recharges' ? { recharges: [recharge()] } : { withdraws: [claim({ status: config.params.status })] }
    } } })('src/features/funds-records/api.ts')
    const signal = new AbortController().signal
    const rows = await api.getRechargeRecords(2, signal)
    assert.equal(rows[0].id, 2)
    assert.equal(rows[0].createdAt, '2026-10-10 15:33:58')
    assert.equal(rows[0].amount, recharge().amount)
    assert.equal(rows[0].from, recharge().from)
    assert.equal(rows[0].txId, recharge().tx_id)
    assert.deepEqual({ ...calls[0].params }, { page_no: 2, page_size: 20 })
    for (const status of [1, 2, 3]) {
        const result = await api.getClaimRecords(status, 1, signal)
        assert.equal(result[0].id, 8)
        assert.equal(result[0].createdAt, '2026-10-10 15:05:13')
        assert.equal(result[0].requestedAmount, '100')
        assert.equal(result[0].amount, '99.123456')
        assert.equal(result[0].fee, '0.876544')
        assert.equal(result[0].status, status)
        assert.deepEqual({ ...calls.at(-1).params }, { status, page_no: 1, page_size: 20 })
    }
    assert.ok(calls.every(c => c.method === 'GET' && c.authentication === undefined && c.signal === signal))
    assert.equal(calls[0].url, '/api/recharges')
    assert.ok(calls.slice(1).every(c => c.url === '/api/claims'))
    const count = calls.length
    await assert.rejects(api.getClaimRecords(0, 1))
    await assert.rejects(api.getRechargeRecords(0))
    assert.equal(calls.length, count)
})

test('known fields are validated, empty arrays are valid, unknown fields do not establish a contract', () => {
    const api = runtime({ '@/services/http/index.ts': {} })('src/features/funds-records/api.ts')
    assert.equal(api.parseRechargeRecords({ recharges: [] }).length, 0)
    assert.equal(api.parseClaimRecords({ withdraws: [] }).length, 0)
    assert.equal(api.parseClaimRecords({ withdraws: [claim({ status: 2, address: null, reason: 123 })] })[0].status, 2)
    for (const value of [{ recharges: [recharge({ id: undefined })] }, { recharges: [recharge({ id: '2' })] },
        { recharges: [recharge({ id: null })] }, { recharges: [recharge({ created_at: null })] },
        { recharges: [recharge({ created_at: '2026-10-10T15:33:58' })] }, {}, { recharges: null }, { recharges: [recharge({ amount: 1 })] },
        { recharges: [recharge({ ccy: 'other' })] }, { recharges: [recharge({ from: null })] },
        { recharges: [recharge({ tx_id: undefined })] }]) assert.throws(() => api.parseRechargeRecords(value))
    for (const value of [{ withdraws: [claim({ id: null })] }, { withdraws: [claim({ id: '8' })] },
        { withdraws: [claim({ created_at: undefined })] }, { withdraws: [claim({ created_at: 123 })] },
        { withdraws: [claim({ status: '1' })] }, { withdraws: [claim({ status: null })] }, { claims: [] }, { withdraws: null }, { withdraws: [claim({ tamount: null })] },
        { withdraws: [claim({ amount: 1 })] }, { withdraws: [claim({ fee: '' })] },
        { withdraws: [claim({ status: 0 })] }, { withdraws: [claim({ status: 4 })] }]) assert.throws(() => api.parseClaimRecords(value))
})

test('browser screenshot payloads map IDs, timestamps and decimal strings without contract-unit conversion', () => {
    const api = runtime({ '@/services/http/index.ts': {} })('src/features/funds-records/api.ts')
    const deposits = api.parseRechargeRecords({ recharges: [recharge({ amount: '100',
        from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        tx_id: '0xf523ffe591975572ca0f17c35082aedd7654297d73b30ddb1a1e3b196b6851ea',
    })] })
    assert.equal(deposits[0].amount, '100')
    assert.equal(deposits[0].id, 2)
    assert.equal(deposits[0].createdAt, '2026-10-10 15:33:58')
    const withdrawals = api.parseClaimRecords({ withdraws: [claim({ tamount: '1', amount: '0.99', fee: '0.01' })] })
    assert.equal(withdrawals[0].requestedAmount, '1')
    assert.equal(withdrawals[0].amount, '0.99')
    assert.equal(withdrawals[0].fee, '0.01')
    assert.equal(withdrawals[0].status, 1)
    assert.equal(withdrawals[0].id, 8)
    assert.equal(withdrawals[0].createdAt, '2026-10-10 15:05:13')
})

test('services map tabs and infer the end only from the returned page length; HTTP errors still reject', async () => {
    const calls = []
    let count = 20, failure = null
    const service = runtime({ '@/services/http/index.ts': { request: async config => {
        calls.push(config)
        if (failure) throw failure
        return config.url === '/api/recharges'
            ? { recharges: Array.from({ length: count }, () => recharge()) }
            : { withdraws: Array.from({ length: count }, () => claim()) }
    } } })('src/pages/main/funds-records/service.ts')
    const signal = new AbortController().signal
    assert.equal((await service.loadRechargeRecords(null, 1, signal)).hasMore, true)
    for (const [query, status] of [['pending', 1], ['succeeded', 2], ['failed', 3]]) {
        await service.loadClaimRecords(query, 2, signal)
        assert.equal(calls.at(-1).params.status, status)
        assert.equal(calls.at(-1).params.page_no, 2)
        assert.equal(calls.at(-1).signal, signal)
    }
    count = 0
    assert.equal((await service.loadClaimRecords('pending', 1, signal)).hasMore, false)
    failure = new Error('HTTP failure')
    await assert.rejects(service.loadRechargeRecords(null, 1, signal), /HTTP failure/)
})

test('replacement cancels stale pagination, disables page two, and applies only current results', async () => {
    const requests = []
    const { createRecordsPagination } = runtime()('src/pages/main/funds-records/pagination.ts')
    const pagination = createRecordsPagination((query, page, signal) => {
        const pending = deferred(); requests.push({ query, page, signal, ...pending }); return pending.promise
    }, 'pending')
    const first = pagination.replace()
    await pagination.loadMore()
    assert.equal(requests.length, 1)
    requests[0].resolve({ items: ['old'], hasMore: true }); await first
    const oldMore = pagination.loadMore()
    const replacement = pagination.replace('failed')
    assert.equal(requests[1].signal.aborted, true)
    assert.equal(pagination.getSnapshot().items.length, 0)
    assert.equal(pagination.getSnapshot().page, 0)
    assert.equal(pagination.getSnapshot().hasMore, false)
    await pagination.loadMore()
    assert.equal(requests.length, 3)
    requests[1].reject(new Error('stale')); await oldMore
    assert.equal(pagination.getSnapshot().isFirstLoading, true)
    requests[2].resolve({ items: ['new'], hasMore: true }); await replacement
    const next = pagination.loadMore()
    await pagination.loadMore()
    assert.equal(requests.length, 4)
    requests[3].reject(new Error('offline')); await assert.rejects(next, /offline/)
    assert.equal(pagination.getSnapshot().page, 1)
    assert.equal(pagination.getSnapshot().isLoadingMore, false)
    const retry = pagination.loadMore()
    assert.equal(requests[4].page, 2)
    requests[4].resolve({ items: ['next'], hasMore: false }); await retry
    assert.deepEqual(Array.from(pagination.getSnapshot().items), ['new', 'next'])
    const refresh = pagination.replace()
    assert.equal(pagination.getSnapshot().isFirstLoading, true)
    pagination.invalidate()
    assert.equal(requests[5].signal.aborted, true)
    requests[5].resolve({ items: ['unmounted'], hasMore: false }); await refresh
    assert.equal(pagination.getSnapshot().items.length, 0)
})
