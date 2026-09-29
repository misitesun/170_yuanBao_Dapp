import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime, deferred } from './helpers/yuanbao-runtime.mjs'
import { createListPagination } from '../src/pages/main/pagination/pagination.ts'

const NOTICE = { id: 1, title: '正式公告', content: '<p>公告正文</p>', updated_at: '2026-09-29 12:00:00' }
function mount(kind = 'list', initialId = '1') {
    const states = [], effects = [], requests = [], routes = [], errors = []
    let cursor = 0, params = { id: initialId }, language = 'zh-Hans', refresh, more, settings
    const jsx = (type, props) => ({ type, props })
    const react = {
        useCallback: (callback) => callback,
        useState: (init) => {
            const slot = cursor++
            if (!(slot in states)) states[slot] = typeof init === 'function' ? init() : init
            return [states[slot], (value) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }]
        },
        useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
        useEffect: (effect) => { if (effects.length < 2 && kind === 'list' || effects.length === 0) effects.push(effect) },
    }
    const load = runtime({
        react, 'react/jsx-runtime': { jsx, jsxs: jsx },
        'react-router': { useParams: () => params },
        'react-i18next': { useTranslation: () => ({ t: (key) => key, i18n: { language } }) },
        'src/services/http/index.ts': {
            request: (config) => { const request = deferred(); requests.push({ ...request, config }); return request.promise },
            wasHttpErrorReported: () => false,
        },
        'src/features/notices/html.ts': { noticeSummary: () => '公告正文' },
        'src/features/notices/content.tsx': { NoticeContent: 'notice-html' },
        'src/router': { ROUTE_PATH: { announcements: '/announcements' }, useAppNavigate: () => ({ pushRoute: (route) => routes.push(route), replaceRoute: (route) => routes.push(route) }) },
        'src/components/Empty': { Empty: 'empty' }, 'src/components/Icon': { Icon: 'icon' },
        'src/components/SecondaryHeader': { SecondaryHeader: 'secondary' },
        'src/components/DropletLoading': { DropletLoading: 'loading' },
        'src/components/Toast': { Toast: 'toast', useToast: () => ({ showToast: (...args) => errors.push(args) }) },
        'src/components/PagePullRefresh': { PagePullRefresh: 'refresh', usePageRefresh: (handler) => { refresh = handler }, usePageLoadMore: (handler, options) => { more = handler; settings = options } },
        'src/pages/main/pagination/pagination.ts': { createListPagination },
    })
    // SCSS is a build-time concern, and the runtime helper resolves only code modules.
    const path = kind === 'list' ? 'src/pages/main/announcements/AnnouncementsPage.tsx' : 'src/pages/main/announcement-detail/AnnouncementDetailPage.tsx'
    const component = load(path)[kind === 'list' ? 'AnnouncementsPage' : 'AnnouncementDetailPage']
    function render() {
        cursor = 0
        const nodes = []
        function walk(node) {
            if (Array.isArray(node)) { node.forEach(walk); return }
            if (!node || typeof node !== 'object') return
            if (typeof node.type === 'function') { walk(node.type(node.props)); return }
            nodes.push(node); walk(node.props?.children)
        }
        walk(component())
        return nodes
    }
    render()
    const cleanups = effects.map((effect) => effect())
    return { render, requests, routes, errors, refresh: () => refresh(), more: () => more(), settings: () => settings,
        cleanup: () => cleanups.forEach((cleanup) => cleanup?.()), setId: (id) => { params = { id } }, }
}
const flush = () => new Promise(setImmediate)

test('public announcement list fetches real page one, links numeric ids and waits for refresh', async () => {
    const ui = mount()
    assert.equal(ui.requests[0].config.url, '/api/notices')
    assert.equal(ui.requests[0].config.authentication, 'none')
    assert.equal(ui.settings().hasMore, false)
    assert.ok(ui.render().some((node) => node.type === 'loading'))
    ui.requests[0].resolve({ notices: [NOTICE] })
    await flush()
    const card = ui.render().find((node) => node.type === 'button')
    card.props.onClick()
    assert.deepEqual(ui.routes, ['/announcements/1'])
    assert.equal(ui.settings().hasMore, false)
    let completed = false
    const refresh = ui.refresh().then(() => { completed = true })
    await Promise.resolve()
    assert.equal(completed, false)
    ui.requests[1].resolve({ notices: [] })
    await refresh
    assert.equal(ui.render().find((node) => node.type === 'empty').props.text, '暂无公告')
    assert.equal(ui.settings().showNoMore, false)
    ui.cleanup()
})

test('detail renders remote HTML through safe content component and invalid ids never call the API', async () => {
    const ui = mount('detail')
    assert.equal(ui.requests[0].config.url, '/api/notices/1')
    ui.requests[0].resolve(NOTICE)
    await flush()
    const nodes = ui.render()
    assert.equal(nodes.find((node) => node.type === 'h1').props.children, '正式公告')
    assert.equal(nodes.find((node) => node.type === 'notice-html').props.html, '<p>公告正文</p>')
    assert.equal(nodes.some((node) => node.props.dangerouslySetInnerHTML), false)
    ui.cleanup()
    for (const id of ['welcome', '0', '-1', null, '999999999999999999999999']) {
        const invalid = mount('detail', id)
        assert.equal(invalid.requests.length, 0)
        invalid.cleanup()
    }
})

test('unmounted detail aborts request and cannot render a late response', async () => {
    const ui = mount('detail')
    ui.cleanup()
    assert.equal(ui.requests[0].config.signal.aborted, true)
    ui.requests[0].resolve(NOTICE)
    await flush()
    assert.equal(ui.render().some((node) => node.type === 'article'), false)
})

test('HTML renderer drops active elements, event handlers and unsupported attributes, retaining readable formatting', () => {
    class FakeElement {
        nodeType = 1
        constructor(tag, attributes = {}, children = []) { this.tagName = tag.toUpperCase(); this.attributes = attributes; this.childNodes = children }
        getAttribute(key) { return this.attributes[key] ?? null }
        remove() { this.removed = true }
    }
    const text = (value) => ({ nodeType: 3, textContent: value })
    const script = new FakeElement('script', {}, [text('alert(1)')])
    const p = new FakeElement('p', { onclick: 'alert(1)', style: 'position:fixed' }, [text('正文')])
    const a = new FakeElement('a', { href: 'javascript:alert(1)', onclick: 'alert(2)' }, [text('链接')])
    const img = new FakeElement('img', { src: '/image.png', onerror: 'alert(3)' })
    const body = { get childNodes() { return [script, p, a, img].filter((node) => !node.removed) } }
    class FakeParser { parseFromString() { return { body, querySelectorAll: (tag) => tag === 'script' ? [script] : [] } } }
    const jsx = (type, props) => ({ type, props })
    const load = runtime({ react: { createElement: (type, props, children) => ({ type, props: { ...props, children } }) },
        'react/jsx-runtime': { jsx, jsxs: jsx } }, { DOMParser: FakeParser, Element: FakeElement })
    const node = load('src/features/notices/content.tsx').NoticeContent({ html: 'server HTML' })
    const children = node.props.children
    assert.equal(children.some((node) => node?.type === 'script'), false)
    assert.equal(children[0].type, 'p')
    assert.equal(children[0].props.onclick, undefined)
    assert.equal(children[0].props.style, undefined)
    assert.equal(children[1].props.href, undefined)
    assert.equal(children[2].props.src, 'https://localhost/image.png')
    assert.equal(children[2].props.onerror, undefined)
})
