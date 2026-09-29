import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function mountAnnouncements() {
    const navigation = []
    let params = {}
    const jsx = (type, props) => ({ type, props })
    const modules = {
        'react/jsx-runtime': { jsx, jsxs: jsx },
        'react-router': { useParams: () => params },
        'react-i18next': { useTranslation: () => ({ t: (text) => text }) },
        '@/components/Empty': { Empty: 'empty' },
        '@/components/Icon': { Icon: 'icon' },
        '@/components/SecondaryHeader': { SecondaryHeader: 'secondary-header' },
        '@/components/LanguageSwitch': { LanguageSwitch: 'language' },
        '@/shared/formatters/maskWalletAddress.ts': { maskWalletAddress: (value) => value },
        '@/stores/dapp/index.ts': { useDappStore: (selector) => selector({ walletAddress: '' }) },
        '../AppBrand/AppBrand.tsx': { AppBrand: 'brand' },
        '../MenuToggleIcon.tsx': { MenuToggleIcon: 'menu-icon' },
    }
    const cache = {}
    function load(path) {
        if (path in cache) return cache[path]
        const exports = {}
        const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
        })
        runInNewContext(outputText, { exports, require: (name) => {
            if (name.endsWith('.scss')) return {}
            if (name.startsWith('@/assets/')) return { default: name }
            if (name === './config.ts') return { APP_HOME_ROUTE_NAME: 'home' }
            if (name === './data' || name === '../announcements/data') return load('src/pages/main/announcements/data.ts')
            assert.ok(name in modules, `unexpected IO or wallet boundary: ${name}`)
            return modules[name]
        } })
        cache[path] = exports
        return exports
    }
    modules['@/router'] = {
        ROUTE_PATH: load('src/router/routes.ts').ROUTE_PATH,
        useAppNavigate: () => ({
            pushRoute: (path) => navigation.push(['push', path]),
            replaceRoute: (path) => navigation.push(['replace', path]),
        }),
    }
    function render(path, name, props) {
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            nodes.push(node)
            walk(node.props?.children)
            walk(node.props?.right)
        }
        walk(load(path)[name](props))
        return nodes
    }
    return {
        navigation,
        data: load('src/pages/main/announcements/data.ts').ANNOUNCEMENT_PREVIEWS,
        setId: (id) => { params = { id } },
        header: (props = {}) => render('src/pages/main/layout/HeaderBar/HeaderBar.tsx', 'HeaderBar', props),
        list: (props = {}) => render('src/pages/main/announcements/AnnouncementsPage.tsx', 'AnnouncementsPage', props),
        detail: (props = {}) => render('src/pages/main/announcement-detail/AnnouncementDetailPage.tsx', 'AnnouncementDetailPage', props),
    }
}

test('notification opens the announcement list while static header preview never navigates', () => {
    const ui = mountAnnouncements()
    ui.header().find((node) => node.type === 'button' && node.props['aria-label'] === '通知').props.onClick()
    assert.deepEqual(ui.navigation, [['push', '/announcements']])
    ui.header({ staticPreview: true }).find((node) => node.type === 'button' && node.props['aria-label'] === '通知').props.onClick()
    assert.equal(ui.navigation.length, 1)
})

