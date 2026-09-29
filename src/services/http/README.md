# HTTP
请求模块。

`HTTP_HEADER` 统一请求头名称。元宝按开发者要求全局发送 `address: 当前实际连接钱包地址`，不依赖 Token：公开登录、公告以及会话恢复均采用此规则。`registerHttpWalletAddressProvider()` 返回通过 provider 被动查询、主动连接或钱包事件确认的当前地址；仅本地缓存 `WALLET_ADDRESS` 不可作为依据。切账号立即更新地址并清理旧 Token，断开后删除地址头，模块卸载取消注册。

Authorization 独立控制：`authentication: 'none'` 仅移除 Bearer，不移除当前地址；`authentication: 'bearer'` 用于 /users/my 会话验证。业务路由仍等待用户资料与钱包地址核对成功。没有真实连接地址时移除 address，不写空地址或旧缓存。

`lang` is added only when `APP_CONFIG.enableI18n` is enabled. Disabling i18n removes this header and fixes internal language state to `zh-Hans`.
只有开启 `APP_CONFIG.enableI18n` 时才会添加 `lang`。关闭多语言会移除此请求头，并将内部语言状态固定为 `zh-Hans`。

Register the project-owned 401 behavior with `registerHttpUnauthorizedHandler()`. The HTTP layer normalizes the error but does not import auth features or decide navigation.
通过 `registerHttpUnauthorizedHandler()` 注册项目自己的 401 处理逻辑。HTTP 层只负责标准化错误，不依赖鉴权 feature，也不决定页面跳转。

## Unified error feedback

Every rejected Axios response is normalized to `HttpError`. A non-empty plain-text response body is used verbatim after trimming; JSON `{ message }` and `{ error }` strings are also supported. The response interceptor reports the normalized error to the app-level `HttpErrorToast` before rejecting it, so requests expose the backend message even when their caller catches the Promise.

所有 Axios 失败响应都会统一转换为 `HttpError`。非空纯文本响应去除首尾空白后原样展示，同时支持 JSON 的 `{ message }` 与 `{ error }` 字符串。响应拦截器在继续抛出错误前将其发布给 App 根节点的 `HttpErrorToast`，因此请求即使在调用方捕获 Promise，也能显示后台错误。

Canceled requests are marked as handled but do not produce user feedback. Identical concurrent messages collapse into the currently visible notification. A `401` keeps the registered project callback behavior and also displays the backend message. Page-local Toast remains responsible for validation, success feedback and non-HTTP parsing errors; use `wasHttpErrorReported()` before showing a caught error locally when duplicate feedback is possible.

主动取消的请求会标记为已处理但不会提示；并发产生的相同错误只展示当前一条。`401` 保持已注册的项目回调行为，同时展示后台返回内容。页面自己的 Toast 继续负责校验、成功反馈与非 HTTP 的响应解析错误；捕获错误后若可能产生重复提示，应先通过 `wasHttpErrorReported()` 判断。

## 元宝鉴权模式

地址头与 Token 生命周期独立；401 仅在原请求 Authorization 仍等于当前 Token 时清理登录，保留实际连接地址。旧 Token 请求的迟到 401 不能退出新会话。测试覆盖所有请求模式、无 Token 地址、切换与断开、旧 401 隔离。
