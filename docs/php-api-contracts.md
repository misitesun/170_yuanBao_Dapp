# PHP API contract boundary
# PHP 接口契约边界

PHP being dynamically typed does not reduce the need for strict TypeScript. It increases the importance of treating every network response as untrusted data until the frontend verifies the documented shape.
PHP 是动态类型语言，并不会降低 TypeScript 严格检查的必要性；反而更需要把每个网络响应视为不可信数据，直到前端确认其符合已文档化的结构。

## TypeScript baseline
## TypeScript 基线

Both application and Vite TypeScript configurations enable `strict` and `noImplicitReturns`. These flags protect the frontend implementation, but they cannot prove what a PHP server actually returned at runtime.
应用和 Vite 的 TypeScript 配置都开启 `strict` 与 `noImplicitReturns`。这些标志保护前端实现，但不能证明 PHP 服务在运行时实际返回了什么。

This baseline is deliberately incremental. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `noPropertyAccessFromIndexSignature` remain a separate, module-by-module migration after their current callers have explicit behavior tests. Do not switch them on as a shortcut that forces unrelated business rewrites.
该基线刻意采用渐进式。`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess` 和 `noPropertyAccessFromIndexSignature` 保留为单独的、按模块推进的迁移，前提是其当前调用方已有明确的行为测试。不要把它们当成迫使无关业务重写的快捷开关。

`request<T>()` is a transport convenience, not a runtime parser. A type assertion, `as T`, or a generic parameter must never be used as the only evidence that external JSON matches a domain type.
`request<T>()` 是传输便利方法，而不是运行时解析器。类型断言、`as T` 或泛型参数不能作为外部 JSON 符合领域类型的唯一证据。

## Required API Markdown contract
## 必需的接口 Markdown 契约

Before integrating a real endpoint, obtain a Markdown contract that states:
在对接真实接口前，必须取得明确以下内容的 Markdown 契约：

- Endpoint, HTTP method, authentication and required headers.
- Request field names, types, optionality, defaults, and serialization format.
- Success envelope and payload shape, including nullability and pagination.
- Error envelope, business code semantics, retry behavior, and unauthorized behavior.
- Enum values, timestamp/time-zone format, and whether numeric values arrive as JSON numbers or strings.
- Amount, price, balance, and token-unit representation, especially decimal precision and whether lossless strings are required.

- 接口地址、HTTP 方法、鉴权和必需请求头。
- 请求字段名、类型、可选性、默认值和序列化格式。
- 成功包裹层和 payload 结构，包括可空性与分页。
- 错误包裹层、业务码语义、重试行为和未授权行为。
- 枚举值、时间戳/时区格式，以及数值以 JSON number 还是 string 返回。
- 金额、价格、余额和 Token 单位的表示方式，特别是小数精度与是否必须使用无损字符串。

## Wallet authentication and signed transaction data
## 钱包鉴权与签名交易数据

When an endpoint participates in wallet login or a contract write, its Markdown must additionally state the current authentication protocol: challenge or message source, nonce or timestamp semantics, expiry, chain/domain binding when applicable, signature encoding, and the exact request headers or fields. A timestamp-signing flow inherited from a legacy DApp or starter adapter is not a reusable default; it is implemented only when the current PHP contract requires it.
接口参与钱包登录或写合约时，其 Markdown 还必须说明当前鉴权协议：challenge 或消息来源、nonce 或时间戳语义、有效期、适用时的链/域绑定、签名编码，以及确切的请求头或字段。继承自旧 DApp 或启动适配器的时间戳签名不是可复用默认值；只有当前 PHP 契约要求时才实现。

If the backend returns a server-signed transaction payload, document every raw field, unit, argument order, expiry/deadline, signature, idempotency or order identifier, and whether the frontend must wait for a receipt or indexing result. The frontend may validate the documented shape, but must pass signed raw contract arguments through unchanged rather than converting them to numbers or rebuilding them from UI state.
如果后端返回服务端签名的交易 payload，必须文档化每个原始字段、单位、参数顺序、有效期/deadline、签名、幂等或订单标识，以及前端是否需要等待回执或索引结果。前端可以校验文档化的结构，但必须原样透传已签名的合约参数，不能转换为 number，也不能从 UI 状态重建。

## Implementation pattern
## 实现模式

Keep wire DTOs close to the feature API. At the remote boundary, receive `unknown` where practical, validate discriminators and required fields, then transform a verified DTO into the domain model consumed by UI. Preserve missing or invalid data as an explicit error or loading failure; do not silently substitute business defaults.
将 wire DTO 放在功能 API 附近。在远端边界尽可能以 `unknown` 接收，校验辨别字段和必填字段，再把已验证 DTO 转成 UI 消费的领域模型。缺失或无效数据应作为明确错误或加载失败处理；不要静默填充业务默认值。

For monetary values, do not use JavaScript floating-point arithmetic for contract-sensitive amounts. Keep confirmed API decimal strings intact until they enter the existing decimal or token-unit helpers.
金额相关值不能用 JavaScript 浮点数处理合约敏感金额。已确认的 API 小数字符串应保持完整，直到进入已有 decimal 或 token-unit 工具。

Do not introduce a schema-validation dependency preemptively. Use focused type guards or parsers first; introduce a shared runtime schema tool only after repeated real endpoints demonstrate the need and the developer approves the dependency.
不要预先引入 schema 校验依赖。先使用聚焦的类型守卫或解析器；只有多个真实接口反复证明需要且开发者批准依赖后，才引入共享运行时 schema 工具。

## Test matrix
## 测试矩阵

For each integrated response parser, cover a valid payload and the meaningful failure modes: missing required field, wrong primitive type, null versus omitted, unsupported enum, malformed timestamp, and numeric string/number ambiguity when the backend contract permits both. Add endpoint and auth/header tests separately from parsing tests.
每个已接入的响应解析器应覆盖有效 payload 与有意义的失败模式：必填字段缺失、原始类型错误、null 与省略的区别、不支持的枚举、错误时间戳，以及后端同时允许数字字符串/数字时的歧义。接口地址和鉴权/请求头测试应与解析测试分开。
