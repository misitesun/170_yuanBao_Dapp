# Router

The app uses browser history through `AppBrowserRouter`. It accepts incoming URLs both with and without the configured `/h5` prefix, while internal route constants always stay prefix-free.

应用通过 `AppBrowserRouter` 使用 browser history。入口地址可带或不带 `/h5` 前缀；应用内部路由常量始终不带前缀。

Use `useAppNavigate()` inside React components and `buildRouteHref()` only when code outside React needs an href. Never prepend `/h5` manually.

React 组件内使用 `useAppNavigate()`；只有组件外代码需要链接时才使用 `buildRouteHref()`。不要手动拼接 `/h5`。

```tsx
import { ROUTE_PATH, useAppNavigate } from '@/router'

function Demo() {
    const { pushRoute, backRoute } = useAppNavigate()

    return (
        <>
            <button onClick={() => pushRoute(ROUTE_PATH.home)}>Go home</button>
            <button onClick={() => backRoute()}>Go back</button>
        </>
    )
}
```

The blank production route table intentionally contains only `/home`. Add confirmed routes in `routes.ts` and `AppRouter.tsx`. Component and style showcases are isolated under development-only `/showcase` routes.

空白模板的生产路由表有意只保留 `/home`。确认页面后再在 `routes.ts` 与 `AppRouter.tsx` 添加路由；组件和样式演示只存在于开发环境 `/showcase`。
