# 最新接口契约摘录

来源：开发者 API接口文档 (2).md，2026-10-10。

### 8.1 产品列表

- **请求方法：** `GET`
- **接口路径：** `/api/products`
- **认证要求：** 无需登录
- **业务说明：** 只返回上架产品（`status=1`），按面值升序。空列表为 `{"products":[]}`。金额去掉末尾 `0`。`image` 按库中原值返回，不拼接域名。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| products | array | 是 | 产品列表 | 无数据时为 `[]` |
| products[].id | integer | 是 | 产品 ID | |
| products[].name | string | 是 | 名称 | |
| products[].image | string | 是 | 图片 | 库中原值 |
| products[].price | string | 是 | 卡面值（元气） | 去掉末尾 `0` |
| products[].purch_usdt | string | 是 | 抢购每张 USDT | 去掉末尾 `0` |
| products[].purch_bao | string | 是 | 抢购每张宝气 | 去掉末尾 `0` |
| products[].gift_energy | string | 是 | 买方匹配成功每张赠送元气 | 去掉末尾 `0` |
| products[].sales | integer | 是 | 销量 | 每成功买卡一张加 1 |
| products[].stock | integer | 是 | 剩余可抢购库存 | 买卡加 1，抢购减 1。小于 1 时不能抢购 |

返回示例：

```json
{
  "products": [
    {
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
  ]
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 500 | 服务器内部错误 |

