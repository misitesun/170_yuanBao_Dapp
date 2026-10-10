# 元宝提交接口与链上交互记录

记录日期：2026-10-10。通用规范见 [submit-interactions.md](submit-interactions.md)。事实来源为开发者的 API接口文档 (2).md、localhost (4).json 和本次确认的页面行为；本表不是模板默认协议。

| 提交入口 | 接口/合约 | 当前消费与完成条件 |
| --- | --- | --- |
| 首页购买（二次确认） | POST /api/orders/sell，product_id | 成功体不消费，Promise<void>；接口成功后刷新商品、活动配置、首页订单与用户资产 |
| 抢拍（二次确认） | POST /api/orders/buy，product_id | 成功体不消费，Promise<void>；库存不足 1 先 Toast；接口成功后刷新商品、配置、余额/宝气 |
| 资产转账 | GET /api/transfers/config；POST /api/transfers，to_address/amount | 仅宝气；检查开关、最低额度、手续费、余额和地址；成功体不消费，刷新资产列表与余额 |
| 提现申请与领取 | GET /api/claims/config；POST /api/claims，ccy=balance_usdt/amount | API 扣余额并返回 id/token/amount/signature/expire_time，严格消费后领取；API 成功不是最终提现成功 |
| 提现链上领取 | YBProject.withdraw(id, token, amount, deadline, signature) | expire_time 对应 deadline；只做 bigint 转换，不二次乘精度；等待成功回执 |
| 领取状态核对 | YBProject.usedWithdrawIds(id) | 公共读取不传 account；未知结果只核对，不重复发交易；同一 id 已使用才确认完成 |
| 钱包授权/重新授权 | authorizeWallet → 当前 auth 契约 | 复用原鉴权字段与签名协议；保持页面欢迎文案，失败只 Toast，不能复制协议到其他项目 |

购买、抢拍、转账均为 API-only，不授权、不调用合约。只有提现使用 YBProject。充值使用 GET /api/users/my/recharge_address，不属于提交；充值链和提现展示链固定 BSC20，当前开发合约链 ID 31337 来自部署配置，生产配置单独确认。ABI/地址见 [测试合约记录](yuanbao-yb-project-contract.md)，不在 UI 或模板硬编码。

## 当前失败恢复

- 用户已确认 HTTP 4xx/5xx 失败后可重试，当前 claims/flow 回到 idle；这是本项目的 UI 策略，不证明服务端事务已回滚，也不是其他项目默认规则。
- 请求无响应、成功体异常仍保留 blocked；已获签名后拒签/明确回退保留 ready，未知交易结果只核对原单，签名过期不再次申请。
- 失败后输入和全部可以编辑；原单的后续领取仍使用原签名，不以新输入替换已签名的 token/amount/deadline/id。输入 editable 与允许新 POST 是不同边界。
- 账户隔离的签名只保留在内存，跨路由保留但不跨浏览器刷新。当前接口文档没有恢复/重新签名/取消提取单的接口，不编造此类调用。

## 当前验证入口

claims-api、claim-flow、withdraw-page、yb-project、home-availability、products-api、transfer-popup 和 yuanbao-splash 的 runtime 测试覆盖解析、参数顺序、防重、拒签/回退、错链/换账号、输入恢复、遮罩和 Toast。mock 与构建通过不能代替真实钱包与本地链联调；本次规范记录不发起签名或交易。
