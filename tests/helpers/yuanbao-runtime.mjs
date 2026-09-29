import { i18nRuntime } from './i18n-runtime.mjs'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Compile actual TypeScript modules. Only explicit external IO boundaries are substituted.
export function runtime(mocks = {}, globals = {}) {
    const cache = new Map()
    function load(path) {
        path = resolve(path)
        if (cache.has(path)) return cache.get(path)
        const relative = path.replace(`${process.cwd()}/`, '')
        if (Object.hasOwn(mocks, relative)) return mocks[relative]
        const exports = {}
        cache.set(path, exports)
        const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
        })
        runInNewContext(outputText, { exports, console, URL, Date, Promise, AbortController, ...globals,
            require: (name) => {
                if (Object.hasOwn(mocks, name)) return mocks[name]
                if (name === 'react-i18next') return i18nRuntime
                if (name.endsWith('.scss')) return {}
                if (name.startsWith('@/')) return load(`src/${name.slice(2)}`)
                if (name.startsWith('.')) return load(resolve(dirname(path), name))
                throw new Error(`Unexpected boundary: ${name}`)
            },
        })
        return exports
    }
    return load
}
export const ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7'
export const userWire = (changes = {}) => ({ id: 1, address: ADDRESS, referral_code: 'abc12345', team_count: 0,
    created_at: '2026-09-29 10:00:00', balance_usdt: '9007199254740993.123456', balance_energy: '0', balance_bao: '1.000000', level: null, ...changes })
export const deferred = () => {
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    return { promise, resolve, reject }
}
