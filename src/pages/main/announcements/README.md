# 公告列表

顶部通知图标进入/announcements，整张公告卡片进入/announcements/:id。当前已从公开GET /api/notices获取分页真实数据，移除静态示例标记，不发旧Token。title/id/updated_at直接使用，时间含义为更新时间；summary从content的清理后纯文本提取，不声称是后端字段。语言切换会替换第一页并淘汰旧列表。复用PagePullRefresh、SecondaryHeader、Empty、Icon，首次读取不显示加载动画，失败/空数据保持独立状态，下拉等待真实请求，空第一页不显示没有更多了。既有二级页面卡片视觉与公共布局保持，未重新设计。

## 多语言

列表固定提示和无障碍标签接入五种语言；公告标题/正文仍来自后端，保留语言切换请求与旧请求淘汰逻辑。
