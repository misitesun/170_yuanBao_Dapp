import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'
const ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7'
function setup(options = {}) {
    let actualAddress = ADDRESS
    let chainError, writeError, readError
    let used = false
    const calls = [], writes = []
    const http = deferred()
    const wire = { id: 12, token: '0x5FbDB2315678afecb367f032d93F642f64180aa3', amount: '99000000000000000000', signature: '0xaabb', expire_time: 4102444800 }
    const load = runtime({
        '@/services/http/index.ts': { request: async call => { calls.push(call); return options.wait ? http.promise : { ...wire, ...options.payload } } },
        '@/services/dapp/index.ts': { DAPP_ERROR_MESSAGE: { contractReverted: '交易执行失败' },
            getAuthorizedDappAddress: async () => actualAddress,
            getDappUserRejectionMessage: error => error.code === 4001 ? error.message : undefined },
        '@/services/contracts/index.ts': { assertYbProjectNetwork: async () => { if (chainError) throw chainError },
            isYbProjectWithdrawalUsed: async () => { if (options.readWait) await options.readWait.promise; if (readError) throw readError; return used },
            withdrawYbProject: async params => { writes.push(params); if (writeError) throw writeError; return { status: 'success' } } },
    }, { Error })
    return { ...load('src/features/claims/flow.ts'), calls, writes, wire, http,
        setAddress: value => { actualAddress = value }, setChainError: value => { chainError = value },
        setWriteError: value => { writeError = value }, setReadError: value => { readError = value }, setUsed: value => { used = value } }
}
test('full flow consumes one signed request, preserves integer units and prevents concurrent or completed replay', async () => {
    const api = setup({ wait: true })
    const first = api.executeClaim(ADDRESS, '100.1234567')
    await api.executeClaim(ADDRESS, '200')
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(api.calls.length, 1)
    api.http.resolve(api.wire)
    await first
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'complete')
    assert.deepEqual({ ...api.writes[0] }, { id: 12n, token: api.wire.token, amount: 99000000000000000000n, deadline: 4102444800n, signature: '0xaabb' })
    await api.executeClaim(ADDRESS, '100')
    assert.equal(api.calls.length, 1)
    api.startNewClaim(ADDRESS)
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'idle')
})
test('network and account checks run before any backend deduction', async () => {
    for (const cause of ['network', 'account']) {
        const api = setup()
        if (cause === 'network') api.setChainError(new Error('wrong chain'))
        else api.setAddress('0x0000000000000000000000000000000000000001')
        await assert.rejects(api.executeClaim(ADDRESS, '100'))
        assert.equal(api.calls.length, 0)
        assert.equal(api.getClaimProgress(ADDRESS).phase, 'idle')
    }
})
test('wallet rejection and definite revert retry the original order without another request', async () => {
    for (const error of [Object.assign(new Error('rejected'), { code: 4001 }), new Error('交易执行失败')]) {
        const api = setup()
        api.setWriteError(error)
        await assert.rejects(api.executeClaim(ADDRESS, '100'))
        assert.equal(api.getClaimProgress(ADDRESS).phase, 'ready')
        api.startNewClaim(ADDRESS)
        assert.equal(api.getClaimProgress(ADDRESS).phase, 'ready')
        api.setWriteError(null)
        await api.executeClaim(ADDRESS, '')
        assert.equal(api.calls.length, 1)
        assert.equal(api.writes[0].id, api.writes[1].id)
        assert.equal(api.getClaimProgress(ADDRESS).phase, 'complete')
    }
})
test('ambiguous chain failure checks status without resending; claimed order resolves to complete', async () => {
    const api = setup()
    api.setWriteError(new Error('receipt timeout'))
    await assert.rejects(api.executeClaim(ADDRESS, '100'))
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'uncertain')
    await api.executeClaim(ADDRESS, '')
    assert.equal(api.writes.length, 1)
    api.setUsed(true)
    await api.executeClaim(ADDRESS, '')
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'complete')
    assert.equal(api.calls.length, 1)
})
test('expired signature blocks new applications; used state can still confirm completion', async () => {
    const api = setup({ payload: { expire_time: 1 } })
    await api.executeClaim(ADDRESS, '100')
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'expired')
    await api.executeClaim(ADDRESS, '100')
    assert.equal(api.calls.length, 1)
    assert.equal(api.writes.length, 0)
    api.setUsed(true)
    await api.executeClaim(ADDRESS, '')
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'complete')
})
test('account change after backend success retains signed order but never sends from new account', async () => {
    const api = setup({ wait: true })
    const first = api.executeClaim(ADDRESS, '100')
    await new Promise(resolve => setTimeout(resolve, 0))
    api.setAddress('0x0000000000000000000000000000000000000001')
    api.http.resolve(api.wire)
    await assert.rejects(first)
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'ready')
    assert.equal(api.writes.length, 0)
    api.setAddress(ADDRESS)
    await api.executeClaim(ADDRESS, '')
    assert.equal(api.calls.length, 1)
})
test('invalid successful payload locks deduction outcome rather than permitting a repeated POST', async () => {
    const api = setup({ payload: { signature: '0x' } })
    await assert.rejects(api.executeClaim(ADDRESS, '100'))
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'blocked')
    await api.executeClaim(ADDRESS, '100')
    assert.equal(api.calls.length, 1)
    assert.equal(api.writes.length, 0)
})
test('HTTP 4xx and 5xx unlock input, while missing responses block resubmission', async () => {
    for (const error of [Object.assign(new Error('minimum'), { status: 400 }), Object.assign(new Error('Internal Server Error.'), { status: 500 }), new Error('timeout')]) {
        const api = setup({ wait: true })
        const first = api.executeClaim(ADDRESS, '100')
        await new Promise(resolve => setTimeout(resolve, 0))
        api.http.reject(error)
        await assert.rejects(first)
        assert.equal(api.getClaimProgress(ADDRESS).phase, error.status ? 'idle' : 'blocked')
        if (error.status) {
            assert.equal(api.getClaimProgress(ADDRESS).message, undefined)
            await assert.rejects(api.executeClaim(ADDRESS, '100'))
            assert.equal(api.calls.length, 2)
            assert.equal(api.writes.length, 0)
        }
    }
})

test('post-application status check remains locked against concurrent replay', async () => {
    const readWait = deferred()
    const api = setup({ readWait })
    const first = api.executeClaim(ADDRESS, '100')
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'checking')
    await api.executeClaim(ADDRESS, '100')
    assert.equal(api.calls.length, 1)
    readWait.resolve()
    await first
    assert.equal(api.writes.length, 1)
})
test('failed status checks and wrong network retain payload, without stale rejection feedback', async () => {
    const api = setup()
    api.setWriteError(Object.assign(new Error('rejected'), { code: 4001 }))
    await assert.rejects(api.executeClaim(ADDRESS, '100'))
    api.setChainError(new Error('wrong chain'))
    await assert.rejects(api.executeClaim(ADDRESS, ''), /wrong chain/)
    assert.equal(api.getClaimProgress(ADDRESS).phase, 'ready')
    assert.equal(api.getClaimProgress(ADDRESS).message, undefined)
    api.setChainError(null)
    api.setReadError(new Error('read failed'))
    await assert.rejects(api.executeClaim(ADDRESS, ''), /read failed/)
    assert.equal(api.getClaimProgress(ADDRESS).payload.id, 12)
    assert.equal(api.calls.length, 1)
})
