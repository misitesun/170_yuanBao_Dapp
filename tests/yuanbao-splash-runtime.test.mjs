import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'

function splash(options = {}) {
    const hooks = [], effects = [], timers = new Map(), calls = [], feedback = []
    let cursor = 0, nextTimer = 1, referral = '', state = { status: options.status ?? 'signedOut', error: '' }
    const jsx = (type, props) => ({ type, props })
    const react = {
        useRef: (value) => { const slot = cursor++; return hooks[slot] ??= { current: value } },
        useState: (value) => {
            const slot = cursor++
            if (!(slot in hooks)) hooks[slot] = typeof value === 'function' ? value() : value
            return [hooks[slot], (update) => { hooks[slot] = typeof update === 'function' ? update(hooks[slot]) : update }]
        },
        useEffect: (effect, deps) => {
            const slot = cursor++
            const previous = hooks[slot]
            if (!previous || deps.some((dep, index) => dep !== previous.deps[index])) {
                previous?.cleanup?.()
                hooks[slot] = { effect, deps }
                effects.push(slot)
            }
        },
    }
    const load = runtime({ react, 'react/jsx-runtime': { jsx, jsxs: jsx },
        'react-router': { useParams: () => ({ ref: options.ref }), useLocation: () => ({ search: options.search ?? '', state: options.from ? { from: options.from } : undefined }), Navigate: 'navigate' },
        '@/assets/common/yuanbao-logo.png': 'logo',
        'src/components/ContractLoading': { ContractLoading: 'loading-overlay' },
        'src/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (...args) => feedback.push(args) }) },
        'src/services/http/index.ts': { wasHttpErrorReported: () => options.reported ?? false },
        'src/features/auth/session.ts': { authorizeWallet: async (ref) => { calls.push(ref); return options.authorize?.() } },
        'src/features/auth/state.ts': { useSessionStore: () => state },
        'src/services/storage/referral.ts': { getReferralCode: () => referral, setReferralCode: (value) => { referral = value } },
        'src/services/dapp/error.ts': { getDappUserRejectionMessage: (failure) => failure.code === 4001 ? 'cancelled' : undefined },
        'src/router': { ROUTE_PATH: { home: '/home' } },
        'src/pages/auth/login/Galaxy.tsx': { default: 'galaxy' },
    }, { Error, URLSearchParams, window: { setTimeout: (run, delay) => { const id = nextTimer++; timers.set(id, { run, delay }); return id }, clearTimeout: (id) => timers.delete(id) } })
    const { LoginPage } = load('src/pages/auth/login/LoginPage.tsx')
    function render() {
        cursor = 0
        const tree = LoginPage(), nodes = []
        function walk(node) {
            if (Array.isArray(node)) return node.forEach(walk)
            if (!node || typeof node !== 'object') return
            nodes.push(node); walk(node.props?.children)
        }
        walk(tree)
        for (const slot of effects.splice(0)) hooks[slot].cleanup = hooks[slot].effect()
        return nodes
    }
    const cleanup = () => hooks.forEach((hook) => hook?.cleanup?.())
    render()
    return { render, calls, feedback, timers, cleanup, setStatus: (status) => { state = { status, error: '' } },
        strictReplay: () => { cleanup(); hooks.forEach((hook) => { if (hook?.effect) hook.cleanup = hook.effect() }) },
        start: () => { const [id, timer] = [...timers.entries()][0]; timers.delete(id); timer.run() },
    }
}
const flush = () => new Promise(setImmediate)

test('HU splash has no form inputs, saves link referral and authorizes once after animation including StrictMode replay', async () => {
    const ui = splash({ ref: 'abc12345' })
    assert.equal(ui.render().some((node) => ['input', 'textarea', 'form'].includes(node.type)), false)
    assert.equal(ui.calls.length, 0)
    assert.equal([...ui.timers.values()][0].delay, 1000)
    ui.strictReplay()
    assert.equal(ui.timers.size, 1)
    ui.start()
    await flush()
    ui.render()
    assert.deepEqual(ui.calls, ['abc12345'])
    assert.equal(ui.timers.size, 0)
    ui.cleanup()
})

test('stored-token checking does not start a second authorization; unmount cancels opening timer', () => {
    const ui = splash({ status: 'checking' })
    assert.equal(ui.timers.size, 0)
    ui.setStatus('signedOut'); ui.render()
    assert.equal(ui.timers.size, 1)
    ui.cleanup()
    assert.equal(ui.timers.size, 0)
    assert.equal(ui.calls.length, 0)
})

test('cancelled automatic signing offers a retry with no editable fields and disables repeat clicks while pending', async () => {
    const pending = deferred()
    let attempts = 0
    const ui = splash({ search: '?ref=invite88', authorize: () => ++attempts === 1 ? Promise.reject({ code: 4001 }) : pending.promise })
    ui.start(); await flush()
    const button = ui.render().find((node) => node.type === 'button')
    assert.equal(button.props.children, '重新授权')
    button.props.onClick()
    assert.equal(ui.render().find(node => node.type === 'button').props.disabled, true)
    assert.equal(ui.render().find(node => node.type === 'loading-overlay').props.show, true)
    button.props.onClick()
    assert.ok(!ui.render().some(node => node.props.children === '已取消钱包授权，可再次尝试'))
    assert.deepEqual(ui.feedback, [['已取消钱包授权，可再次尝试', 'error']])
    assert.deepEqual(ui.calls, ['invite88', 'invite88'])
    pending.resolve(); await flush(); ui.cleanup()
})

test('authenticated splash returns to a safe business destination and rejects looping root or external redirect', () => {
    for (const [from, expected] of [['/assets', '/assets'], ['/', '/home'], ['/login?ref=x', '/home'], ['//evil.example', '/home']]) {
        const ui = splash({ status: 'authenticated', from })
        assert.equal(ui.render().find((node) => node.type === 'navigate').props.to, expected)
        assert.equal(ui.timers.size, 0)
        ui.cleanup()
    }
})

test('missing wallet environment shows actionable feedback and unlocks authorization retry', async () => {
    const text = '请使用钱包浏览器打开，或启用浏览器钱包扩展'
    const ui = splash({ authorize: () => Promise.reject(new Error(text)) })
    ui.start(); await flush()
    const nodes = ui.render()
    assert.deepEqual(ui.feedback, [[text, 'error']])
    assert.equal(nodes.find(node => node.type === 'loading-overlay').props.show, false)
    const retry = nodes.find(node => node.type === 'button')
    assert.equal(retry.props.children, '重新授权')
    assert.equal(retry.props.disabled, false)
    assert.ok(!nodes.some(node => node.props.children === text))
    retry.props.onClick(); await flush()
    assert.equal(ui.calls.length, 2)
    ui.cleanup()
})

test('unknown authorization failures remain generic and reported HTTP errors are not repeated', async () => {
    for (const reported of [false, true]) {
        const ui = splash({ reported, authorize: () => Promise.reject(new Error('private RPC diagnostics')) })
        ui.start(); await flush()
        assert.deepEqual(ui.feedback, reported ? [] : [['授权失败，请重试', 'error']])
        assert.equal(ui.render().find(node => node.type === 'loading-overlay').props.show, false)
        ui.cleanup()
    }
})
