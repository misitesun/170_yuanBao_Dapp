# HTTP
请求模块。

`HTTP_HEADER` centralizes generic request header names. `Authorization` is sent only when a local token exists.
`HTTP_HEADER` 统一存放通用请求头名称。只有本地 Token 存在时才发送 `Authorization`。

Wallet-address headers are backend-contract facts and are not injected by the base client. Add them in a project interceptor only after the PHP API contract confirms the name and semantics.
钱包地址请求头属于后端契约事实，基础请求客户端不会自动注入。只有 PHP 接口契约确认名称与语义后，才能在项目拦截器中添加。

`lang` is added only when `APP_CONFIG.enableI18n` is enabled. Disabling i18n removes this header and fixes internal language state to `zh-Hans`.
只有开启 `APP_CONFIG.enableI18n` 时才会添加 `lang`。关闭多语言会移除此请求头，并将内部语言状态固定为 `zh-Hans`。

Register the project-owned 401 behavior with `registerHttpUnauthorizedHandler()`. The HTTP layer normalizes the error but does not import auth features or decide navigation.
通过 `registerHttpUnauthorizedHandler()` 注册项目自己的 401 处理逻辑。HTTP 层只负责标准化错误，不依赖鉴权 feature，也不决定页面跳转。
