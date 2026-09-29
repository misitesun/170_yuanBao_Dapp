# 全部资产

/assets在已验证钱包会话后加载。service.ts组合GET /api/users/my余额与GET /api/balance_logs流水，三Tab分别对应balance_usdt/balance_energy/balance_bao。金额保留字符串与精度，没有小数部分时不显示undefined。备注与时间使用真实字段，增减方向只来自is_inc，不沿用示例高亮分类；首屏未加载显示占位。

PagePullRefresh等待真实第一页与余额；Tab切换同步清空列表、游标与hasMore，旧请求丢弃，追加页不重复获取余额。空状态复用Empty，首次/追加加载复用droplet，空第一页不展示没有更多了。HTTP错误由公共Toast处理，页面仅补非HTTP解析错误。

保留现有Figma 30192:466样式、assets切图与common共享背景资源，量测及批准差异见docs/yuanbao-assets-checklist.md，不重做视觉布局。按开发者最新要求，充值、提现、转账三个按钮均仅通过公共Toast提示“暂未开放”，不跳转、不打开弹窗、不发提交请求。接口事实与验收边界见docs/yuanbao-api-integration.md。

## 多语言

固定标题、余额单位、三个动作和明细 Tab 在渲染时翻译；流水 content、金额及时间保持后端原值，长标签使用页面局部 :lang 适配。
