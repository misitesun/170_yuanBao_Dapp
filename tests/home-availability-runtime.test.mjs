import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('home actions only show unavailable feedback and carousel selection uses the supplied card names', () => {
    const states = [], feedback = []
    let cursor = 0
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        react: {
            useState: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial
                return [states[slot], (value) => { states[slot] = value }]
            },
            useRef: () => ({ current: null }),
            useEffect: () => {},
        },
        'react/jsx-runtime': { jsx, jsxs: jsx },
        'swiper/modules': { A11y: 'a11y' },
        'swiper/react': { Swiper: 'swiper', SwiperSlide: 'slide' },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
    }
    const exports = {}
    const { outputText } = ts.transpileModule(readFileSync('src/pages/main/home/HomePage.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    runInNewContext(outputText, { exports, require: (name) => {
        if (name.startsWith('@/assets/')) return { default: name }
        if (name.endsWith('.scss') || name.startsWith('swiper/css')) return {}
        assert.ok(name in modules, `unexpected navigation or IO boundary: ${name}`)
        return modules[name]
    } })
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(exports.HomePage())
        return nodes
    }
    const initial = render()
    assert.equal(initial.filter((node) => node.type === 'empty').length, 1)
    assert.equal(initial.find((node) => node.type === 'empty').props.showGap, false)
    assert.equal(initial.filter((node) => node.type === 'swiper').length, 1)
    assert.equal(initial.some((node) => node.props.className?.startsWith('home-page__pack-card')), false)
    for (const className of ['home-page__purchase', 'home-page__auction-button', 'home-page__pack-entry']) {
        render().find((node) => node.type === 'button' && node.props.className.includes(className)).props.onClick()
    }
    assert.deepEqual(feedback, Array(3).fill('暂未开放'))
    for (const [index, name] of ['Yuanbao Premium Card', 'Yuanbao Collection Card', 'Yuanbao Supreme Card'].entries()) {
        render().find((node) => node.type === 'swiper' && node.props.onRealIndexChange).props.onRealIndexChange({ realIndex: index })
        assert.equal(render().find((node) => node.type === 'h1').props.children, name)
        assert.equal(render().find((node) => node.props.className === 'home-page__amount').props.children, '--')
    }
})
