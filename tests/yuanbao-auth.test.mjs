import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, ADDRESS, deferred, userWire } from './helpers/yuanbao-runtime.mjs'
import { HttpError } from '../src/services/http/error.ts'

function authRuntime(options = {}) {
    let token = options.token ?? '', referral = options.referral ?? '',
        address = Object.hasOwn(options, 'address') ? options.address : ADDRESS, listeners, addressProvider
    let state = { status: 'checking', user: null, error: '' }
    const calls = [], messages = []
    let connects = 0, passiveReads = 0
    const user = { id: 1, address: ADDRESS, referralCode: 'abc12345', level: null, balances: { usdt: '0', yuanqi: '1', baoqi: '2' } }
    const wallet = {
        initializeDappWallet: async () => true,
        connectDappWallet: async () => { connects++; if (options.connect) await options.connect(); return { address } },
        getAuthorizedDappAddress: async () => { passiveReads++; return address },
        disconnectDappWallet: () => { listeners = undefined },
        signDappMessage: async (message) => { messages.push(message); return options.sign ? options.sign(message) : { signature: '0xsig' } },
        startDappWalletListeners: (handlers) => { listeners = handlers },
        stopDappWalletListeners: () => { listeners = undefined },
    }
    const store = { getState: () => ({ walletAddress: address, setWalletAddress: (value) => { address = value } }) }
    const load = runtime({
        'src/services/dapp/wallet.ts': wallet,
        'src/services/dapp/provider.ts': { detectDappProvider: async () => ({}) },
        'src/services/http/index.ts': {
            HttpError,
            registerHttpWalletAddressProvider: (provider) => { addressProvider = provider; return () => { addressProvider = undefined } },
            registerHttpUnauthorizedHandler: () => () => {},
        },
        'src/services/storage/token.ts': { getToken: () => token, setToken: (value) => { token = value }, removeToken: () => { token = '' } },
        'src/services/storage/referral.ts': { getReferralCode: () => referral, setReferralCode: (value) => { referral = value } },
        'src/stores/dapp/index.ts': { useDappStore: store },
        'src/features/auth/state.ts': { useSessionStore: { setState: (value) => { state = { ...state, ...value } } } },
        'src/features/auth/api.ts': { requestWalletLogin: async (body) => { calls.push(body); return options.login ? options.login(body) : 'jwt' } },
        'src/features/user/api.ts': { getCurrentUser: async (mode) => options.user ? options.user(mode) : user },
    })
    const session = load('src/features/auth/session.ts')
    return { session, calls, messages, get state() { return state }, get token() { return token }, get referral() { return referral },
        get connects() { return connects }, get passiveReads() { return passiveReads },
        headers: () => addressProvider?.(), changeAccount: () => listeners?.onAccountsChanged('0x0000000000000000000000000000000000000002'), disconnect: () => listeners?.onAccountsChanged(undefined),
        emitAccount: value => { address = value; listeners?.onAccountsChanged(value) } }
}
const flush = () => new Promise(setImmediate)

test('initial mobile wallet connection event before connect resolves does not invalidate login', async () => {
    const connection = deferred()
    const app = authRuntime({ address: undefined, connect: () => connection.promise })
    const dispose = app.session.mountAuthSession()
    await flush()
    assert.equal(app.headers(), undefined)
    const pending = app.session.authorizeWallet()
    await flush()
    assert.equal(app.connects, 1)
    assert.equal(app.messages.length, 0)
    assert.equal(app.calls.length, 0)
    app.emitAccount(undefined)
    app.emitAccount(ADDRESS)
    assert.equal(app.headers(), ADDRESS)
    connection.resolve()
    await pending
    assert.equal(app.messages.length, 1)
    assert.equal(app.calls.length, 1)
    assert.equal(app.state.status, 'authenticated')
    dispose()
})

test('duplicate same-account events during signing and after login preserve the session', async () => {
    const signature = deferred()
    const app = authRuntime({ sign: () => signature.promise })
    const dispose = app.session.mountAuthSession()
    await flush()
    const pending = app.session.authorizeWallet()
    await flush()
    app.emitAccount(ADDRESS.toLowerCase())
    app.emitAccount(ADDRESS)
    signature.resolve({ signature: '0xsignature' })
    await pending
    app.emitAccount(ADDRESS.toLowerCase())
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.token, 'jwt')
    assert.equal(app.calls.length, 1)
    dispose()
})

test('real account change or disconnect while connecting still prevents signing and login', async () => {
    for (const next of ['0x0000000000000000000000000000000000000002', undefined]) {
        const connection = deferred()
        const app = authRuntime({ connect: () => connection.promise })
        const dispose = app.session.mountAuthSession()
        await flush()
        const pending = app.session.authorizeWallet()
        await flush()
        app.emitAccount(next)
        connection.resolve()
        await assert.rejects(pending, /变化/)
        assert.equal(app.calls.length, 0)
        assert.equal(app.messages.length, 0)
        assert.equal(app.token, '')
        dispose()
    }
})

test('wallet authorization uses one timestamp for raw message and POST, coalesces submits and verifies user ownership', async () => {
    const app = authRuntime()
    const dispose = app.session.mountAuthSession()
    const first = app.session.authorizeWallet('abc12345')
    const second = app.session.authorizeWallet('abc12345')
    assert.equal(first, second)
    await first
    assert.equal(app.calls.length, 1)
    assert.equal(app.messages[0], `Login-${app.calls[0].timestamp}`)
    assert.equal(app.calls[0].address, ADDRESS)
    assert.equal(app.calls[0].ref, 'abc12345')
    assert.equal(app.token, 'jwt')
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.headers(), ADDRESS)
    app.changeAccount()
    assert.equal(app.state.status, 'signedOut')
    assert.equal(app.token, '')
    assert.equal(app.headers(), '0x0000000000000000000000000000000000000002')
    assert.equal(app.referral, 'abc12345')
    dispose()
})

test('restoration uses passive wallet lookup and Bearer profile validation with current address without signing or login POST', async () => {
    const modes = []
    const app = authRuntime({ token: 'saved-token', user: async (mode) => { modes.push(mode); return { address: ADDRESS, id: 1 } } })
    const dispose = app.session.mountAuthSession()
    assert.equal(app.state.status, 'checking')
    await flush()
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.connects, 0)
    assert.equal(app.passiveReads, 1)
    assert.equal(app.messages.length, 0)
    assert.equal(app.calls.length, 0)
    assert.deepEqual(modes, ['bearer'])
    dispose()
    assert.equal(app.token, 'saved-token')
})

test('signature pending during an account change cannot submit a login or resurrect the old account', async () => {
    const sign = deferred()
    const app = authRuntime({ sign: () => sign.promise })
    app.session.mountAuthSession()
    const pending = app.session.authorizeWallet('abc12345')
    await flush()
    app.changeAccount()
    sign.resolve({ signature: '0xold' })
    await assert.rejects(pending, /变化/)
    assert.equal(app.calls.length, 0)
    assert.equal(app.token, '')
    assert.equal(app.state.status, 'signedOut')
})

test('a late login HTTP success after a wallet change cannot save its token', async () => {
    const login = deferred()
    const app = authRuntime({ login: () => login.promise })
    app.session.mountAuthSession()
    const pending = app.session.authorizeWallet()
    await flush()
    app.changeAccount()
    login.resolve('stale-token')
    await assert.rejects(pending, /变化/)
    assert.equal(app.token, '')
    assert.equal(app.state.user, null)
    assert.equal('ref' in app.calls[0], false)
})

test('successful login followed by profile failure retains token and retries GET without another POST', async () => {
    let failProfile = true
    const app = authRuntime({ user: async () => { if (failProfile) throw new Error('network'); return { address: ADDRESS, id: 1 } } })
    app.session.mountAuthSession()
    await assert.rejects(app.session.authorizeWallet(), /登录已完成.*资料验证失败/)
    assert.equal(app.token, 'jwt')
    assert.equal(app.calls.length, 1)
    failProfile = false
    await app.session.authorizeWallet()
    assert.equal(app.calls.length, 1)
    assert.equal(app.messages.length, 1)
    assert.equal(app.state.status, 'authenticated')
})

test('wrong token owner clears session', async () => {
    const wrong = authRuntime({ token: 'saved', user: async () => ({ address: '0x0000000000000000000000000000000000000002' }) })
    wrong.session.mountAuthSession()
    await flush()
    assert.equal(wrong.state.status, 'signedOut')
    assert.equal(wrong.token, '')
})

test('invalid cached referrals reach backend after signing and a rejected login can be retried', async () => {
    for (const referral of ['short', 'too-long-invite', 'bad!!!!?']) {
        const failure = new Error('backend referral validation failed')
        const app = authRuntime({ referral, login: async (body) => {
            if (body.ref !== 'abc12345') throw failure
            return 'jwt'
        } })
        const dispose = app.session.mountAuthSession()
        await assert.rejects(app.session.authorizeWallet(), error => error === failure)
        assert.equal(app.connects, 1)
        assert.equal(app.messages.length, 1)
        assert.equal(app.calls.length, 1)
        assert.equal(app.calls[0].ref, referral)
        assert.equal(app.messages[0], `Login-${app.calls[0].timestamp}`)
        assert.equal(app.token, '')
        assert.equal(app.state.status, 'signedOut')

        await app.session.authorizeWallet('abc12345')
        assert.equal(app.calls.length, 2)
        assert.equal(app.messages.length, 2)
        assert.equal(app.token, 'jwt')
        assert.equal(app.state.status, 'authenticated')
        dispose()
    }
})

test('login trims nonempty referrals and omits empty referrals without blocking wallet authorization', async () => {
    for (const [referral, expected] of [[' short ', 'short'], ['', undefined], ['   ', undefined]]) {
        const app = authRuntime({ referral })
        const dispose = app.session.mountAuthSession()
        await app.session.authorizeWallet()
        assert.equal(app.connects, 1)
        assert.equal(app.messages.length, 1)
        assert.equal(app.calls.length, 1)
        assert.equal(app.calls[0].ref, expected)
        assert.equal(Object.hasOwn(app.calls[0], 'ref'), expected !== undefined)
        dispose()
    }
})

test('an invalid cached referral does not block retrying stored-token profile verification', async () => {
    let failProfile = true
    const app = authRuntime({ token: 'saved-token', referral: 'short', user: async () => {
        if (failProfile) throw new Error('network')
        return { address: ADDRESS, id: 1 }
    } })
    const dispose = app.session.mountAuthSession()
    await flush()
    assert.equal(app.state.status, 'signedOut')
    assert.equal(app.token, 'saved-token')
    failProfile = false
    await app.session.authorizeWallet()
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.token, 'saved-token')
    assert.equal(app.connects, 0)
    assert.equal(app.messages.length, 0)
    assert.equal(app.calls.length, 0)
    dispose()
})

test('StrictMode cleanup invalidates old restoration without removing the persisted token', async () => {
    const profile = deferred()
    const app = authRuntime({ token: 'saved', user: () => profile.promise })
    const dispose = app.session.mountAuthSession()
    await flush()
    dispose()
    app.session.mountAuthSession()
    profile.resolve({ id: 1, address: ADDRESS })
    await flush()
    assert.equal(app.token, 'saved')
    assert.equal(app.state.status, 'authenticated')
})


test('public requests receive passive live address without a Token and remove it on wallet disconnect', async () => {
    const app = authRuntime()
    const dispose = app.session.mountAuthSession()
    assert.equal(app.headers(), undefined)
    await flush()
    assert.equal(app.headers(), ADDRESS)
    assert.equal(app.token, '')
    assert.equal(app.connects, 0)
    app.changeAccount()
    assert.equal(app.headers(), '0x0000000000000000000000000000000000000002')
    app.disconnect()
    assert.equal(app.headers(), undefined)
    dispose()
})

test('the login POST and profile read receive the actual connected address before session verification', async () => {
    let app
    app = authRuntime({ login: async () => { assert.equal(app.headers(), ADDRESS); return 'jwt' },
        user: async () => { assert.equal(app.headers(), ADDRESS); return { address: ADDRESS, id: 1 } } })
    const dispose = app.session.mountAuthSession()
    await app.session.authorizeWallet()
    dispose()
})


test('successful login and actual placeholder-date profile complete authenticated state for homepage navigation', async () => {
    const load = runtime({ 'src/services/http/index.ts': { request: async () => userWire({ created_at: '-0001-11-30 00:00:00' }) } })
    const getCurrentUser = load('src/features/user/api.ts').getCurrentUser
    const app = authRuntime({ user: getCurrentUser })
    const dispose = app.session.mountAuthSession()
    await app.session.authorizeWallet()
    assert.equal(app.token, 'jwt')
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.state.user.address, ADDRESS)
    dispose()
})
