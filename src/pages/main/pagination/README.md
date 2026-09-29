# 资产与团队分页状态

依据开发者要求为资产、团队接入刷新、加载更多和空数据组件。直接消费者只有AssetsContent、TeamContent；不改变PagePullRefresh、卡包分页、路由、钱包状态、env、存储、API或ABI，不新增依赖。回滚边界为两页接线及本目录和页面preview service，不涉及公共组件交互契约。

createListPagination保留页内快照；replace在发请求前同步清空列表、游标、hasMore和加载门控并递增generation，旧首页/追加成功或失败都丢弃。loadMore防重复，成功才递增页码；失败保留游标和原列表供重试。卸载invalidate避免旧请求写入状态。概览只在首页返回时更新，追加页不会覆盖余额或团队统计。刷新过程中保留上次概览，等新首页成功一起更新。

usePreviewList必须在PagePullRefresh子树内使用，注册实际Promise加载函数。首页/追加期间禁用刷新与加载更多，hasMore从首页响应恢复；空列表showNoMore=false。公共组件每次注册从未启用开始，只由之后的新滚动事件启用。空数据和失败分开显示，不能将请求错误当作暂无数据。

当前service是有限设计fixture加载器：资产USDT三页各三条、其它Tab为空，团队两页各两名。250ms用于预览加载状态，不是PHP字段或分页协议。真实API Markdown到位后，单独确认并替换加载器，不沿用fixture当作真实钱包数据。

验证：pnpm lint；pnpm exec tsc -b；pnpm test；pnpm build（保持品牌门禁）；浏览器查看资产Tab空状态及两页新滚动后的有限追加。回归覆盖替换同步门控、旧响应隔离、刷新等待、失败重试、首页概览更新、空数据与末页边界。
