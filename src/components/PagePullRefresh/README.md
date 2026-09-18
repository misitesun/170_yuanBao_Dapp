# PagePullRefresh
# 页面级下拉刷新与上拉加载

`PagePullRefresh` is a mobile page container for authenticated business routes that need pull-to-refresh.
`PagePullRefresh` 是给已登录业务路由使用的移动端页面级下拉刷新容器。

Pages register their real refresh function through `usePageRefresh()`.
页面通过 `usePageRefresh()` 注册真实刷新函数。

Paged pages register their next-page function through `usePageLoadMore()`. The
container observes its bottom sentinel and runs only one load at a time. Existing
pages that do not register this hook render no load-more footer and keep their
original behavior.
分页页面通过 `usePageLoadMore()` 注册下一页加载函数。容器观察底部哨兵，同一时间只执行一次加载；未注册此 Hook 的已有页面不会渲染上拉区域，行为保持不变。

The initial page does not auto-load while the document remains at scroll position
zero. Loading is armed after the user scrolls, matching mobile pull-up behavior.
页面停留在顶部时不会自动请求下一页；用户发生滚动后才启用加载，符合移动端上拉交互。

The registered function should return `Promise<void>` when it loads API data, contract data or timers.
如果刷新函数会加载接口、合约或定时器数据，应返回 `Promise<void>`。

The refresh indicator settles only after the registered function finishes.
刷新图标会等注册函数执行完成后再收起。

The pull-refresh indicator uses a 134px outer frame, a 102px circular surface
and a 62px refresh icon. These visual dimensions do not change the 72px trigger
distance or refresh timing.
下拉刷新指示器使用 134px 外框、102px 圆形主体和 62px 刷新图标；这些视觉尺寸
不会改变 72px 触发距离或刷新时序。

```tsx
import { useCallback } from 'react'

import { usePageRefresh } from '@/components/PagePullRefresh'

export function DemoPage() {
    const refreshPageData = useCallback(async () => {
        await Promise.all([
            loadUserInfo(),
            loadList(),
        ])
    }, [])

    usePageRefresh(refreshPageData)

    return <section>...</section>
}
```

Disable refresh while a page is submitting a form or writing a contract.
页面正在提交表单或写合约时，可以临时禁用下拉刷新。

```tsx
usePageRefresh(refreshPageData, !submitting)
```

Register pagination with an explicit `hasMore` value. Resolve the returned promise
only after the next page has been applied to the screen.
注册分页时应明确传入 `hasMore`，并在下一页数据已经写入页面后再结束 Promise。

```tsx
usePageLoadMore(loadNextPage, {
    enabled: !submitting,
    hasMore,
})
```

Modern browsers use `IntersectionObserver`; older H5 hosts fall back to passive
window scroll and resize listeners.
现代浏览器使用 `IntersectionObserver`；旧版 H5 宿主会回退到被动的 window scroll 与 resize 监听。

When a fixed shared Tabbar is present, pass `bottomInset="tabbar"`. The load-more
footer then reserves the Tabbar height and the device safe area, so loading and
finished messages remain visible above the navigation.
页面存在固定公共 Tabbar 时传入 `bottomInset="tabbar"`。上拉加载区域会预留 Tabbar
高度和设备底部安全区，让加载中与没有更多提示始终显示在导航栏上方。

Do not wrap splash, login or other flow pages with this component.
不要把开屏页、登录页或其他流程页包进这个组件。
