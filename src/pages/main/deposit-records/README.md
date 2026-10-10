# 充值记录

`/deposit/records` 已从静态预览切换为登录后的GET /api/recharges，充值页入口与SecondaryHeader返回保留。正常流Header→列表，复用既有卡片/字体/颜色与Empty。from展示复用maskWalletAddress（前5位+****+后4位），接口原始地址保持完整；展示原样amount（前台单位余额）、tx_id；地址和哈希可换行。按浏览器截图使用真实数字id作为卡片key，created_at显示完整年月日时分秒，不进行时区转换；data.ts只保留历史视觉fixture，运行页不引用。

PagePullRefresh支持真实刷新和每页20条分页，初载不显示加载动画，不将加载或错误显示为空列表。错误时允许重试；取消过时请求并丢弃迟到结果；HTTP错误公共Toast去重。完整接口和字段边界见docs/yuanbao-funds-records-contract.md。沿用原局部hide-scrollbar，不新增切图/定位。固定文案维持五语言。
