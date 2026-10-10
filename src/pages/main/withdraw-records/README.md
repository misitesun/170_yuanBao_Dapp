# 提现记录

`/withdraw/records` 已从静态预览切换为登录后的GET /api/claims。正常流SecondaryHeader→SegmentedTabs→tabpanel列表，复用既有卡片和样式token。三个Tab按文档显示提币中/成功/失败，分别发送status=1/2/3。卡片展示tamount申请金额、amount到账金额、fee手续费，全部保留字符串，前台币种用余额。

取消接口未提供，移除原静态取消操作；按浏览器截图使用数字id作为卡片key，补齐created_at时间展示，status严格按数字1/2/3校验；截图没有提现地址和失败原因，不猜测。data.ts保留为历史fixture，不用于运行页面。PagePullRefresh支持等待真实请求的刷新和20条分页；切Tab同步重置列表/游标/hasMore，取消旧请求，第一页期间禁用加载更多。初载水滴/失败重试/Empty分开，HTTP Toast去重。只读列表不调用POST申请或合约。接口与字段边界见docs/yuanbao-funds-records-contract.md，固定文案维持五语言。
