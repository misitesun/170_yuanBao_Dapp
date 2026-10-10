# 元宝卡活动配置

公开 GET /api/orders/config 响应仍包裹data，enabled现在是字符串，空/0/off/false（忽略大小写）视为关闭；can_sell、can_buy独立决定买卡/抢拍权限，四个时间用于展示。不再解析phase、server_time、win_rate、lose_profit_rate。服务端权限是权威；关闭时提示未开启，其他不可参与统一提示当前不在参与时间，不使用设备时间推断尚未开始。useOrderConfig保持进入/重试读取、卸载取消，无轮询。

## 买卡提交

buyCard(productId) 使用登录请求 POST /api/orders/sell，只提交 product_id，方法返回 Promise<void>，只等待 request<unknown> 成功，不解析空数组或其他未消费响应体。每次一张、扣面值对应元气，由后端校验阶段、上下架及余额。首页二次确认后调用，余额刷新使用 /api/users/my 并独立处理错误。

## 卡包订单读取

GET /api/orders 按登录状态发送 Bearer，传 page_no、page_size=20、side=1/2、status=0/1/2；新版取消trade_date筛选。严格解析orders包裹及实际消费字段，product对象消费id/name/image，产品删除时接受null，卡包不再请求/api/products补卡名图片；金额保持字符串，支持 AbortSignal。拍出／拍入调用，释放由 getOrderReleases 单独接入。

## 释放读取

getOrderReleases 使用登录 GET /api/order_releases，status=0/1 必传，page_size=20，透传 AbortSignal，解析 order_releases 包裹和实际展示字段。缺少本金双币拆分与中奖时间，不调用其他接口补数据；income_days/income_bao_days 当前没有展示消费者，不解析。

## 抢拍提交

bidCard(productId)使用登录POST /api/orders/buy，每次一张，仅传product_id，不传quantity。返回Promise<void>，忽略未消费成功体。auction先检查商品stock小于1提示已抢购完，再检查can_buy；同步防重，成功触发商品和配置重新读取，余额刷新错误独立处理。服务端负责最终库存与全平台当日数量校验。契约见docs/yuanbao-order-buy-contract.md。

getHomeCardOrders(page,signal)为首页卡包提供分页读取，仅传page_no/page_size=20；不复用getCardOrders的side/status参数。复用相同订单解析器，默认登录请求。卡包页getCardOrders仍保留筛选，首页成功买卡后刷新预览。
