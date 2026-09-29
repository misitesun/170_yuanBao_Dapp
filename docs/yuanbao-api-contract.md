# 170（170-api）接口文档

> 给前端对接口使用。ApiPost / Swagger 导入请用 `docs/openapi.json`。
>
> 本文档只覆盖 `AuthController`、`NoticeController`、`UserController`、`OrderReleaseController` 已在 `external` 服务注册的接口。`/api/test/*` 与 `internal` 不包含。

## 1. 通用约定

- 成功响应是裸 JSON，没有 `code` / `message` / `data` 信封。
- 列表接口空数据是带包裹键的空数组，例如 `{"notices":[]}`。只有「标记公告已读」的空成功是 `[]`。
- 业务错误、参数校验错误、鉴权错误的响应体都是纯文本，不是 JSON。
- 需要登录的接口请求头：`Authorization: Bearer <token>`。`token` 来自登录接口。默认有效期 86400 秒，以环境变量 `SIMPLE_JWT_TTL` 为准。同一用户再次登录会使旧 token 失效（SSO）。
- 可选请求头 `address`：传了合法以太坊地址且当前已登录时，必须与 token 对应用户地址一致，否则 HTTP 401，正文 `地址验证失败`。
- 请求头 `lang` 有两套用途，不要混：
  - 文案翻译：`zh-Hans` → `zh-CN`，`en` → `en-US`，`zh-Hant` → `zh-TW`，`ko` → `ko-KR`，`ja` → `ja-JP`。未识别时翻译回退 `en-US`。流水 `content` 和业务错误文案走这套。
  - 公告筛选：直接用请求头原值比对 `notices.lang`。库里的语言值是 `zh-Hans`、`zh-Hant`、`en`、`ko`、`ja`。不传时按空字符串过滤，列表为空，不会回退到默认语言。
- 金额字段是字符串。余额流水的 `amount` 会去掉末尾 `0`。用户余额、业绩、释放记录金额按数据库原样返回。
- 分页：`page_no` ≥ 1。公告、余额流水、释放记录的 `page_size` 为 1–20。直推列表的 `page_size` 只要求 ≥ 1，没有上限。

## 1.1 通用错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 业务校验失败，正文为提示文案（受 `lang` 翻译） |
| 401 | Token 缺失、过期或无效时正文为 `Unauthorized.`。签名失败、地址不匹配时正文为对应文案 |
| 404 | 资源不存在。公告接口正文为 `not found`（未翻译） |
| 422 | 参数验证失败，正文为第一条校验错误（纯文本） |
| 500 | 服务器内部错误，正文为 `Internal Server Error.` |

## 2. 接口目录

## 2.1 接口清单

| 序号 | 分组 | 方法 | 路径 | 接口名称 |
| --- | --- | --- | --- | --- |
| 1 | 认证 | POST | `/api/auth/login` | 钱包签名登录 |
| 2 | 公告 | GET | `/api/notices` | 公告列表 |
| 3 | 公告 | GET | `/api/notices/{id}` | 公告详情 |
| 4 | 公告 | GET | `/api/notices/pop` | 弹窗公告 |
| 5 | 公告 | GET | `/api/notices/{id}/read` | 标记公告已读 |
| 6 | 公告 | GET | `/api/notices/{type}` | 按类型获取公告 |
| 7 | 用户 | GET | `/api/users/my` | 我的信息 |
| 8 | 用户 | GET | `/api/users/my/referrals` | 直推列表 |
| 9 | 用户 | GET | `/api/users/my/statistics` | 我的统计 |
| 10 | 用户 | GET | `/api/balance_logs` | 余额流水 |
| 11 | 订单释放 | GET | `/api/order_releases` | 释放记录列表 |

## 3. 认证

### 3.1 钱包签名登录

- **请求方法：** `POST`
- **接口路径：** `/api/auth/login`
- **认证要求：** 无需登录
- **业务说明：** 用钱包地址登录。地址已存在则直接签发 token；不存在则注册后签发 token。签名原文是 `Login-{timestamp}`，按以太坊 `personal_sign` 校验。`APP_ENV` 不是 `prod` 时跳过验签。地址会先转成 checksum 再入库和查询。库里还没有任何用户时可以不传邀请码；已有用户时，邀请码必须能解析到存在的用户，否则返回 400，正文 `邀请码不能为空`。邀请码与「我的信息」里的 `referral_code` 同一套规则：Hashids，盐为 `{app_name}_user`，长度 8。空成功不适用，成功一定返回 token。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

| 字段 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- |
| address | string | 是 | 钱包地址 | 合法以太坊地址，示例 `0x52908400098527886E0F7030069857D2E4169EE7` |
| signature | string | 是 | 签名 | 最长 255。签名原文 `Login-{timestamp}` |
| timestamp | integer | 是 | 秒级时间戳 | 必须 ≥ 当前时间减 60 秒。校验没有上限，未来时间也能通过 |
| ref | string | 否 | 邀请码 | 不传即可。传入时长度必须是 8。不要传空字符串，空字符串会触发长度校验 |

请求示例：

```json
{
  "address": "0x52908400098527886E0F7030069857D2E4169EE7",
  "signature": "0x...",
  "timestamp": 1710000000,
  "ref": "abc12345"
}
```

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| token | string | 是 | 登录令牌 | 放到后续请求的 `Authorization: Bearer <token>` |

返回示例：

```json
{
  "token": "xxxxx"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 已有用户但邀请码为空或无效，正文 `邀请码不能为空` |
| 401 | 签名验证失败，正文 `签名验证失败` |
| 422 | 参数验证失败 |
| 500 | 服务器内部错误 |

## 4. 公告

公告列表只返回 `status = 1` 且 `lang` 等于请求头的记录，按 `updated_at` 倒序。列表不再按 `type` 过滤。详情接口不校验状态和语言。

### 4.1 公告列表

- **请求方法：** `GET`
- **接口路径：** `/api/notices`
- **认证要求：** 无需登录
- **业务说明：** 分页返回已启用公告。空列表为 `{"notices":[]}`，不是 `[]`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| lang | header | string | 建议 | 公告语言 | `zh-Hans` / `zh-Hant` / `en` / `ko` / `ja`。不传则列表为空 |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | 1–20 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| notices | array | 是 | 公告列表 | 无数据时为 `[]` |
| notices[].id | integer | 是 | 公告 ID | |
| notices[].title | string | 是 | 标题 | |
| notices[].content | string | 是 | 正文 | HTML |
| notices[].updated_at | string | 是 | 更新时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "notices": [
    {
      "id": 1,
      "title": "系统公告",
      "content": "<p>内容</p>",
      "updated_at": "2026-09-29 12:00:00"
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 422 | 分页参数验证失败 |
| 500 | 服务器内部错误 |

### 4.2 公告详情

- **请求方法：** `GET`
- **接口路径：** `/api/notices/{id}`
- **认证要求：** 无需登录
- **业务说明：** 按 ID 取一条公告，不判断启用状态和语言。不存在时 HTTP 404，正文 `not found`。成功返回公告对象本身，没有包裹键。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| id | path | integer | 是 | 公告 ID | 正整数 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| id | integer | 是 | 公告 ID | |
| title | string | 是 | 标题 | |
| content | string | 是 | 正文 | HTML |
| updated_at | string | 是 | 更新时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "id": 1,
  "title": "系统公告",
  "content": "<p>内容</p>",
  "updated_at": "2026-09-29 12:00:00"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 404 | 公告不存在，正文 `not found` |
| 500 | 服务器内部错误 |

### 4.3 弹窗公告

- **请求方法：** `GET`
- **接口路径：** `/api/notices/pop`
- **认证要求：** 登录可选
- **业务说明：** 取当前语言下 `is_pop = 1`、按 `updated_at` 最新的一条。没有弹窗公告时 `notice` 为 `[]`，`is_show` 为 `false`。有公告时 `notice` 始终是对象；`is_show` 仅表示当前身份还没点过已读。已登录按用户 ID 记已读；未登录所有访客共用一个已读位，任意访客标记已读后，其他未登录访客也会看到 `is_show = false`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| lang | header | string | 建议 | 公告语言 | `zh-Hans` / `zh-Hant` / `en` / `ko` / `ja` |
| Authorization | header | string | 否 | 登录令牌 | `Bearer <token>`。传了无效 token 会 401 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| is_show | boolean | 是 | 是否还要弹出 | `true` 表示有弹窗且当前身份未读 |
| notice | object / array | 是 | 弹窗公告 | 没有公告时为 `[]`；有公告时为对象 |
| notice.id | integer | 有公告时 | 公告 ID | |
| notice.title | string | 有公告时 | 标题 | |
| notice.content | string | 有公告时 | 正文 | |
| notice.updated_at | string | 有公告时 | 更新时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "is_show": true,
  "notice": {
    "id": 1,
    "title": "系统公告",
    "content": "<p>内容</p>",
    "updated_at": "2026-09-29 12:00:00"
  }
}
```

无弹窗时：

```json
{
  "is_show": false,
  "notice": []
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 401 | 传了无效 token，正文 `Unauthorized.` |
| 500 | 服务器内部错误 |

### 4.4 标记公告已读

- **请求方法：** `GET`
- **接口路径：** `/api/notices/{id}/read`
- **认证要求：** 登录可选
- **业务说明：** 公告存在且已登录时，把该用户的弹窗已读位置为已读。未登录只校验公告存在，不写已读。成功体固定为 `[]`。公告不存在时 HTTP 404，正文 `not found`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| id | path | integer | 是 | 公告 ID | 正整数 |
| Authorization | header | string | 否 | 登录令牌 | `Bearer <token>`。只有登录成功才会记下已读 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

无业务字段。空成功为 `[]`。

返回示例：

```json
[]
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 401 | 传了无效 token，正文 `Unauthorized.` |
| 404 | 公告不存在，正文 `not found` |
| 500 | 服务器内部错误 |

### 4.5 按类型获取公告

- **请求方法：** `GET`
- **接口路径：** `/api/notices/{type}`
- **认证要求：** 无需登录
- **业务说明：** 路径 `type` 只匹配字母和下划线。`/api/notices/pop` 是独立接口，不会走进这里。接口按 `type` 加请求头 `lang` 取一条，不判断启用状态。代码里写了默认语言 `zh-CN`，但 `getHeaderLine` 只接收请求头名，多传的默认值在 PHP 8 会直接抛参数个数错误，线上是 HTTP 500、正文 `Internal Server Error.`。调用前必须确认该问题已修复；修复前这个接口不可用。公告语言实际存的是 `zh-Hans` 等原值，不是 `zh-CN`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| type | path | string | 是 | 公告类型 | 只允许字母和下划线，示例 `user_agreement` |
| lang | header | string | 是 | 公告语言 | 与库里的 `lang` 原值一致，如 `zh-Hans` |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

与公告详情相同，返回对象本身，没有包裹键。

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| id | integer | 是 | 公告 ID | |
| title | string | 是 | 标题 | |
| content | string | 是 | 正文 | |
| updated_at | string | 是 | 更新时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "id": 2,
  "title": "用户协议",
  "content": "<p>协议</p>",
  "updated_at": "2026-09-29 12:00:00"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 404 | 该类型和语言下没有公告，正文 `not found`。当前实现在查询前就会 500，这条要等接口修复后才到得了 |
| 500 | 当前调用会因 `getHeaderLine` 参数个数错误返回 `Internal Server Error.` |

## 5. 用户

本组接口都要登录，并且用户未被封禁。封禁时 HTTP 400，正文 `用户被封禁`。

### 5.1 我的信息

- **请求方法：** `GET`
- **接口路径：** `/api/users/my`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 返回当前用户。没有包裹键。`level` 已加载：有等级记录时为对象，没有时为 `null`。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| id | integer | 是 | 用户 ID | |
| address | string | 是 | 钱包地址 | checksum 地址 |
| referral_code | string | 是 | 邀请码 | 长度 8，登录时作为 `ref` 传给下级 |
| team_count | integer | 是 | 团队人数 | |
| created_at | string | 是 | 注册时间 | `Y-m-d H:i:s` |
| balance_usdt | string | 是 | USDT 余额 | 数据库原样字符串 |
| balance_energy | string | 是 | 元气余额 | 数据库原样字符串 |
| balance_bao | string | 是 | 宝气余额 | 数据库原样字符串 |
| level | object / null | 是 | 等级 | 无等级时为 `null` |
| level.id | integer | 有等级时 | 等级 ID | |
| level.icon | string | 有等级时 | 等级图标 | `{S3_URI}/{icon}` |
| level.withdraw_fee | string | 有等级时 | 提现手续费 | 数据库原样 |
| level.withdraw_avt_fee | string | 有等级时 | 提现 AVT 手续费 | 字段名以接口为准 |
| level.name | string | 有等级时 | 等级名称 | |

返回示例：

```json
{
  "id": 1,
  "address": "0x52908400098527886E0F7030069857D2E4169EE7",
  "referral_code": "abc12345",
  "team_count": 3,
  "created_at": "2026-09-01 10:00:00",
  "balance_usdt": "100.000000",
  "balance_energy": "0.000000",
  "balance_bao": "10.000000",
  "level": {
    "id": 1,
    "icon": "https://cdn.example.com/level/1.png",
    "withdraw_fee": "0.05",
    "withdraw_avt_fee": "0.00",
    "name": "V1"
  }
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 500 | 服务器内部错误 |

### 5.2 直推列表

- **请求方法：** `GET`
- **接口路径：** `/api/users/my/referrals`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 当前用户的直接下级，按 ID 倒序。空列表为 `{"referrals":[]}`。`page_size` 只校验 ≥ 1，没有 20 条上限。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | ≥ 1，无上限 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| referrals | array | 是 | 直推用户 | 无数据时为 `[]` |
| referrals[].id | integer | 是 | 用户 ID | |
| referrals[].maddress | string | 是 | 脱敏地址 | 前 5 位 + `...` + 后 4 位 |
| referrals[].kpi | string | 是 | 个人业绩 | 数据库原样字符串 |
| referrals[].team_kpi | string | 是 | 团队业绩 | 数据库原样字符串 |
| referrals[].invite_count | integer | 是 | 直推人数 | |
| referrals[].team_count | integer | 是 | 团队人数 | |
| referrals[].created_at | string | 是 | 注册时间 | `Y-m-d H:i:s` |
| referrals[].level | object / null | 是 | 等级 | 结构同「我的信息」的 `level`；无等级时为 `null` |

返回示例：

```json
{
  "referrals": [
    {
      "id": 2,
      "maddress": "0x529...9EE7",
      "kpi": "100.000000",
      "team_kpi": "0.000000",
      "invite_count": 0,
      "team_count": 0,
      "created_at": "2026-09-02 10:00:00",
      "level": null
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 422 | 分页参数验证失败 |
| 500 | 服务器内部错误 |

### 5.3 我的统计

- **请求方法：** `GET`
- **接口路径：** `/api/users/my/statistics`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 返回当前用户的人数和业绩。没有包裹键。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| invite_count | integer | 是 | 直推人数 | |
| team_count | integer | 是 | 团队人数 | |
| kpi | string | 是 | 个人业绩 | 数据库原样字符串 |
| team_kpi | string | 是 | 团队业绩 | 数据库原样字符串 |

返回示例：

```json
{
  "invite_count": 1,
  "team_count": 20,
  "kpi": "100.000000",
  "team_kpi": "500.000000"
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 500 | 服务器内部错误 |

### 5.4 余额流水

- **请求方法：** `GET`
- **接口路径：** `/api/balance_logs`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 当前用户的余额流水，按 ID 倒序。不传 `ccy` 返回全部币种。空列表为 `{"balance_logs":[]}`。`content` 会按 `lang` 翻译。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | 1–20 |
| ccy | query | string | 否 | 币种 | `balance_usdt` USDT / `balance_energy` 元气 / `balance_bao` 宝气。不传表示全部 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| balance_logs | array | 是 | 流水列表 | 无数据时为 `[]` |
| balance_logs[].id | integer | 是 | 流水 ID | |
| balance_logs[].is_inc | boolean | 是 | 是否增加 | `true` 增加，`false` 减少 |
| balance_logs[].amount | string | 是 | 变动金额 | 去掉末尾 0 的数字字符串，示例 `1.5` |
| balance_logs[].ccy | string | 是 | 币种 | `balance_usdt` / `balance_energy` / `balance_bao` |
| balance_logs[].content | string | 是 | 备注 | 已按 `lang` 翻译，如 `每日释放`、`提取` |
| balance_logs[].created_at | string | 是 | 创建时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "balance_logs": [
    {
      "id": 10,
      "is_inc": true,
      "amount": "1.5",
      "ccy": "balance_usdt",
      "content": "每日释放",
      "created_at": "2026-09-29 00:05:00"
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 422 | 分页或币种参数验证失败 |
| 500 | 服务器内部错误 |

## 6. 订单释放

### 6.1 释放记录列表

- **请求方法：** `GET`
- **接口路径：** `/api/order_releases`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 当前用户指定状态的释放记录，按 ID 倒序。`status` 必填，一次只查一种状态。空列表为 `{"order_releases":[]}`。状态含义：`0` 结束，`1` 正常。金额字段按数据库原样返回。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | 1–20 |
| status | query | integer | 是 | 状态 | `0` 结束，`1` 正常 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| order_releases | array | 是 | 释放记录 | 无数据时为 `[]` |
| order_releases[].id | integer | 是 | 记录 ID | |
| order_releases[].amount | string | 是 | 订单金额 | 数据库原样字符串 |
| order_releases[].income_days | string | 是 | 每日释放金额 | 数据库原样字符串 |
| order_releases[].income_bao_days | string | 是 | 宝气每日释放金额 | 数据库原样字符串 |
| order_releases[].release_usdt | string | 是 | 已释放 USDT | 数据库原样字符串 |
| order_releases[].today_usdt | string | 是 | 今日释放 USDT | 数据库原样字符串 |
| order_releases[].release_bao | string | 是 | 已释放宝气 | 数据库原样字符串 |
| order_releases[].today_bao | string | 是 | 今日释放宝气 | 数据库原样字符串 |
| order_releases[].release_count | integer | 是 | 已释放次数 | |
| order_releases[].total_count | integer | 是 | 总次数 | |
| order_releases[].status | integer | 是 | 状态 | `0` 结束，`1` 正常。与查询条件一致 |
| order_releases[].created_at | string | 是 | 创建时间 | `Y-m-d H:i:s` |

返回示例：

```json
{
  "order_releases": [
    {
      "id": 1,
      "amount": "100.000000",
      "income_days": "1.000000",
      "income_bao_days": "0.100000",
      "release_usdt": "3.000000",
      "today_usdt": "1.000000",
      "release_bao": "0.300000",
      "today_bao": "0.100000",
      "release_count": 3,
      "total_count": 100,
      "status": 1,
      "created_at": "2026-09-01 10:00:00"
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 422 | 分页或状态参数验证失败 |
| 500 | 服务器内部错误 |
