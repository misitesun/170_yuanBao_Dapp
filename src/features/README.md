# Features

元宝项目已确认的业务能力按auth/user/notices/team/assets分组。接口统一调用src/services/http，网络成功数据从unknown校验为领域模型，不以泛型证明PHP数据。auth编排钱包授权和跨页面资料，user负责用户DTO，notices负责公告与安全正文，team/assets只封装已文档化读取。api-fields.ts包含这些接口共用的字段检查及分页大小。页面service组合真实请求及视图映射，保留正常页面模块结构。模板默认流程不作为本项目事实；原始契约见docs/yuanbao-api-contract.md，接入范围与待确认项见docs/yuanbao-api-integration.md。充值/提现/转账和订单功能不属于已接入能力。

products 新增公开商品展示读取，供首页与抢拍页使用，不包含订单提交。契约见 docs/yuanbao-products-api-contract.md。

orders 新增公开活动配置读取，用于首页／抢拍页参与时间与状态提示，仍无订单提交。

首页已接入 orders.buyCard 买卡提交（POST /api/orders/sell），购买前二次确认；抢购仍未接入。

卡包拍出／拍入已接入 orders.getCardOrders，释放列表已单独接入 orders.getOrderReleases。

rankings.getTeamRanking 提供登录后的当日团队业绩前50名和本人名次，供 ranking 页面展示和失败重试，不分页、不下拉刷新。

claims 提供提现配置、严格签名参数解析与YBProject领取编排，固定balance_usdt，BSC20仅为固定展示；实际测试链31337。成功回执后显示提现成功，拒签保留同一单继续领取；异常结果不重复申请，刷新余额独立处理。

transfers提供会员宝气转账配置及提交，资产页转账弹窗消费；不传币种，不包含合约操作。

新版元宝卡契约：配置使用can_sell/can_buy，商品stock仅用于抢拍提示；订单product直接提供卡名图片，卡包不额外获取产品。auction已接入每次一张的orders.bidCard。

funds-records新增GET /api/recharges与GET /api/claims登录列表读取，独立于claims的POST签名与合约领取；已结合增量说明及浏览器截图确认字段，补齐时间/ID并严格校验数字status。见docs/yuanbao-funds-records-contract.md。
