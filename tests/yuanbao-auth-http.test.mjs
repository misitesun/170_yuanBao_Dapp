import assert from 'node:assert/strict'
import test from 'node:test'

import * as http from '../src/services/http/index.ts'
import * as tokenStorage from '../src/services/storage/token.ts'
import * as referralStorage from '../src/services/storage/referral.ts'
import { ADDRESS, deferred, runtime, userWire } from './helpers/yuanbao-runtime.mjs'

const OTHER_ADDRESS = '0x0000000000000000000000000000000000000002'
const flush = () => new Promise(setImmediate)
const response = (config, data) => ({ data, status: 200, statusText: 'OK', headers: {}, config })

// Exercise the real session -> login API -> request -> Axios interceptor chain.
// Only the injected wallet, UI store, browser storage and network adapter are external IO.
function authHttpRuntime(t, options = {}) {
    const previousWindow = globalThis.window
    const previousAdapter = http.httpClient.defaults.adapter
    const cache = new Map(Object.entries(options.cache ?? {}))
    globalThis.window = { localStorage: {
        getItem: key => cache.get(key) ?? null,
        setItem: (key, value) => cache.set(key, String(value)),
        removeItem: key => cache.delete(key),
    } }
    http.clearHttpErrorNotification()

    let address = options.address ?? ADDRESS
    let listeners
    let state = { status: 'checking', user: null, error: '' }
    const requests = [], signatures = []
    http.httpClient.defaults.adapter = async config => {
        requests.push(config)
        if (options.adapter) return options.adapter(config)
        if (config.url === '/api/auth/login') return response(config, { token: 'new-token' })
        if (config.url === '/api/users/my') return response(config, userWire({ address }))
        throw new Error(`Unexpected request: ${config.url}`)
    }
    const load = runtime({
        'src/services/http/index.ts': http,
        'src/services/storage/token.ts': tokenStorage,
        'src/services/storage/referral.ts': referralStorage,
        'src/services/dapp/provider.ts': { detectDappProvider: async () => ({}) },
        'src/services/dapp/wallet.ts': {
            initializeDappWallet: async () => true,
            connectDappWallet: async () => ({ address }),
            getAuthorizedDappAddress: async () => address,
            signDappMessage: async (message, account) => {
                signatures.push({ message, account })
                return options.sign ? options.sign(message, account) : { signature: '0xsignature' }
            },
            startDappWalletListeners: value => { listeners = value },
            stopDappWalletListeners: () => { listeners = undefined },
        },
        'src/stores/dapp/index.ts': { useDappStore: { getState: () => ({ setWalletAddress: () => {} }) } },
        'src/features/auth/state.ts': { useSessionStore: { setState: value => { state = { ...state, ...value } } } },
    })
    const session = load('src/features/auth/session.ts')
    const dispose = session.mountAuthSession()
    t.after(() => {
        dispose()
        http.httpClient.defaults.adapter = previousAdapter
        http.clearHttpErrorNotification()
        globalThis.window = previousWindow
    })
    return {
        session, requests, signatures, cache, dispose,
        get state() { return state },
        emitAccount(nextAddress) { address = nextAddress; listeners?.onAccountsChanged(nextAddress) },
        emitChain() { listeners?.onChainChanged() },
    }
}

test('login keeps the signed address in its body and omits stale address and Bearer headers while profile headers remain intact', async t => {
    const defaultHeaders = http.httpClient.defaults.headers.common
    const previousAddress = defaultHeaders.address
    defaultHeaders.address = ADDRESS
    t.after(() => {
        if (previousAddress === undefined) delete defaultHeaders.address
        else defaultHeaders.address = previousAddress
    })
    const app = authHttpRuntime(t, {
        address: OTHER_ADDRESS,
        cache: { WALLET_ADDRESS: ADDRESS },
        // A token restored by another browser context during signing must not authenticate login.
        sign: async () => { tokenStorage.setToken('old-token'); return { signature: '0xsignature' } },
    })
    await flush()
    await app.session.authorizeWallet()

    const login = app.requests.find(config => config.url === '/api/auth/login')
    const body = JSON.parse(login.data)
    assert.equal(app.signatures[0].account, OTHER_ADDRESS)
    assert.equal(body.address, OTHER_ADDRESS)
    assert.equal(app.signatures[0].message, `Login-${body.timestamp}`)
    assert.equal(login.headers.has('address'), false)
    assert.equal(login.headers.has('Authorization'), false)
    assert.equal(login.walletAddress, body.address)
    assert.equal(login.walletAddressHeader, 'omit')
    assert.ok(login.signal instanceof AbortSignal)
    const profile = app.requests.find(config => config.url === '/api/users/my')
    assert.equal(profile.headers.get('address'), OTHER_ADDRESS)
    assert.equal(profile.headers.get('Authorization'), 'Bearer new-token')
    assert.equal(profile.signal, login.signal)
    assert.equal(app.cache.get('WALLET_ADDRESS'), ADDRESS)
    assert.equal(tokenStorage.getToken(), 'new-token')
    assert.equal(app.state.status, 'authenticated')
})

test('an account event after signing but before HTTP dispatch cancels the queued login POST', async t => {
    const app = authHttpRuntime(t)
    await flush()
    let queuedSignal
    const interceptor = http.httpClient.interceptors.request.use(config => {
        if (config.url === '/api/auth/login') {
            queuedSignal = config.signal
            app.emitAccount(OTHER_ADDRESS)
        }
        return config
    })
    t.after(() => http.httpClient.interceptors.request.eject(interceptor))

    await assert.rejects(app.session.authorizeWallet())
    assert.equal(app.signatures.length, 1)
    assert.equal(queuedSignal.aborted, true)
    assert.equal(app.requests.length, 0)
    assert.equal(tokenStorage.getToken(), '')
    assert.equal(app.state.status, 'signedOut')
    assert.equal(http.getHttpErrorNotification(), null)
})

test('switching wallets aborts an in-flight login, ignores its late token and preserves the next attempt lock', async t => {
    const oldResponse = deferred(), nextResponse = deferred()
    const app = authHttpRuntime(t, { adapter: async config => {
        if (config.url === '/api/auth/login') {
            const body = JSON.parse(config.data)
            return body.address === ADDRESS ? oldResponse.promise : nextResponse.promise
        }
        return response(config, userWire({ address: OTHER_ADDRESS }))
    } })
    await flush()
    const first = app.session.authorizeWallet()
    const rejectedFirst = assert.rejects(first)
    await flush()
    const oldRequest = app.requests[0]
    assert.equal(oldRequest.signal.aborted, false)

    app.emitAccount(OTHER_ADDRESS)
    assert.equal(oldRequest.signal.aborted, true)
    assert.equal(tokenStorage.getToken(), '')
    const second = app.session.authorizeWallet()
    assert.notEqual(first, second)
    await flush()
    const nextRequest = app.requests[1]
    assert.equal(nextRequest.headers.has('address'), false)
    assert.equal(nextRequest.walletAddress, OTHER_ADDRESS)
    assert.equal(JSON.parse(nextRequest.data).address, OTHER_ADDRESS)
    assert.equal(nextRequest.signal.aborted, false)

    // The mock adapter deliberately delivers even after cancellation, as a late transport may.
    oldResponse.resolve(response(oldRequest, { token: 'old-token' }))
    await rejectedFirst
    assert.equal(tokenStorage.getToken(), '')
    assert.equal(app.session.authorizeWallet(), second)
    assert.equal(nextRequest.signal.aborted, false)
    nextResponse.resolve(response(nextRequest, { token: 'next-token' }))
    await second
    assert.equal(tokenStorage.getToken(), 'next-token')
    assert.equal(app.state.status, 'authenticated')
    assert.equal(app.state.user.address, OTHER_ADDRESS)
    assert.equal(app.requests.filter(config => config.url === '/api/auth/login').length, 2)
    assert.equal(http.getHttpErrorNotification(), null)
})

test('same-address wallet events keep the pending login alive and ordinary requests use the live address', async t => {
    const loginResponse = deferred()
    const app = authHttpRuntime(t, { adapter: async config => {
        if (config.url === '/api/auth/login') return loginResponse.promise
        return response(config, userWire({ address: config.headers.get('address') }))
    } })
    await flush()
    const pending = app.session.authorizeWallet()
    await flush()
    const login = app.requests[0]
    app.emitAccount(ADDRESS.toLowerCase())
    assert.equal(login.signal.aborted, false)
    assert.equal(login.headers.has('address'), false)
    assert.equal(login.walletAddress, ADDRESS)
    await http.request({ url: '/public', authentication: 'none' })
    assert.equal(app.requests.at(-1).headers.get('address'), ADDRESS.toLowerCase())
    loginResponse.resolve(response(login, { token: 'new-token' }))
    await pending
    assert.equal(app.state.status, 'authenticated')

    app.emitAccount(OTHER_ADDRESS)
    await http.request({ url: '/public', authentication: 'none' })
    assert.equal(app.requests.at(-1).headers.get('address'), OTHER_ADDRESS)
    app.emitAccount(undefined)
    await http.request({ url: '/public', authentication: 'none', headers: { address: ADDRESS } })
    assert.equal(app.requests.at(-1).headers.has('address'), false)
})

test('disconnect, chain change and unmount each abort the pending login transport', async t => {
    for (const invalidate of ['disconnect', 'chain', 'unmount']) {
        await t.test(invalidate, async t => {
            const lateResponse = deferred()
            const app = authHttpRuntime(t, { adapter: () => lateResponse.promise })
            await flush()
            const pending = app.session.authorizeWallet()
            const rejected = assert.rejects(pending)
            await flush()
            const login = app.requests[0]
            if (invalidate === 'disconnect') app.emitAccount(undefined)
            if (invalidate === 'chain') app.emitChain()
            if (invalidate === 'unmount') app.dispose()
            assert.equal(login.signal.aborted, true)
            lateResponse.resolve(response(login, { token: 'late-token' }))
            await rejected
            assert.equal(tokenStorage.getToken(), '')
            assert.equal(app.state.user, null)
            assert.equal(http.getHttpErrorNotification(), null)
        })
    }
})

test('switching wallets during the profile GET aborts verification and cannot restore the old session', async t => {
    const profileResponse = deferred()
    const app = authHttpRuntime(t, { adapter: config => config.url === '/api/auth/login'
        ? response(config, { token: 'old-wallet-token' }) : profileResponse.promise })
    await flush()
    const pending = app.session.authorizeWallet()
    const rejected = assert.rejects(pending)
    await flush()
    const profile = app.requests.find(config => config.url === '/api/users/my')
    assert.equal(profile.headers.get('address'), ADDRESS)
    assert.equal(profile.headers.get('Authorization'), 'Bearer old-wallet-token')
    assert.equal(profile.signal.aborted, false)
    app.emitAccount(OTHER_ADDRESS)
    assert.equal(profile.signal.aborted, true)
    assert.equal(tokenStorage.getToken(), '')
    profileResponse.resolve(response(profile, userWire({ address: ADDRESS })))
    await rejected
    assert.equal(app.state.status, 'signedOut')
    assert.equal(app.state.user, null)
    assert.equal(http.getHttpErrorNotification(), null)
})

test('a hanging signature cancels immediately on account change and late wallet errors cannot affect a new login', async t => {
    for (const code of [undefined, 4001]) {
        await t.test(code === 4001 ? 'late wallet rejection' : 'late RPC error', async t => {
            const oldSignature = deferred()
            const app = authHttpRuntime(t, { sign: (_message, account) => account === ADDRESS
                ? oldSignature.promise : { signature: '0xnext-signature' } })
            await flush()
            let cancellation
            const first = app.session.authorizeWallet()
            const observedFirst = first.catch(error => { cancellation = error })
            await flush()
            assert.equal(app.signatures.length, 1)
            assert.equal(app.requests.length, 0)

            app.emitAccount(OTHER_ADDRESS)
            await flush()
            assert.ok(cancellation instanceof http.HttpError)
            assert.equal(cancellation.code, 'ERR_CANCELED')
            await observedFirst
            const second = app.session.authorizeWallet()
            assert.notEqual(first, second)
            await second
            assert.equal(app.state.user.address, OTHER_ADDRESS)

            oldSignature.reject(Object.assign(new Error('late wallet failure'), { code }))
            await flush()
            assert.equal(tokenStorage.getToken(), 'new-token')
            assert.equal(app.state.status, 'authenticated')
            assert.equal(app.state.error, '')
            assert.equal(app.requests.filter(config => config.url === '/api/auth/login').length, 1)
            assert.equal(http.getHttpErrorNotification(), null)
        })
    }
})
