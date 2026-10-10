import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime } from './helpers/yuanbao-runtime.mjs'

const release = (changes = {}) => ({
    id: 7, amount: '9007199254740993.123456', release_usdt: '12.000001', today_usdt: '1.000002',
    release_bao: '3.000003', today_bao: '0.000004', release_count: 0, total_count: 180,
    status: 1, created_at: '2026-10-10 10:30:00', ...changes,
})

test('release API uses authenticated status pagination and validates consumed fields without losing precision', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async (config) => {
        calls.push(config)
        return { order_releases: [release()] }
    } } })('src/features/orders/api.ts')
    const signal = new AbortController().signal
    const rows = await api.getOrderReleases(1, 2, signal)
    assert.equal(calls[0].url, '/api/order_releases')
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].signal, signal)
    assert.deepEqual({ ...calls[0].params }, { status: 1, page_no: 2, page_size: 20 })
    assert.equal(rows[0].amount, release().amount)
    assert.equal(rows[0].releaseCount, 0)
    assert.equal(api.parseOrderReleases({ order_releases: [] }).length, 0)
    for (const value of [{}, [], { order_releases: null },
        { order_releases: [release({ status: 2 })] },
        { order_releases: [release({ amount: 100 })] },
        { order_releases: [release({ today_bao: null })] },
        { order_releases: [release({ release_count: -1 })] },
    ]) assert.throws(() => api.parseOrderReleases(value))
})

test('release list maps both statuses and authoritative metrics using only its own endpoint', async () => {
    let rows = [release()]
    const calls = []
    const { loadCardPackPage } = runtime({ '@/services/http/index.ts': { request: async (config) => {
        calls.push(config)
        assert.equal(config.url, '/api/order_releases')
        return { order_releases: rows }
    } } })('src/pages/main/card-pack/service.ts')
    const signal = new AbortController().signal
    for (const [status, numeric] of [['ongoing', 1], ['completed', 0]]) {
        rows = [release({ status: numeric })]
        const result = await loadCardPackPage({ orderType: 'released', status }, 1, signal)
        assert.equal(calls.at(-1).params.status, numeric)
        assert.equal(calls.at(-1).signal, signal)
        assert.deepEqual({ ...result.items[0] }, {
            kind: 'release', id: '7', principal: release().amount, createdAt: '2026.10.10 10:30:00',
            totalUsdtIncome: '12.000001', totalBaoqiIncome: '3.000003',
            todayUsdtIncome: '1.000002', todayBaoqiIncome: '0.000004', period: '0/180',
        })
        assert.equal(result.hasMore, false)
    }
    rows = Array.from({ length: 20 }, (_, index) => release({ id: index + 1 }))
    assert.equal((await loadCardPackPage({ orderType: 'released', status: 'ongoing' }, 1)).hasMore, true)
    rows = []
    const empty = await loadCardPackPage({ orderType: 'released', status: 'ongoing' }, 2)
    assert.equal(calls.at(-1).params.page_no, 2)
    assert.equal(empty.items.length, 0)
    assert.equal(empty.hasMore, false)
})
