import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function mountSidebar(staticPreview = false) {
    const states = [], feedback = []
    let cursor = 0, closeCount = 0
    const jsx = (type, props) => ({ type, props })
    const modules = {
        react: {
            useState: (initial) => {
                const slot = cursor++
                if (!(slot in states)) states[slot] = initial
                return [states[slot], (value) => { states[slot] = value }]
            },
            useEffect: () => {},
        },
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        'react-router': { NavLink: 'link' },
        'react-i18next': { useTranslation: () => ({ t: (text) => text }) },
        '@/components/Popup': { Popup: 'popup' },
        '@/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (text) => feedback.push(text) }) },
        '@/shared/clipboard/copyTextToClipboard.ts': { copyTextToClipboard: async () => true },
        '@/shared/formatters/maskWalletAddress.ts': { maskWalletAddress: () => '--' },
        '@/stores/dapp/index.ts': { useDappStore: (selector) => selector({ walletAddress: '' }) },
        './WalletOrbitBorder.tsx': { WalletOrbitBorder: 'orbit' },
        '@/router/routes': { ROUTE_PATH: { home: '/home', auction: '/auction', cardPack: '/card-pack', assets: '/assets', team: '/team', ranking: '/ranking' } },
    }
    function compile(path) {
        const exports = {}
        const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
        })
        runInNewContext(outputText, { exports, require: (name) => {
            if (name.startsWith('@/assets/')) return { default: name }
            assert.ok(name in modules, `unexpected boundary: ${name}`)
            return modules[name]
        } })
        return exports
    }
    modules['./config'] = compile('src/pages/main/config.ts')
    modules['../sidebar-config'] = compile('src/pages/main/sidebar-config.ts')
    const { SidebarMenu } = compile('src/pages/main/layout/SidebarMenu.tsx')
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
        }
        walk(SidebarMenu({ show: true, staticPreview, onClose: () => closeCount++ }))
        return nodes
    }
    return { render, feedback, closeCount: () => closeCount }
}

test('all sidebar page links navigate and close the sidebar', () => {
    const sidebar = mountSidebar()
    for (const path of ['/home', '/auction', '/card-pack', '/assets', '/team', '/ranking']) {
        let prevented = false
        sidebar.render().find((node) => node.type === 'link' && node.props.to === path).props.onClick({ preventDefault: () => { prevented = true } })
        assert.equal(prevented, false)
    }
    assert.equal(sidebar.closeCount(), 6)
    assert.deepEqual(sidebar.feedback, [])
})

test('static sidebar preview selects every entry without navigating', () => {
    const sidebar = mountSidebar(true)
    const buttons = () => sidebar.render().filter((node) => node.type === 'button' && node.props['aria-pressed'] !== undefined)
    for (let index = 0; index < 6; index++) {
        buttons()[index].props.onClick()
        assert.equal(buttons()[index].props['aria-pressed'], true)
        assert.equal(buttons().filter((node) => node.props['aria-pressed']).length, 1)
    }
    assert.deepEqual(sidebar.feedback, [])
    assert.equal(sidebar.closeCount(), 0)
})
