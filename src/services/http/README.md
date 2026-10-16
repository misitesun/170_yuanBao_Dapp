# HTTP
请求模块。

`HTTP_HEADER` 统一请求头名称。元宝普通请求全局发送 `address: 当前实际连接钱包地址`，不依赖 Token；`registerHttpWalletAddressProvider()` 返回通过 provider 被动查询、主动连接或钱包事件确认的当前地址，仅本地缓存 `WALLET_ADDRESS` 不可作为依据。切账号立即更新地址并清理旧 Token，断开后普通请求删除地址头，模块卸载取消注册。只有登录 POST 显式省略 address 头，仍保留下述本轮地址校验。

Authorization 独立控制：`authentication: 'none'` 本身仅移除 Bearer；地址头是否省略由独立选项控制。`authentication: 'bearer'` 用于 /users/my 会话验证。业务路由仍等待用户资料与钱包地址核对成功。没有真实连接地址时移除 address，不写空地址或旧缓存。

`lang` is added only when `APP_CONFIG.enableI18n` is enabled. Disabling i18n removes this header and fixes internal language state to `zh-Hans`.
只有开启 `APP_CONFIG.enableI18n` 时才会添加 `lang`。关闭多语言会移除此请求头，并将内部语言状态固定为 `zh-Hans`。

Register the project-owned 401 behavior with `registerHttpUnauthorizedHandler()`. The HTTP layer normalizes the error but does not import auth features or decide navigation.
通过 `registerHttpUnauthorizedHandler()` 注册项目自己的 401 处理逻辑。HTTP 层只负责标准化错误，不依赖鉴权 feature，也不决定页面跳转。

## Unified error feedback

Every rejected Axios response is normalized to `HttpError`. A non-empty plain-text response body is used verbatim after trimming; JSON `{ message }` and `{ error }` strings are also supported. The response interceptor reports the normalized error to the app-level `HttpErrorToast` before rejecting it, so requests expose the backend message even when their caller catches the Promise.

所有 Axios 失败响应都会统一转换为 `HttpError`。非空纯文本响应去除首尾空白后原样展示，同时支持 JSON 的 `{ message }` 与 `{ error }` 字符串。响应拦截器在继续抛出错误前将其发布给 App 根节点的 `HttpErrorToast`，因此请求即使在调用方捕获 Promise，也能显示后台错误。

Canceled requests are marked as handled but do not produce user feedback. Identical concurrent messages collapse into the currently visible notification. A `401` keeps the registered project callback behavior and also displays the backend message. Page-local Toast remains responsible for validation, success feedback and non-HTTP parsing errors; use `wasHttpErrorReported()` before showing a caught error locally when duplicate feedback is possible.

主动取消的请求会标记为已处理但不会提示；并发产生的相同错误只展示当前一条。`401` 保持已注册的项目回调行为，同时展示后台返回内容。页面自己的 Toast 继续负责校验、成功反馈与非 HTTP 的响应解析错误；捕获错误后若可能产生重复提示，应先通过 `wasHttpErrorReported()` 判断。

## 单次登录地址快照

请求选项 `walletAddress?: string` 表示已由业务层确认的本轮签名地址，不是任意读取缓存后的替代值。`requestWalletLogin(body, signal?)` 将 `body.address` 同时写入该选项，并传入本轮 `signal`、`authentication: 'none'` 与 `walletAddressHeader: 'omit'`。拦截器仍用快照做发送前实时地址校验，但明确删除该 POST 的 address 头，包括旧默认头和调用方传入的头；不读取业务 body。

`walletAddressHeader?: 'omit'` 仅控制 address 头的省略，不关闭 `walletAddress` 校验、signal 或 Bearer 策略。本项目只有 `POST /api/auth/login` 设置它；GET /api/users/my 等请求未设置该选项，继续用显式快照或实时地址写 header。未提供快照的普通请求继续使用实时地址。

已注册实时地址提供者时，拦截器先按忽略大小写的方式核对快照与当前地址；地址改变或断开即作为取消拒绝，旧请求不进入网络 adapter，不能改用新地址发送旧签名。换号后，feature 的 AbortController 还会取消已发出的登录及资料验证；generation 保留为迟到结果的第二道隔离。

此取消路径沿现有 HTTP 取消语义处理，不显示失败 Toast，也不能让旧请求的 401 清理新 Token。客户端取消不保证后端尚未处理已经收到的请求。详见 [登录地址一致性与取消](../../../docs/php-api-contracts.md#login-address-consistency-and-cancellation)。

## 元宝鉴权模式

地址头与 Token 生命周期独立；401 仅在原请求 Authorization 仍等于当前 Token 时清理登录，保留实际连接地址。旧 Token 请求的迟到 401 不能退出新会话。测试覆盖所有请求模式、无 Token 地址、切换与断开、旧 401 隔离。
