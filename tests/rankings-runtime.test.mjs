import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

const wire = (rank = 51) => ({ list: [{ rank: 1, address: '0x529...9EE7', team_kpi: '9007199254740993.123456' }], me: { rank, team_kpi: '80.000001' } })
const flush = () => new Promise(setImmediate)

test('rankings authenticated endpoint has no pagination and preserves server ordering, amount strings and personal ranks', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async (config) => { calls.push(config); return wire() } } })('src/features/rankings/api.ts')
    const signal = new AbortController().signal
    const data = await api.getTeamRanking(signal)
    assert.equal(calls[0].url, '/api/rankings/team_kpi')
    assert.equal(calls[0].authentication, undefined)
    assert.equal(calls[0].params, undefined)
    assert.equal(calls[0].signal, signal)
    assert.equal(data.list[0].teamKpi, wire().list[0].team_kpi)
    assert.equal(data.me.rank, 51)
    assert.equal(api.parseTeamRanking({ list: [], me: { rank: 0, team_kpi: '0' } }).me.rank, 0)
    const suppliedOrder = wire()
    suppliedOrder.list.push({ rank: 2, address: '0x222...2222', team_kpi: '12' })
    assert.deepEqual(Array.from(api.parseTeamRanking(suppliedOrder).list, row => row.address), ['0x529...9EE7', '0x222...2222'])
    for (const invalid of [[], {}, { ...wire(), me: null }, { ...wire(), me: { rank: '1', team_kpi: '0' } },
        { ...wire(), me: { rank: -1, team_kpi: '0' } }, { ...wire(), list: [{ rank: 0, address: 'a', team_kpi: '0' }] },
        { ...wire(), list: [{ rank: 1, address: null, team_kpi: '0' }] },
        { ...wire(), me: { rank: 1, team_kpi: 10 } },
        { ...wire(), list: Array.from({ length: 51 }, () => wire().list[0]) },
    ]) assert.throws(() => api.parseTeamRanking(invalid))
})

test('ranking reload awaits IO, retries errors and cancels obsolete/unmounted requests', async () => {
    const slots = [], requests = [], errors = []
    let cursor = 0, effect
    const onError = error => errors.push(error)
    const { useRanking: renderRankingHook } = runtime({
        react: {
            useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value }] },
            useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
            useCallback: fn => fn,
            useEffect: fn => { effect = fn },
        },
        '@/features/rankings/api.ts': { getTeamRanking: signal => { const pending = deferred(); requests.push({ signal, ...pending }); return pending.promise } },
    })('src/pages/main/ranking/useRanking.ts')
    const render = () => { cursor = 0; return renderRankingHook(onError) }
    assert.equal(render().loading, true)
    const cleanup = effect()
    const error = new Error('offline')
    requests[0].reject(error)
    await flush()
    assert.equal(render().failed, true)
    assert.equal(errors[0], error)
    let finished = false
    const retry = render().reload().then(() => { finished = true })
    assert.equal(render().loading, true)
    assert.equal(render().data, null)
    await Promise.resolve()
    assert.equal(finished, false)
    requests[1].resolve({ list: [], me: { rank: 0, teamKpi: '0' } })
    await retry
    assert.equal(render().failed, false)
    assert.equal(render().data.me.rank, 0)
    const old = render().reload()
    const latest = render().reload()
    assert.equal(requests[2].signal.aborted, true)
    requests[3].resolve({ list: [], me: { rank: 70, teamKpi: '123' } })
    await latest
    requests[2].resolve({ list: [], me: { rank: 3, teamKpi: '999' } })
    await old
    assert.equal(render().data.me.rank, 70)
    const leaving = render().reload()
    cleanup()
    assert.equal(requests[4].signal.aborted, true)
    requests[4].reject(new Error('cancelled'))
    await leaving
    assert.equal(errors.length, 1)
    assert.equal(render().data, null)
})

test('ranking UI renders remote team values, empty/unranked and error retry without fixture addresses', () => {
    let state = { data: { list: [{ rank: 1, address: 'server...1234', teamKpi: '999.000001' }, { rank: 4, address: 'server...5678', teamKpi: '50' }], me: { rank: 51, teamKpi: '80' } }, loading: false, failed: false, reload: () => {} }
    const jsx = (type, props) => ({ type, props })
    const boundary = () => null
    let walletAddress = '0xf390000000000000000000000000000000002266'
    const { RankingPage } = runtime({
        react: { useCallback: fn => fn }, 'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/components/DropletLoading': { DropletLoading: boundary },
        '@/components/Empty': { Empty: boundary },
        '@/components/Toast': { Toast: boundary, useToast: () => ({ showToast: () => {} }) },
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        './useRanking.ts': { useRanking: () => state },
        '@/stores/dapp/index.ts': { useDappStore: selector => selector({ walletAddress }) },
        ...Object.fromEntries(['common/title-divider.png', 'ranking/rank-first.png', 'ranking/rank-second.png', 'ranking/rank-third.png', 'ranking/my-rank-icon.png'].map(path => [`@/assets/${path}`, path])),
    })('src/pages/main/ranking/RankingPage.tsx')
    const render = () => { const root = RankingPage(); return root.props.children[0].type(root.props.children[0].props) }
    const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]
    let all = nodes(render())
    const strings = all => all.map(node => node.props?.children).filter(value => typeof value === 'string')
    assert.ok(strings(all).includes('999.000001'))
    assert.ok(strings(all).includes('server...1234'))
    assert.ok(strings(all).includes('我的排名：51'))
    assert.ok(!strings(all).includes('0xec***36c3'))
    assert.ok(strings(all).includes('0xf39****2266'))
    walletAddress = '0x529000000000000000000000000000000000009EE7'
    assert.ok(strings(nodes(render())).includes('0x529****9EE7'))
    walletAddress = null
    assert.ok(strings(nodes(render())).includes('--'))
    state = { ...state, data: { list: [], me: { rank: 0, teamKpi: '0' } } }
    all = nodes(render())
    assert.ok(strings(all).includes('我的排名：未上榜'))
    assert.equal(all.filter(node => node.type === 'li').length, 0)
    let retried = false
    state = { data: null, loading: false, failed: true, reload: () => { retried = true } }
    all = nodes(render())
    all.find(node => node.type === 'button').props.onClick()
    assert.equal(retried, true)
    assert.ok(strings(all).includes('我的排名：—'))
})
