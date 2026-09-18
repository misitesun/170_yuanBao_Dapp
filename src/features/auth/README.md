# Auth

Authentication business module.

认证业务模块。

The local `TOKEN` is the single source of truth for authentication; the `user` Store is only its React-facing mirror for pages and route guards.

登录态的唯一依据是本地 `TOKEN`；`user` Store 只同步给 React 页面和路由守卫使用。

## Entry flow

The splash page calls `startAuthFlow()` to make the startup decision.

开屏页调用 `startAuthFlow()` 统一处理启动分流。

- `dapp` waits twice for an injected wallet provider, five seconds per attempt. If both attempts fail, the splash page remains visible and asks the user to open the DApp in a wallet browser.
- `dapp` 会连续等待两次注入钱包 Provider，每次五秒；两次都失败时，保留开屏页并提示用户使用钱包环境打开。
- `hybrid` waits once for a wallet provider, then falls back to account password login when no provider is found.
- `hybrid` 只等待一次钱包 Provider，未检测到时降级为账号密码登录。
- `account` never detects a wallet provider or shows a loading icon; it waits for the splash animation and then follows the token state.
- `account` 不检测钱包 Provider，也不显示 loading；等待开屏动画后按 Token 状态继续。
- Flutter hosts without `window.__EXPECT_DAPP_PROVIDER__` skip the delayed detection. When Flutter sets this marker before React starts, the same delayed wallet detection is used.
- 未设置 `window.__EXPECT_DAPP_PROVIDER__` 的 Flutter 宿主会跳过延迟检测；Flutter 在 React 启动前设置该标识时，则使用相同的延迟钱包检测。
- Existing token with a detected provider: restore the wallet session, validate the configured chain, then enter home.
- 已有 Token 且检测到 Provider：恢复钱包会话、校验目标网络，再进入首页。
- Existing token in DApp modes: validate the current wallet account before loading authenticated APIs such as `/api/users/my`.
- DApp 模式已有 Token：先校验当前钱包账号，再加载 `/api/users/my` 等鉴权接口。
- If the cached wallet address no longer matches the current wallet during splash startup, clear stale auth state and start DApp login again in the same flow.
- 开屏启动时如果缓存钱包地址与当前钱包不一致，清理旧登录态并在同一轮流程里重新发起 DApp 登录。
- No token with a detected provider: connect the wallet, sign, then call the address-login API.
- 没有 Token 且检测到 Provider：连接钱包、签名并请求地址登录接口。
- In `hybrid` mode, Flutter or a regular browser without an injected provider opens the email/password login page.
- 在 `hybrid` 模式中，Flutter 或普通浏览器未检测到注入 Provider 时跳转账号密码登录页。

## Unified lifecycle methods

Both login methods call `completeLogin(token)` after the API succeeds; it stores the token, syncs the Store, then replaces the route with home.

两个登录方式在接口成功后都调用 `completeLogin(token)`；它会保存 Token、同步 Store，并替换跳转首页。

Every logout path calls `logout()`; it runs registered session cleanups, clears the token, syncs the Store, then replaces the route with splash.

所有退出场景都调用 `logout()`；它会停止已注册的登录态清理项、清除 Token、同步 Store，并替换跳转开屏页。

`clearAuthSession()` performs the same cleanup without replacing the route. Use it when startup needs to clear a stale token and immediately retry DApp login.

`clearAuthSession()` 会执行同样的清理但不替换路由。启动流程需要清旧 Token 并立即重试 DApp 登录时使用它。

In an injected-wallet environment, auth cleanup also clears the cached wallet address. HTTP requests only send the `Address` header in wallet environments.

在注入钱包环境中，登录态清理还会清除钱包地址缓存。请求只在钱包环境中发送 `Address` 请求头。

When a project needs extra post-login or post-logout work, add it to these two methods instead of duplicating it in pages, HTTP interceptors, or wallet listeners.

以后项目有额外的登录后或退出后逻辑，直接补在这两个方法中，不要分散写在页面、请求拦截器或钱包监听里。

## DApp listener rules

Account and chain listeners are created only after a DApp session is authenticated or restored, and every creation removes the old pair first.

DApp 认证成功或恢复已有 DApp 会话后，才会创建账户和网络监听；每次创建前都会先移除旧监听。

When application code switches to the configured chain, the matching `chainChanged` event is marked as controlled and does not log out; a user account or chain change calls unified `logout()`.

代码主动切到配置网络时会标记为受控切链，匹配的 `chainChanged` 事件不会触发退出；用户主动切账户或切网络会走统一 `logout()`。

If the user changes account or chain while a signature login request is in flight, its stale response is invalidated and cannot sign in the old account.

签名登录请求期间若用户切换账户或网络，旧请求的返回会被作废，不能把旧账户重新登录。
