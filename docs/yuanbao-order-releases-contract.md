# 释放记录契约摘录

来源：开发者最新 API接口文档.md 第6.1节。

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

