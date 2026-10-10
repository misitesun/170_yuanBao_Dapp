# 提现接口契约

来源：开发者最新 API接口文档 (2).md 第11节。开发者确认BSC20展示固定，并于本轮授权完整接入本地YBProject链上领取。


### 11.1 提取配置

- **请求方法：** `GET`
- **接口路径：** `/api/claims/config`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 返回 USDT 提取开关、最低额度和手续费百分比。值来自系统配置，缺省为 `0`。`withdraw_usdt_switch` 为 `0` 或空时，申请提取会失败。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| withdraw_usdt_switch | string | 是 | 提取开关 | `0` 或空为关闭 |
| withdraw_usdt_min | string | 是 | 最低提取额度 | |
| withdraw_usdt_fee | string | 是 | 手续费百分比 | 手续费 = 金额 × 该值 / 100 |

返回示例：

```json
{
  "withdraw_usdt_switch": "1",
  "withdraw_usdt_min": "10",
  "withdraw_usdt_fee": "1"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 500 | 服务器内部错误 |

### 11.2 申请提取

- **请求方法：** `POST`
- **接口路径：** `/api/claims`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 扣当前用户 USDT，并返回 5 分钟内有效的链上领取签名。到账金额 = 申请金额 − 手续费。返回的 `amount` 是到账金额乘 `10^18` 的整数字符串，给合约用，不是页面上的金额。`ccy` 只能是 `balance_usdt`。总开关关闭，或用户个人提取开关不是 1，都返回 `提取功能未开启`。非 prod 环境跳过资产核对。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

| 字段 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- |
| ccy | string | 是 | 币种 | 只能是 `balance_usdt` |
| amount | string | 是 | 申请金额 | 大于 0 的数字，按 6 位精度截断后校验最低额度 |

请求示例：

```json
{
  "ccy": "balance_usdt",
  "amount": "100"
}
```

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| id | integer | 是 | 提取单 ID | |
| token | string | 是 | USDT 合约地址 | checksum |
| amount | string | 是 | 链上数量 | 到账金额 × 10^18 的整数字符串 |
| signature | string | 是 | 链上领取签名 | |
| expire_time | integer | 是 | 签名过期时间 | 秒级时间戳，创建后 5 分钟 |

返回示例：

```json
{
  "id": 12,
  "token": "0x52908400098527886E0F7030069857D2E4169EE7",
  "amount": "99000000000000000000",
  "signature": "0x",
  "expire_time": 1710000300
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁；提取功能未开启；最低提现额度为:{min}；资产异常；余额不足；服务器繁忙请稍后再试 |
| 401 | Token 缺失或无效 |
| 422 | 币种或金额校验失败 |
| 500 | 服务器内部错误 |


## 当前前端消费规则

POST 成功体已用于合约调用，submitClaim 返回严格校验后的 ClaimPayload，不再使用 Promise<void>。id、token、amount、expire_time、signature 分别映射至 withdraw 的 id、token、amount、deadline、signature。仅 bigint 类型转换，金额不乘精度，签名不重建。完整状态和恢复边界见 src/features/claims/README.md；没有新增后台恢复接口。

## 接口失败交互

开发者要求接口返回错误后可重试：HTTP 4xx/5xx 恢复申请表单，不生成领取参数、不调用合约；公共 HTTP Toast 展示错误，页面不叠加提示。网络无响应与成功体参数异常仍按原恢复边界处理。
