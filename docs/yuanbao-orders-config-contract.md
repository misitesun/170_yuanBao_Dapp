# 最新接口契约摘录

来源：开发者 API接口文档 (2).md，2026-10-10。

### 13.1 元宝卡公共配置

- **请求方法：** `GET`
- **接口路径：** `/api/orders/config`
- **认证要求：** 无需登录
- **业务说明：** 返回开关原值、当前能否买卡、当前能否抢购，以及买卖时间。成功体包在 `data` 里。`enabled` 是 `card_switch` 的原值字符串，不是布尔；缺省 `1`。空、`0`、`off`、`false`（忽略大小写）表示关闭，此时 `can_sell` 和 `can_buy` 都是 `false`。功能开启且落在对应时间窗内，对应字段才是 `true`。

#### 请求参数

无路径参数、查询参数或额外请求头参数。

#### 请求体（`application/json`）

无。

#### 成功返回（HTTP 200，`application/json`）

| 返回字段 | 类型 | 必返 | 中文说明 | 枚举/格式/示例 |
| --- | --- | --- | --- | --- |
| data.enabled | string | 是 | 开关原值 | 不是布尔。`0` 或空为关闭，缺省 `1` |
| data.can_sell | boolean | 是 | 当前能否买卡 | 功能开启且在买卡时间内 |
| data.can_buy | boolean | 是 | 当前能否抢购 | 功能开启且在抢购时间内 |
| data.sell_start | string | 是 | 买卡开始 | 默认 `10:00` |
| data.sell_end | string | 是 | 买卡结束 | 默认 `15:00`，不含该时刻 |
| data.buy_start | string | 是 | 抢购开始 | 默认 `16:00` |
| data.buy_end | string | 是 | 抢购结束 | 默认 `17:00`，不含该时刻 |

返回示例：

```json
{
  "data": {
    "enabled": "1",
    "can_sell": true,
    "can_buy": false,
    "sell_start": "10:00",
    "sell_end": "15:00",
    "buy_start": "16:00",
    "buy_end": "17:00"
  }
}
```

#### 可能错误

| HTTP 状态码 | 中文说明 |
| --- | --- |
| 500 | 服务器内部错误 |

