# 元宝排行榜

依据 Figma `30230:644` 与开发者确认的 `docs/yuanbao-ranking-checklist.md`。通过现有MainLayout访问 `/ranking`，侧栏新增“排行榜”入口，点击使用既有NavLink关闭侧栏并导航。保留公共Header、Popup、钱包和鉴权边界。

GET /api/rankings/team_kpi 提供当日团队业绩前50名，列表取 list.rank/address/team_kpi，本人取 me.rank/team_kpi。保持服务端排序、原始金额字符串；rank=0 显示未上榜，超过50照常显示本人排名。接口没有本人地址；底部我的排名下方展示当前连接钱包地址，复用 useDappStore.walletAddress 与 maskWalletAddress，未连接显示 --，不关联其他接口。个人业绩 kpi 暂不展示。副标题按开发者截图恢复“按累计参与金额排名，看看谁位列榜首，脱颖而出”；接口实际统计口径仍是当日团队业绩，列表无障碍标签和本人业绩标签保持该口径。

前三名使用人工导出徽章，其余两位数名次。我的排名是开发者明确要求的固定视口底部覆盖层，底29px加设备安全区，列表预留179px加安全区，末行可完整滚到卡片上方。固定区域层级低于公共Header与Popup；卡内部使用Grid/Flex，光晕与星空仅是带例外标记的非交互装饰。

源750px数值保留交给px-to-vw转换；字体沿用已批准微软雅黑。原始浮点颜色保留主题token，底板使用690×144人工PNG，缺少的光晕按原稿圆形图层及裁切参数实现。布局顺序保持标题、列表、本人排名，复用原Grid/Flex及装饰例外。

页面进入加载真实列表，使用共享 DropletLoading/Empty/Toast；失败支持重新加载，公共 HTTP 已提示错误不重复弹出。按开发者要求不包裹 PagePullRefresh、不注册下拉刷新或上拉加载；无分页参数，仅进入页面及失败重试时加载。重新加载清空旧榜与本人数据，卸载、重试替换取消旧请求并忽略晚到响应，不轮询。原文见 docs/yuanbao-rankings-contract.md。

验证：pnpm exec tsc -b、pnpm lint、pnpm test、pnpm build（保留品牌门禁）、git diff --check；浏览器在750/375宽度检查路由、侧栏关闭与激活态、固定卡滚动位置、末行可见与遮挡层级。

## 多语言

固定文案、状态和无障碍标签接入五种语言，静态数值与交互边界保持。说明与富文本标题的处理见 docs/yuanbao-i18n-checklist.md。

2026-09-30 展示术语按 `PROJECT_TERMS.md` 统一：固定文案中的 USDT 显示为“余额”，并使用五种语言对应译文；内部资产标识、选择器值、字段名和后端原文保持原值。该规则覆盖本文历史展示文案说明。
