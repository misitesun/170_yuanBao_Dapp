import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('page pull refresh exposes a page-level refresh registration contract', async () => {
    const [component, context, style, entry, readme] = await Promise.all([
        readFile('src/components/PagePullRefresh/PagePullRefresh.tsx', 'utf8'),
        readFile('src/components/PagePullRefresh/context.ts', 'utf8'),
        readFile('src/components/PagePullRefresh/PagePullRefresh.scss', 'utf8'),
        readFile('src/components/PagePullRefresh/index.ts', 'utf8'),
        readFile('src/components/PagePullRefresh/README.md', 'utf8'),
    ])

    assert.match(component, /export function PagePullRefresh/)
    assert.match(component, /children:\s*ReactNode/)
    assert.match(component, /enabled\?: boolean/)
    assert.match(component, /bottomInset\?: 'none' \| 'tabbar'/)
    assert.match(component, /refreshHandlerRef/)
    assert.match(component, /await refreshHandler\(\)/)
    assert.match(component, /isRefreshingRef/)
    assert.match(component, /registerPageLoadMore/)
    assert.match(component, /IntersectionObserver/)
    assert.match(component, /LOAD_MORE_SCROLL_OFFSET/)
    assert.match(component, /hasUserScrolled/)
    assert.match(component, /isLoadingMoreRef/)
    assert.match(component, /没有更多了/)
    assert.match(component, /page-pull-refresh--tabbar-inset/)
    assert.match(component, /onTouchStart/)
    assert.match(component, /onTouchMove/)
    assert.match(component, /onTouchEnd/)
    assert.match(component, /Icon name="refresh"/)

    assert.match(context, /export type PageRefreshHandler = \(\) => Promise<void> \| void/)
    assert.match(context, /export function usePageRefresh/)
    assert.match(context, /registerPageRefresh\(onRefresh\)/)
    assert.match(context, /export function usePageLoadMore/)
    assert.match(context, /registerPageLoadMore\(onLoadMore/)

    assert.match(style, /\.page-pull-refresh\s*\{/)
    assert.match(style, /min-height:\s*100vh/)
    assert.match(style, /min-height:\s*100dvh/)
    assert.match(style, /overscroll-behavior-y:\s*contain/)
    assert.match(style, /&__indicator\s*\{[\s\S]*width:\s*134px;[\s\S]*height:\s*134px;/)
    assert.match(style, /&__icon-wrap\s*\{[\s\S]*width:\s*102px;[\s\S]*height:\s*102px;/)
    assert.match(style, /&--tabbar-inset &__load-more/)
    assert.match(style, /padding-bottom:\s*calc\(100px \+ env\(safe-area-inset-bottom\)\)/)
    assert.match(component, /page-pull-refresh__rotation flex-center size-62/)
    assert.match(component, /page-pull-refresh__spin flex-center size-62/)
    assert.match(component, /page-pull-refresh__icon size-62/)

    assert.match(entry, /export \{ PagePullRefresh \} from '\.\/PagePullRefresh\.tsx'/)
    assert.match(entry, /export \{ usePageRefresh \} from '\.\/context\.ts'/)
    assert.match(entry, /export \{ usePageLoadMore \} from '\.\/context\.ts'/)
    assert.match(readme, /Promise<void>/)
    assert.match(readme, /134px outer frame/)
    assert.match(readme, /102px circular surface/)
    assert.match(readme, /62px refresh icon/)
    assert.match(readme, /usePageRefresh\(refreshPageData/)
    assert.match(readme, /usePageLoadMore\(loadNextPage/)
})

test('authenticated business routes are wrapped by page pull refresh', async () => {
    const router = await readFile('src/router/AppRouter.tsx', 'utf8')

    assert.match(router, /import \{ PagePullRefresh \} from '@\/components\/PagePullRefresh'/)
    assert.match(router, /function PullRefreshRouteOutlet\(\)/)
    assert.match(router, /<PagePullRefresh bottomInset=\{DEFAULT_LAYOUT_MENU_TYPE === LAYOUT_MENU_TYPE\.tabbar \? 'tabbar' : 'none'\}>[\s\S]*<Outlet \/>[\s\S]*<\/PagePullRefresh>/)
    assert.match(
        router,
        /<Route element=\{<RequireAuthentication \/>\}>[\s\S]*<Route element=\{<PullRefreshRouteOutlet \/>\}>[\s\S]*<Route element=\{<MainLayout \/>\}>/,
    )
    assert.doesNotMatch(router, /<Route path=\{ROUTE_PATH\.root\} element=\{<PagePullRefresh>/)
    assert.doesNotMatch(router, /<Route path=\{ROUTE_PATH\.login\} element=\{<PagePullRefresh>/)
})
