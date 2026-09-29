import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Execute the real component's effects and event handlers without a DOM package.
function mountRefresh({ observer = true } = {}) {
    const hooks = [], effects = [], observers = []
    const listeners = new Map()
    let index = 0
    const slot = (initial) => {
        const current = index++
        if (!hooks[current]) hooks[current] = initial()
        return hooks[current]
    }
    const changed = (previous, next) => !previous || next.some((value, i) => value !== previous[i])
    const react = {
        useState(initial) {
            const state = slot(() => ({ value: typeof initial === 'function' ? initial() : initial }))
            state.set ??= (next) => { state.value = typeof next === 'function' ? next(state.value) : next }
            return [state.value, state.set]
        },
        useRef(initial) { return slot(() => ({ current: initial })) },
        useMemo(factory, deps) {
            const memo = slot(() => ({}))
            if (changed(memo.deps, deps)) { memo.value = factory(); memo.deps = deps }
            return memo.value
        },
        useEffect(effect, deps) {
            const state = slot(() => ({}))
            if (changed(state.deps, deps)) {
                state.deps = deps
                effects.push(() => { state.cleanup?.(); state.cleanup = effect() })
            }
        },
    }
    react.useCallback = (callback, deps) => react.useMemo(() => callback, deps)
    const window = {
        scrollY: 900, innerHeight: 800, setTimeout, clearTimeout,
        addEventListener(name, listener) {
            if (!listeners.has(name)) listeners.set(name, new Set())
            listeners.get(name).add(listener)
        },
        removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    }
    if (observer) window.IntersectionObserver = class {
        constructor(callback) { this.callback = callback; observers.push(this) }
        observe() {}
        disconnect() { this.disconnected = true }
    }
    const document = {
        activeElement: null, visibilityState: 'visible',
        scrollingElement: { scrollTop: 0 }, documentElement: { scrollHeight: 1600 },
        addEventListener() {}, removeEventListener() {},
    }
    const element = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        react, 'react/jsx-runtime': { jsx: element, jsxs: element },
        '@/components/Icon': { Icon: 'icon' },
        '@/components/DropletLoading': { DropletLoading: 'droplet' },
        './context.ts': { PageRefreshContext: { Provider: 'provider' } },
        './PagePullRefresh.scss': {},
    }
    const source = ts.transpileModule(readFileSync('src/components/PagePullRefresh/PagePullRefresh.tsx', 'utf8'), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports = {}
    runInNewContext(source, { exports, require: (name) => modules[name], window, document, Date, HTMLElement: class {}, Node: class {} })
    function render() {
        index = 0
        const tree = exports.PagePullRefresh({ children: null })
        const root = tree.props.children
        for (const child of root.props.children) {
            if (child?.props?.ref) child.props.ref.current = { style: { setProperty() {} } }
        }
        while (effects.length) effects.shift()()
        return { context: tree.props.value, root }
    }
    return {
        render, window, observers,
        emit(name) { for (const listener of [...(listeners.get(name) ?? [])]) listener() },
        dispose() { for (const hook of hooks) hook.cleanup?.() },
    }
}

for (const observer of [true, false]) {
    test(`${observer ? 'observer' : 'fallback'} waits for a new scroll on every registration and blocks duplicate loads`, async () => {
        const mounted = mountRefresh({ observer })
        const { context } = mounted.render()
        let firstCalls = 0, resolveLoad
        const release = context.registerPageLoadMore(() => {
            firstCalls += 1
            return new Promise((resolve) => { resolveLoad = resolve })
        }, { enabled: true, hasMore: true, loadingIndicator: 'droplet', showNoMore: true })
        mounted.render()
        if (observer) mounted.observers.at(-1).callback([{ isIntersecting: true }])
        else mounted.emit('resize')
        assert.equal(firstCalls, 0, 'historical scrollY must not arm pagination')
        mounted.emit('scroll')
        mounted.emit('scroll')
        assert.equal(firstCalls, 1)
        resolveLoad()
        await new Promise(setImmediate)
        mounted.render()

        release()
        let nextCalls = 0
        context.registerPageLoadMore(async () => { nextCalls += 1 }, { enabled: true, hasMore: true, loadingIndicator: 'droplet', showNoMore: false })
        mounted.render()
        if (observer) {
            assert.equal(mounted.observers[0].disconnected, true)
            mounted.observers.at(-1).callback([{ isIntersecting: true }])
        } else mounted.emit('resize')
        assert.equal(nextCalls, 0, 'replacement registrations must start disarmed')
        mounted.emit('scroll')
        assert.equal(nextCalls, 1)
        await new Promise(setImmediate)
        mounted.dispose()
    })
}

test('pull refresh runs once and keeps refreshing until registered reload work completes', async () => {
    const mounted = mountRefresh()
    const { context } = mounted.render()
    let calls = 0, finish
    context.registerPageRefresh(() => {
        calls += 1
        return new Promise((resolve) => { finish = resolve })
    })
    mounted.window.scrollY = 0
    let { root } = mounted.render()
    root.props.onTouchStart({ target: null, touches: [{ clientY: 100 }] })
    root.props.onTouchMove({ touches: [{ clientY: 220 }] })
    root.props.onTouchEnd()
    root.props.onTouchEnd()
    assert.equal(calls, 1)
    root = mounted.render().root
    assert.match(root.props.className, /--refreshing/)
    await new Promise((resolve) => setTimeout(resolve, 460))
    assert.match(mounted.render().root.props.className, /--refreshing/)
    finish()
    await new Promise(setImmediate)
    assert.match(mounted.render().root.props.className, /--settling/)
    mounted.dispose()
})
