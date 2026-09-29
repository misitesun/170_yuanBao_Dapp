# 公告详情

/announcements/:id公开访问，正整数id请求GET /api/notices/{id}；非法id不请求后端。通过AbortController在路由改变或卸载时中止请求并阻止旧响应展示，加载、失败、重试、返回列表使用既有控件。标题与更新时间来自真实对象，正文经features/notices/content.tsx白名单转React元素，剔除活动元素和事件属性，不直接注入服务器HTML，不再依赖静态sections模型。SecondaryHeader及正常文档流排版保持。本页阅读不擅自记录弹窗已读，只有公告弹窗明确按钮才提交。

## 多语言

详情固定加载、重试和返回文案接入五种语言；后端正文继续由安全 HTML 渲染器原样展示。
