# Compatibility-sensitive behavior
# 兼容性敏感行为

This file records runtime behavior that is known to differ across browser, wallet, host, or H5 deployment environments. Do not add speculative entries; each entry needs observed evidence, a regression test, or a reproducible manual verification.
本文记录已知会随浏览器、钱包、宿主或 H5 部署环境变化的运行时行为。不要添加猜测性条目；每项都需要已观察到的证据、回归测试或可复现的人工验证。

## Current contracts
## 当前契约

### Delayed injected wallet provider

Wallet injection can arrive after the page starts. `src/services/dapp/provider.ts` uses `@metamask/detect-provider` with a bounded optional wait; the project authentication or connect flow decides when that wait is required. Preserve this capability unless a tested wallet-compatibility change supersedes it.
钱包注入可能晚于页面启动。`src/services/dapp/provider.ts` 用 `@metamask/detect-provider` 提供有上限的可选等待；真实项目的鉴权或连接流程决定何时启用。除非有测试过的钱包兼容性改动替代它，否则保留该能力。

### Flutter host bridge

Flutter bridge calls are guarded by runtime availability checks. Native message names and upload protocols are project contracts and are not built into the generic upload service.
Flutter Bridge 调用受运行时可用性检查保护。原生消息名和上传协议属于项目契约，不内置在通用上传服务中。

### EIP-7702 user-context reads

An `eth_call` without `account` or `from` can execute under an empty-address context for a delegated account. When a read derives user assets, orders, rewards, eligibility, or permissions through `msg.sender`, its business wrapper must pass the connected address. Public configuration, market data, and token metadata remain account-free.
委托账户的 `eth_call` 若没有 `account` 或 `from`，可能在空地址上下文执行。读取若通过 `msg.sender` 推导用户资产、订单、收益、资格或权限，业务封装必须传入当前钱包地址。公共配置、行情和 Token 元数据仍应不传账户。

### `/h5` history fallback

Some deployments serve the same HTML for root paths and `/h5/...` without redirecting. `AppBrowserRouter` must accept browser URLs with and without `/h5`, while internal route paths stay prefix-free.
部分部署会对根路径与 `/h5/...` 返回同一份 HTML 而不重定向。`AppBrowserRouter` 必须同时接受带和不带 `/h5` 的浏览器路径，内部路由路径保持无前缀。

### Infinite-list observation fallback

`PagePullRefresh` uses `IntersectionObserver` to load the next page when its bottom sentinel approaches the viewport. H5 hosts without that API use passive window scroll and resize listeners with the same 160px prefetch distance. Regression coverage checks both paths remain present; mobile browser QA verifies one request runs at a time and the finished state stops further loads.
`PagePullRefresh` 默认通过 `IntersectionObserver` 在底部哨兵接近视口时加载下一页。不支持该 API 的 H5 宿主使用被动 window scroll 与 resize 监听，并保持相同的 160px 预加载距离。回归测试覆盖两条路径，移动端浏览器验收确保每次只执行一次请求，结束状态不再加载。

When a future route combines `PagePullRefresh` with the fixed Tabbar, pass `bottomInset="tabbar"` to reserve the 100px navigation height and `safe-area-inset-bottom` inside the load-more footer.
未来路由将 `PagePullRefresh` 与固定 Tabbar 组合时，应传入 `bottomInset="tabbar"`，在上拉加载区域预留 100px 导航高度与 `safe-area-inset-bottom`。

## Adding an entry
## 新增条目

Record the affected runtime, trigger, observed behavior, source file, chosen workaround, validation method, and removal condition. Add a regression test when practical; otherwise record precise manual reproduction steps next to the entry.
记录受影响的运行时、触发条件、观察到的行为、源码位置、选定的规避方案、验证方式和移除条件。可行时增加回归测试；否则在条目旁记录精确的人工复现步骤。
