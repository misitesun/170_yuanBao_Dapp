import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime } from './helpers/yuanbao-runtime.mjs'
const config = (flag = '1') => ({ withdraw_usdt_switch: flag, withdraw_usdt_min: '10.000001', withdraw_usdt_fee: '1.5' })
test('claim config is authenticated, validated and preserves decimal strings and documented off values', async () => {
    const calls = []
    const api = runtime({ '@/services/http/index.ts': { request: async value => { calls.push(value); return config() } } })('src/features/claims/api.ts')
    const signal = new AbortController().signal
    const result = await api.getClaimConfig(signal)
    assert.equal(result.minimum, '10.000001')
    assert.equal(result.feePercent, '1.5')
    assert.equal(calls[0].url, '/api/claims/config')
    assert.equal(calls[0].signal, signal)
    assert.equal(calls[0].authentication, undefined)
    for (const flag of ['', '0']) assert.equal(api.parseClaimConfig(config(flag)).enabled, false)
    for (const value of [[], {}, config(null), { ...config(), withdraw_usdt_fee: 1 }, { ...config(), withdraw_usdt_min: '-1' }]) assert.throws(() => api.parseClaimConfig(value))
})
const payload = { id: 12, token: '0x5FbDB2315678afecb367f032d93F642f64180aa3', amount: '99000000000000000000', signature: '0xaabb', expire_time: 1900000000 }
test('claim consumes strictly validated signed payload and preserves raw integers', async () => {
    const calls = []
    let response = payload
    const api = runtime({ '@/services/http/index.ts': { request: async value => { calls.push(value); return response } } })('src/features/claims/api.ts')
    assert.equal(api.normalizeClaimAmount('9007199254740993.123456789'), '9007199254740993.123456')
    for (const invalid of ['', '-1', '1e3', 'abc', '0', '0.0000001']) assert.equal(api.normalizeClaimAmount(invalid), null)
    const result = await api.submitClaim('100.1234567')
    assert.equal(result.amount, payload.amount)
    assert.equal(result.token, payload.token)
    assert.equal(result.signature, payload.signature)
    assert.equal(result.expireTime, payload.expire_time)
    assert.deepEqual({ ...calls[0].data }, { ccy: 'balance_usdt', amount: '100.123456' })
    assert.equal(calls[0].method, 'POST')
    assert.equal(calls[0].url, '/api/claims')
    for (response of [undefined, null, [], 'ok', {}, ...['id', 'token', 'amount', 'signature', 'expire_time'].map(key => ({ ...payload, [key]: undefined })),
        { ...payload, id: 1.5 }, { ...payload, id: Number.MAX_SAFE_INTEGER + 1 }, { ...payload, amount: 99 }, { ...payload, amount: '1.2' },
        { ...payload, amount: '-1' }, { ...payload, amount: '0' }, { ...payload, amount: String(2n ** 256n) },
        { ...payload, signature: '0x' }, { ...payload, signature: '0xabc' }, { ...payload, token: 'bad' }, { ...payload, expire_time: '1900000000' }]) {
        await assert.rejects(api.submitClaim('100'), /领取参数异常/)
    }
    const failed = runtime({ '@/services/http/index.ts': { request: async () => { throw new Error('HTTP 400') } } })('src/features/claims/api.ts')
    await assert.rejects(failed.submitClaim('10'), /HTTP 400/)
})
