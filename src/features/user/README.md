# 用户资料

GET /api/users/my 返回裸对象。仅解析当前消费者需要的字段，保留金额原字符串、0人数以及level=null。等级使用name/icon/id，当前不消费提现手续费。`getCurrentUser('bearer')` 用于会话恢复及登录 POST 后的身份验证；第二参数 `options: { signal?: AbortSignal; walletAddress?: string }` 接收该轮 signal 与地址快照并透传给公共 HTTP。其余请求遵循已验证钱包会话。页面通过 `auth/session.refreshCurrentUser` 更新跨页面资料，恢复、登录验证和后续资料刷新共享当前会话的取消生命周期；成功后的 controller 保留到换号、断开、网络变化、清会话或卸载时 abort，再以 generation 丢弃迟到结果。不能直接以缓存钱包地址证明 Token 归属。后端字段契约见docs/yuanbao-api-contract.md。

实际服务 created_at 曾返回 -0001-11-30 00:00:00。该注册时间不参与登录校验，作为数据库原文本保留，不能因年份格式阻断有效用户登录；地址、邀请码、金额与等级仍保留对应校验。

GET /api/users/my/recharge_address 返回裸对象 recharge_address，供充值页使用，支持 AbortSignal；按0x加40位十六进制校验，保留checksum原文，不消费未文档化的链配置。契约见 docs/yuanbao-recharge-address-contract.md。
