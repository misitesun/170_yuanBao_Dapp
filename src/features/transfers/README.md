# 会员宝气转账

getTransferConfig 使用登录GET /api/transfers/config，裸对象解析开关/最低额度/手续费百分比，只有开关1开启，支持AbortSignal。normalizeTransferAmount按6位截断并检查正数，保留金额字符串，不用浮点。

submitTransfer只传to_address/amount，不传币种或链。成功体无消费者，返回Promise<void>并忽略成功体；HTTP错误走公共路径。接口注册/资产核对由服务端负责，页面另行校验自己地址、余额及最低额度。资产刷新与转账失败独立处理，不调用合约。文档见docs/yuanbao-transfers-contract.md。

GET /api/transfers 作为独立转账记录读取，认证请求仅传分页（20条），不传 type=0 或币种。解析 transfers 裸列表，固定 balance_bao，方向只能是 1/2，amount/fee 保留字符串，允许对方脱敏 address 为空；时间与整数字段按契约校验。不将记录响应与 POST 成功体混用。
