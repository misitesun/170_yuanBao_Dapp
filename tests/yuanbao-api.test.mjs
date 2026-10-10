import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, userWire, ADDRESS, deferred } from './helpers/yuanbao-runtime.mjs'

function apiRuntime(respond = () => ({}), extra = {}) {
    const calls = []
    const load = runtime({ 'src/features/auth/session.ts': { refreshCurrentUser: async () => ({ balances: {} }) }, 'src/services/http/index.ts': { request: async (config) => { calls.push(config); return respond(config) } }, ...extra })
    return { calls, load }
}

test('user and team parsers preserve exact decimals, zero counts, nullable levels and masked addresses', () => {
    const { load } = apiRuntime()
    const user = load('src/features/user/api.ts').parseCurrentUser(userWire())
    assert.equal(user.balances.usdt, '9007199254740993.123456')
    assert.equal(user.balances.yuanqi, '0')
    assert.equal(user.level, null)
    assert.equal(user.teamCount, 0)
    const team = load('src/features/team/api.ts')
    assert.equal(team.parseStatistics({ invite_count: 0, team_count: 0, kpi: '0', team_kpi: '1.000000' }).inviteCount, 0)
    const member = team.parseReferrals({ referrals: [{ id: 2, maddress: '0x529...9EE7', kpi: '1.000000', team_kpi: '0', invite_count: 0, team_count: 0, created_at: '2026-09-29 10:00:00', level: null }] })[0]
    assert.equal(member.name, '0x529...9EE7')
    assert.equal(member.level, null)
    assert.throws(() => team.parseReferrals({ referrals: [{ ...member, level: undefined }] }))
    assert.throws(() => load('src/features/user/api.ts').parseCurrentUser(userWire({ balance_usdt: 1 })))
    assert.throws(() => load('src/features/user/api.ts').parseCurrentUser({ data: userWire() }))
})

test('login sends exact body without stale credentials and validates its consumed token', async () => {
    const { calls, load } = apiRuntime(() => ({ token: 'jwt' }))
    const body = { address: ADDRESS, timestamp: 123, signature: '0xsig' }
    assert.equal(await load('src/features/auth/api.ts').requestWalletLogin(body), 'jwt')
    assert.equal(calls[0].authentication, 'none')
    assert.equal(calls[0].url, '/api/auth/login')
    assert.equal(calls[0].data, body)
    assert.equal('ref' in calls[0].data, false)
    for (const response of [null, [], {}, { token: '' }, { token: 1 }]) {
        await assert.rejects(apiRuntime(() => response).load('src/features/auth/api.ts').requestWalletLogin(body))
    }
})

test('all three asset tabs map to documented currency keys, and only income flag controls amount direction', async () => {
    const { calls, load } = apiRuntime(() => ({ balance_logs: [{ id: 10, is_inc: false, amount: '1.5', ccy: 'balance_bao', content: '提取', created_at: '2026-09-29 00:05:00' }] }))
    const api = load('src/features/assets/api.ts')
    for (const [tab, ccy] of [['usdt', 'balance_usdt'], ['yuanqi', 'balance_energy'], ['baoqi', 'balance_bao']]) {
        await api.getBalanceLogs(tab, 2)
        assert.equal(calls.at(-1).params.ccy, ccy)
        assert.equal(calls.at(-1).params.page_no, 2)
        assert.equal(calls.at(-1).params.page_size, 20)
    }
    const page = load('src/pages/main/assets/service.ts')
    const result = await page.loadAssetsPage('baoqi', 2)
    assert.equal(result.items[0].amount, '-1.5')
    assert.equal(result.items[0].content, '提取')
    assert.equal(result.hasMore, false)
    assert.equal(result.overview, undefined)
    assert.throws(() => api.parseBalanceLogs({ balance_logs: [{ id: 10, is_inc: 1 }] }))
    assert.throws(() => api.parseBalanceLogs([]))
})

test('first asset page waits for authoritative balances and list while append does not refetch overview', async () => {
    const profile = deferred(), rows = deferred()
    let userReads = 0
    const { load } = apiRuntime(() => rows.promise, {
        'src/features/auth/session.ts': { refreshCurrentUser: () => { userReads++; return profile.promise } },
    })
    const loader = load('src/pages/main/assets/service.ts').loadAssetsPage
    let done = false
    const pending = loader('usdt', 1).then((value) => { done = true; return value })
    rows.resolve({ balance_logs: [] })
    await Promise.resolve()
    assert.equal(done, false)
    profile.resolve({ balances: { usdt: '0', yuanqi: '1.000000', baoqi: '2' } })
    const result = await pending
    assert.equal(result.overview.yuanqi, '1.000000')
    await loader('yuanqi', 2)
    assert.equal(userReads, 1)
})

test('notice payload union is explicit and unused read success bodies are ignored but HTTP failure still rejects', async () => {
    const { load, calls } = apiRuntime(() => ({ arbitrary: 'unused' }))
    const api = load('src/features/notices/api.ts')
    assert.equal(api.parsePopupNotice({ is_show: false, notice: [] }).notice, null)
    assert.throws(() => api.parsePopupNotice({ is_show: true, notice: [] }))
    assert.throws(() => api.parsePopupNotice({ is_show: false, notice: null }))
    const notice = { id: 1, title: '公告', content: '<p>正文</p>', updated_at: '2026-09-29 12:00:00' }
    assert.equal(api.parsePopupNotice({ is_show: false, notice }).notice.id, 1)
    assert.equal(api.parseNotices({ notices: [] }).length, 0)
    for (const body of [undefined, '', [], { unexpected: 1 }]) {
        assert.equal(await apiRuntime(() => body).load('src/features/notices/api.ts').markNoticeRead(1), undefined)
    }
    await api.markNoticeRead(1)
    assert.equal(calls[0].url, '/api/notices/1/read')
    await assert.rejects(apiRuntime(() => { throw new Error('HTTP 404') }).load('src/features/notices/api.ts').markNoticeRead(1), /404/)
})

test('notice content only accepts HTTP URLs and never forwards active attributes', () => {
    const { load } = apiRuntime()
    const { safeContentUrl } = load('src/features/notices/html.ts')
    for (const url of ['', 'javascript:alert(1)', 'data:text/html,test', 'vbscript:alert(1)', 'file:///tmp/test']) assert.equal(safeContentUrl(url), undefined)
    assert.equal(safeContentUrl('/article', 'https://example.test/'), 'https://example.test/article')
})


test('the actual backend placeholder registration date cannot block a valid user identity', async () => {
    const payload = userWire({ created_at: '-0001-11-30 00:00:00', balance_usdt: '1006.010000',
        balance_energy: '100.000000', balance_bao: '1.700000', level: { id: 1, name: 'V1', icon: 'http://example.test/level.png' } })
    const { load } = apiRuntime(() => payload)
    const user = await load('src/features/user/api.ts').getCurrentUser('bearer')
    assert.equal(user.address, ADDRESS)
    assert.equal(user.createdAt, '-0001-11-30 00:00:00')
    assert.equal(user.balances.usdt, '1006.010000')
    assert.throws(() => load('src/features/user/api.ts').parseCurrentUser({ ...payload, address: 'invalid' }))
})

test('transfer asset tab uses its own endpoint and keeps reported amount separate from fee', async () => {
    let userReads = 0
    const balances = { usdt: '1', yuanqi: '2', baoqi: '3' }
    const row = { id: 12, ccy: 'balance_bao', amount: '100', fee: '2', type: 2, address: '0x529...9EE7', created_at: '2026-10-10 14:00:00' }
    let rows = [row, { ...row, id: 11, type: 1 }]
    const { calls, load } = apiRuntime(() => ({ transfers: rows }), { 'src/features/auth/session.ts': { refreshCurrentUser: async () => { userReads++; return { balances } } } })
    const loader = load('src/pages/main/assets/service.ts').loadAssetsPage
    const first = await loader('transfers', 1)
    assert.equal(first.overview, balances)
    assert.equal(first.items[0].amount, '+100')
    assert.equal(first.items[0].content, '转入')
    assert.equal(first.items[0].transfer.fee, '2')
    assert.equal(first.items[1].amount, '-100')
    assert.equal(first.items[1].tone, 'expense')
    assert.equal(first.hasMore, false)
    rows = Array.from({ length: 20 }, (_, index) => ({ ...row, id: index + 1 }))
    assert.equal((await loader('transfers', 2)).hasMore, true)
    assert.equal(userReads, 1)
    assert.ok(calls.every(call => call.url === '/api/transfers'))
    assert.deepEqual({ ...calls[1].params }, { page_no: 2, page_size: 20 })
})
