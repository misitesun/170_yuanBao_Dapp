# 充值与提现记录读取

api.ts 提供 getRechargeRecords/getClaimRecords，复用HTTP登录鉴权、地址及语言请求头与错误提示。响应从unknown按增量文档解析，保留金额字符串；提现列表使用withdraws而不是claims包裹层。列表与POST提现签名响应完全独立，不修改提交流程。分页固定20条，支持AbortSignal。仅校验已确认且消费的字段，已按浏览器截图补齐数字id、created_at时间字符串与数字status；提现地址/失败原因未提供，不猜测。完整边界见 docs/yuanbao-funds-records-contract.md。
