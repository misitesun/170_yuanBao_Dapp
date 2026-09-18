# Router
路由模块。

The project always uses browser history mode.
项目固定使用浏览器 history 模式。

The app base path is controlled by `APP_CONFIG.routeBase`, and the current template value is `/h5/`.
应用基础路径由 `APP_CONFIG.routeBase` 控制，当前模板值为 `/h5/`。

The layout menu type is controlled by `APP_CONFIG.defaultLayoutMenuType`. `tabbar` and `sidebar` are mutually exclusive project modes.
layout 菜单类型由 `APP_CONFIG.defaultLayoutMenuType` 控制。`tabbar` 和 `sidebar` 是互斥的项目模式。

Use the navigation helpers inside React components.
在 React 组件内使用路由跳转辅助方法。

```tsx
import { ROUTE_PATH, useAppNavigate } from '../router/index.ts'

function Demo() {
    const { pushRoute, replaceRoute, backRoute } = useAppNavigate()

    return (
        <>
            <button onClick={() => pushRoute(ROUTE_PATH.home)}>Go home</button>
            <button onClick={() => replaceRoute(ROUTE_PATH.user)}>Replace with User</button>
            <button onClick={() => backRoute()}>Go back</button>
        </>
    )
}
```

Do not manually prepend `/h5` when calling `pushRoute(ROUTE_PATH.home)`.
调用 `pushRoute(ROUTE_PATH.home)` 时不要手动拼接 `/h5`。

`AppBrowserRouter` accepts URLs both with and without the `/h5` prefix.
`AppBrowserRouter` 同时兼容带 `/h5` 和不带 `/h5` 的访问路径。

This matches H5 deployments where `/`, `/ref/...` and `/h5/...` all return the same entry HTML without an HTTP redirect.
这用于适配服务端将 `/`、`/ref/...` 和 `/h5/...` 都直接返回同一份入口 HTML、但不做 HTTP 重定向的部署方式。

Inside the app, keep route paths prefix-free. `AppBrowserRouter` strips `/h5` before matching and adds `/h5` when React Router creates browser hrefs or navigates.

The user partner introduction is a second-level authenticated route at `/user/partner`; its development preview is `/preview/user-partner`.
The user team overview is a second-level authenticated route at `/user/team`; its development preview is `/preview/user-team`. It keeps local member search, pull refresh and mock load-more behavior.
The user extraction form is a second-level authenticated route at `/user/withdraw`; its development preview is `/preview/user-withdraw`. It keeps asset selection, chain selection, amount entry and submission feedback local until integration contracts are supplied.
The extraction records list is a second-level authenticated route at `/user/withdraw/records`; its development preview is `/preview/user-withdraw-records`. It keeps status tabs, record fixtures and pull refresh local until integration contracts are supplied.
The user recharge form is a second-level authenticated route at `/user/recharge`; its development preview is `/preview/user-recharge`. It keeps asset and chain selection, address copy, amount validation and confirmation feedback local until integration contracts are supplied.
应用内部路由仍保持不带前缀。`AppBrowserRouter` 会在匹配前剥离 `/h5`，并在 React Router 生成浏览器链接或跳转时补回 `/h5`。

Use `buildRouteHref` only when code outside React components needs to generate a link.
只有组件外代码需要生成链接时，才使用 `buildRouteHref`。

```ts
buildRouteHref(ROUTE_PATH.home) // /h5/home
```

The development-only `/preview/home` route displays the HU Chain static home with no authentication or wallet bootstrap. It is excluded from production routing.
开发环境 `/preview/home` 仅供首页静态验收，跳过钱包启动与登录；生产路由不包含该入口。

`/stake` is the authenticated static stake route. Development `/preview/stake` has the same local UI with no auth bootstrap; preview tabbar links connect home and stake.
质押静态路由为 /stake，开发预览为 /preview/stake；预览模式首页和质押可互相切换。

`/stake/orders` is the authenticated second-level stake order route. It keeps pull refresh and mock load-more behavior without the first-level header or tabbar. Development `/preview/stake-orders` exposes the same static order UI without auth bootstrap.
`/stake/orders` 是已登录的二级质押订单页，保留下拉刷新和 Mock 上拉分页，但不渲染一级 Header 与 Tabbar；开发预览为 `/preview/stake-orders`。

`/presale` is the authenticated static presale page. Development `/preview/presale` exposes the same carousel and tab interactions without wallet startup. Preview navigation connects home, stake and presale.
预售页复用公共布局，Tab 与 Swiper 双向联动；购买和订单按钮仅展示 Toast，不请求接口或交易。

`/presale/orders` is the authenticated second-level presale order route. It keeps pull refresh and mock load-more behavior without the first-level header or tabbar. Development `/preview/presale-orders` exposes the same static order list without auth bootstrap.
`/presale/orders` 是已登录的二级预售订单页，保留下拉刷新和 Mock 上拉分页，但不渲染一级 Header 与 Tabbar；开发预览为 `/preview/presale-orders`。

`/otc` is the authenticated static OTC home page. Development `/preview/otc`
uses the same swipeable asset cards, mock pagination, pull refresh and load-more
behavior without wallet startup. All OTC actions remain local Toast demos.
`/otc` 为已登录的 OTC 静态首页；开发预览 `/preview/otc` 跳过钱包启动，同时保留资产横滑、Mock 分页、下拉刷新和上拉加载。所有 OTC 操作仅显示本地 Toast。

`/otc/orders` is the authenticated second-level OTC order route. It switches between buy and sell fixtures, keeps pull refresh and mock load-more behavior, and omits the first-level header and tabbar. Development `/preview/otc-orders` exposes the same static page without auth bootstrap.
`/otc/orders` 是已登录的二级 OTC 订单页，支持挂买与挂卖 Tab、下拉刷新和 Mock 上拉分页，不渲染一级 Header 与 Tabbar；开发预览为 `/preview/otc-orders`。

`/otc/orders/buy/detail` is the authenticated static buy-order detail route. It reuses the secondary refresh shell and module-local order card. Development `/preview/otc-buy-order-detail` exposes the same page without auth bootstrap.
`/otc/orders/buy/detail` 是已登录的挂买订单详情页，复用二级刷新外壳和模块内订单卡；开发预览为 `/preview/otc-buy-order-detail`。

`/points/convert-power` is the authenticated static points-to-power flow opened from the points market popup. It omits the first-level header and tabbar, keeps the chart region empty, and submits no transaction. Development preview is `/preview/points-convert`.
`/points/convert-power` 是从积分行情弹窗进入的已登录静态兑换流程页，不展示一级 Header 和 Tabbar，蜡烛图区域留空且不提交交易；开发预览为 `/preview/points-convert`。
