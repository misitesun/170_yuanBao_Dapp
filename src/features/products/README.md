# 产品展示

GET /api/products 为公开请求，显式 authentication=none，不发送 Bearer；响应为 products 数组，无分页。以 unknown 校验字段，金额完整保留字符串，使用后端返回顺序、数量、名称及 image 原值，不猜测商品颜色、不拼接图片域名。useProducts 供首页与抢拍页使用，页面卸载或重试时 AbortController 中止旧请求，旧结果不能回写；提供加载、失败、重试及空列表状态。没有定时轮询或合约调用，提交由orders模块负责。

首页 price 对应元气面值；抢拍页 purch_usdt/purch_bao 对应每张余额与宝气成本。gift_energy 保留在模型中，当前布局不增加赠送区。事实来源为开发者提供的最新 API接口文档 (2).md 第 8.1 节，摘录见 docs/yuanbao-products-api-contract.md。

新增stock整数用于抢拍按钮点击时检查库存小于1，不展示库存或销量，不解析未消费sales。买卡/抢拍成功后重新读取产品。
