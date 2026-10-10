# 会员转账接口契约

来源：开发者最新 API接口文档 (2).md 第12.1–12.3节。


会员转账只转宝气（`balance_bao`）。请求体不要传币种。

### 12.1 转账配置

- **请求方法：** `GET`
- **接口路径：** `/api/transfers/config`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 返回开关、最低额度和手续费百分比。开关缺省 `0`，等于 `1` 才开启。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| member_transfer_switch | string | 是 | 转账开关 | 等于 `1` 为开启 |
| member_transfer_bao_min | string | 是 | 宝气最低额度 | 缺省 `0` |
| member_transfer_bao_fee | string | 是 | 手续费百分比 | 手续费 = 金额 × 该值 / 100 |

返回示例：

```json
{
  "member_transfer_switch": "1",
  "member_transfer_bao_min": "1",
  "member_transfer_bao_fee": "0"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 500 | 服务器内部错误 |

### 12.2 发起转账

- **请求方法：** `POST`
- **接口路径：** `/api/transfers`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 把宝气转给另一个已注册地址。对方到账 = 金额 − 手续费，必须大于 0。成功体为 `[]`。不能转给自己。接收地址会先转成 checksum 再查用户。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

| 字段 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- |
| to_address | string | 是 | 接收方钱包地址 | 合法以太坊地址，且必须已注册 |
| amount | string | 是 | 转出宝气数量 | 大于 0，按 6 位精度截断后校验最低额度 |

请求示例：

```json
{
  "to_address": "0x52908400098527886E0F7030069857D2E4169EE7",
  "amount": "10"
}
```

#### 成功返回（HTTP 200，`application/json`）

空数组 `[]`。

返回示例：

```json
[]
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁；转账未开启；金额必须大于等于:{amount}；到账金额必须大于0；接收地址不存在；不能转账给自己；资产异常；余额不足；服务器繁忙请稍后再试 |
| 401 | Token 缺失或无效 |
| 422 | 地址或金额校验失败 |
| 500 | 服务器内部错误 |


### 12.3 转账记录

- **请求方法：** `GET`
- **接口路径：** `/api/transfers`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 当前用户相关的转账，按 ID 倒序。不传 `type` 时包含转入和转出。空列表为 `{"transfers":[]}`。`type` 和 `address` 按当前用户视角计算。不要传 `type=0`，校验只接受 `1` 或 `2`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | 1–20 |
| type | query | integer | 否 | 方向 | `1` 转出，`2` 转入。不传表示全部 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| transfers | array | 是 | 转账记录 | 无数据时为 `[]` |
| transfers[].id | integer | 是 | 转账 ID | |
| transfers[].ccy | string | 是 | 币种 | 固定 `balance_bao` |
| transfers[].amount | string | 是 | 转出金额 | 去掉末尾 `0` |
| transfers[].fee | string | 是 | 手续费 | 去掉末尾 `0` |
| transfers[].type | integer | 是 | 相对当前用户的方向 | `1` 转出，`2` 转入 |
| transfers[].address | string | 是 | 对方脱敏地址 | 前 5 位 + `...` + 后 4 位。没有地址时为 `""` |
| transfers[].created_at | string | 是 | 创建时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "transfers": [
    {
      "id": 1,
      "ccy": "balance_bao",
      "amount": "10",
      "fee": "0",
      "type": 1,
      "address": "0x529...9EE7",
      "created_at": "2026-10-09 12:00:00"
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 422 | 分页或 type 校验失败 |
| 500 | 服务器内部错误 |


资产页新增“转账记录”独立 Tab，GET 仅传 page_no/page_size=20，不传 type（转入和转出全部）。type=1 显示转出与负号，type=2 显示转入与正号；amount、fee 不通过浮点数转换，不推算手续费后的到账金额。对方 address 已脱敏，不从其他接口补齐；空地址显示 --。第一页同步刷新原资产概览，追加页仅加载记录。
