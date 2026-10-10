# 记录页分页辅助

service.ts 将充值/提现列表包装为items及hasMore，提现Tab映射pending/succeeded/failed到接口1/2/3；useFundsRecords必须挂载在PagePullRefresh内，注册等待真实请求的刷新/加载更多函数。pagination.ts沿用卡包分页行为，在这两个记录页范围内复用：同步重置、代次隔离、AbortSignal取消、失败原页重试。共享pagination、HTTP、路由与组件契约未变。每页20条，满页才允许下一页。卸载及替换中止旧请求，第一页和加载更多期间关闭滚动加载。已确认字段及未提供字段边界见docs/yuanbao-funds-records-contract.md。
