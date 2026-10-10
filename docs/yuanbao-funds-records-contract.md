# 充值与提现记录接口

事实来源：开发者提供 `/Users/sly/Downloads/Telegram Desktop/接口变更说明.md`，并于2026-10-10提供两个列表的浏览器Preview截图，确认补充字段类型。通用登录请求及 HTTP 错误沿用已确认项目边界。

- GET `/api/recharges`：登录；参数 `page_no>=1`、`page_size=1–20`，无状态筛选；裸对象 `recharges` 数组，空数组有效。消费字符串 `amount`、`ccy=balance_usdt`、完整 `from` 地址及 `tx_id` 哈希。只返回金额>=1的已入账记录，前端不额外过滤。
- GET `/api/claims`：登录；同样分页，`status=1/2/3` 对应提币中/成功/失败。不传返回全部，不能传0。页面三个Tab分别传1、2、3。裸对象 `withdraws` 数组；消费 `tamount` 申请金额、`amount` 到账金额、`fee` 手续费，均原样保留十进制字符串，`ccy=balance_usdt`。
- GET列表 `amount` 为页面到账金额，不是 POST `/api/claims` 返回的乘10^18合约签名整数。两者使用独立模块/解析器，未修改提交和领取流程。
- 每页20条；文档未给total等元数据，使用当前项目已有约定：满20条允许下一页，少于20条结束。

## 浏览器返回结构确认（2026-10-10）

两类记录均包含 `id`（JSON number，记录标识）和 `created_at`（字符串，截图格式为 `YYYY-MM-DD HH:mm:ss`），解析为id/createdAt并用真实id作为卡片key。时间沿用接口文本，页面显示 `YYYY.MM.DD HH:mm:ss`，HTML time的dateTime用无时区 `YYYY-MM-DDTHH:mm:ss`，不推断后端时区或进行时区转换。

提现 `status` 确认为 JSON number，严格接受1/2/3，已移除增量阶段对字符串状态的兼容。充值示例id=2、amount="100"、created_at="2026-10-10 15:33:58"；提现示例id=8、tamount="1"、amount="0.99"、fee="0.01"、status=1、created_at="2026-10-10 15:05:13"。空列表、错误、分页与金额规则继续以增量说明及既有通用契约为准，截图只是确认成功记录的字段形态。

截图中未出现提现地址、失败原因，页面不显示、不伪造。原静态data.ts保留为历史视觉fixture，运行页不引用。不校验未消费字段，不猜测新增响应包裹层；必需字段缺失/null/类型或格式异常产生加载失败，不当成空列表。

## 生命周期与验证

页面内 PagePullRefresh 注册真实加载Promise；切Tab/刷新同步清空列表、游标和hasMore，第一页完成前禁止加载更多。请求使用AbortSignal；替换与卸载取消请求，generation丢弃迟到结果；分页失败不推进游标，可重试相同页。HTTP错误走公共Toast并去重，非HTTP解析错误由页面Toast提示。

聚焦测试：`pnpm exec node --test tests/funds-records-runtime.test.mjs tests/funds-records-api-runtime.test.mjs`。完整验证：`pnpm build`（前置执行lint、全量测试、品牌门禁），`git diff --check`。
