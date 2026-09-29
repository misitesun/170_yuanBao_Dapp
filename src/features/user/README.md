# 用户资料

GET /api/users/my 返回裸对象。仅解析当前消费者需要的字段，保留金额原字符串、0人数以及level=null。等级使用name/icon/id，当前不消费提现手续费。getCurrentUser('bearer')仅供鉴权恢复的账号核对，其余请求遵循已验证钱包会话。页面通过auth/session.refreshCurrentUser更新跨页面资料，不能直接以缓存钱包地址证明Token归属。后端字段契约见docs/yuanbao-api-contract.md。

实际服务 created_at 曾返回 -0001-11-30 00:00:00。该注册时间不参与登录校验，作为数据库原文本保留，不能因年份格式阻断有效用户登录；地址、邀请码、金额与等级仍保留对应校验。
