# 提现申请与链上领取

GET /api/claims/config 使用登录请求和 AbortSignal，解析裸对象开关、最低额度、手续费百分比；开关为0或空关闭，金额保持字符串。

normalizeClaimAmount 按文档截断6位精度并校验正数。submitClaim 只传 ccy=balance_usdt 与字符串金额；成功体是下一步合约调用的必需输入，返回 ClaimPayload。严格校验 id、token、amount、signature、expire_time；amount 保留链上整数字符串，deadline 不重新生成。2xx 无效响应抛 ClaimPayloadError，不当成可重试的申请失败。

flow.ts 编排钱包账户/网络预检 → 申请 → 查询 usedWithdrawIds → withdraw → 成功回执。复用通用 injected-wallet 服务与 YBProject 封装，无授权操作。签名仅在映射到合约时转为 bigint，不再次乘精度。申请后重新核对账户，防止切换钱包后使用旧签名。

账户隔离的内存状态和同步阶段锁避免重复请求与并发交易，并跨路由保留本次提取单。拒签/明确回执回退可以继续领取同一单，不再次 POST。其他交易错误视为结果不明确，只允许检查 usedWithdrawIds；已使用时完成，未使用时不自动重发。签名过期不重新申请。异常成功体、无响应结果不明时阻止重新扣款；收到 HTTP 4xx/5xx 失败响应后恢复 idle，允许修正后重试。HTTP 错误只由公共提示展示，页面不叠加另一条 Toast。成功后可点“再次提现”开始新申请。

**恢复边界：** 内存状态不跨浏览器刷新保存，当前文档无提取单查询/重新签名/取消接口。遇到过期、申请结果不明或刷新后遗失参数，需后台核对既有提取单，不能调用 POST 重新生成同一单。未增加本地持久化签名。

页面刷新余额独立处理：后台在申请时已扣余额，领取失败也需要刷新；刷新失败不改报提现失败。契约见 docs/yuanbao-claims-contract.md 和 docs/yuanbao-yb-project-contract.md。
