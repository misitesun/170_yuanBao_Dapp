# 最新接口契约摘录

来源：开发者 API接口文档 (2).md，2026-10-10。

### 13.2 我的元宝卡订单

- **请求方法：** `GET`
- **接口路径：** `/api/orders`
- **认证要求：** 必须登录（Bearer JWT）
- **业务说明：** 当前用户的卖方买卡和买方抢购订单，按 ID 倒序，并带上产品。空列表为 `{"orders":[]}`。`side`、`status` 可选，不再按交易日筛选。金额去掉末尾 `0`。产品已删除时 `product` 为 `null`。

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 中文说明 | 约束/示例 |
| --- | --- | --- | --- | --- | --- |
| page_no | query | integer | 是 | 页码 | ≥ 1 |
| page_size | query | integer | 是 | 每页条数 | 1–20 |
| side | query | integer | 否 | 方向 | `1` 卖方买卡，`2` 买方抢购 |
| status | query | integer | 否 | 状态 | `0` 未开奖；`1` 卖方中奖或买方全额退款；`2` 卖方未中奖或买方匹配成功 |

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| orders | array | 是 | 订单列表 | 无数据时为 `[]` |
| orders[].id | integer | 是 | 订单 ID | |
| orders[].product_id | integer | 是 | 产品 ID | |
| orders[].side | integer | 是 | 方向 | `1` 卖方买卡，`2` 买方抢购 |
| orders[].amount | string | 是 | 卡面值 | 去掉末尾 `0` |
| orders[].pay_usdt | string | 是 | 买方已扣 USDT | 卖方为 `0` |
| orders[].pay_bao | string | 是 | 买方已扣宝气 | 卖方为 `0` |
| orders[].profit | string | 是 | 卖方收益 USDT | 未中奖时有值，其余为 `0` |
| orders[].gift_energy | string | 是 | 买方赠送元气 | 匹配成功时有值，其余为 `0` |
| orders[].trade_date | string | 是 | 交易日 | `Y-m-d` |
| orders[].status | integer | 是 | 状态 | `0` 未开奖，`1` 中奖或买方退款，`2` 未中奖或买方匹配成功 |
| orders[].created_at | string | 是 | 创建时间 | `Y-m-d H:i:s` |
| orders[].product | object \| null | 是 | 关联产品 | 字段与产品列表单项相同。产品已删除时为 `null` |

返回示例：

```json
{
  "orders": [
    {
      "id": 8,
      "product_id": 1,
      "side": 1,
      "amount": "100",
      "pay_usdt": "0",
      "pay_bao": "0",
      "profit": "0",
      "gift_energy": "0",
      "trade_date": "2026-10-09",
      "status": 0,
      "created_at": "2026-10-09 10:30:00",
      "product": {
        "id": 1,
        "name": "元宝卡",
        "image": "/products/1.png",
        "price": "100",
        "purch_usdt": "10",
        "purch_bao": "5",
        "gift_energy": "1",
        "sales": 3,
        "stock": 2
      }
    }
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 400 | 用户被封禁 |
| 401 | Token 缺失或无效 |
| 422 | 分页、方向或状态校验失败 |
| 500 | 服务器内部错误 |


## 首页预览请求

开发者明确要求：首页调用GET /api/orders只传分页（page_no、page_size），side/status完全省略。首页加载第一页20条，不作前端方向/状态过滤。独立卡包页仍保留既有筛选。来源：最新接口文档13.2中side/status可选，以及本轮开发者确认。
