# 公告列表与详情实现清单

## 目标与范围

开发者要求新增公告列表与详情、参考HU_CHAIN项目风格，并通过截图指明通知图标入口。沿用dapp-feature-delivery，允许新建两页模块、静态示例、路由注册、Header通知回调、相关README和测试。不改首页/资产/侧栏其他行为、公共组件契约、依赖、环境、远程Git、接口或钱包逻辑。

## 来源与样式

已读取HU_CHAIN的HeaderBar公告实现，实际为Popup加标题/正文，暂无独立公告列表与详情。新页参考其user-recharge-records二级卡片页：页面padding30px 30px 64px、卡间距20px、卡padding30px、圆角20px、边框1px、列表卡最小高度202px。详情补充分节正文、标题36px/54px和段落26px/44px，属于本次阅读排版选择，不是Figma量测值。

列表布局：SecondaryHeader→ul/li→整卡button→标题28px/42px、摘要26px/40px、时间24px/36px及Icon箭头。详情布局：SecondaryHeader→article→标题/时间→分节h2/p。均为正常文档流，复用flex、size、bold、tl、word-ellipsis、auto-btn、hide-scrollbar。背景/文字/边框/表面/按钮全部复用color.scss现有token，不添加页面散落色值。

## 资源、交互与边界

- 复用已有通知PNG、Icon、SecondaryHeader、Empty，无需导出新资源。
- 路由`/announcements`、`/announcements/:id`，Header通知→列表→详情→返回；staticPreview通知不跳转。
- data.ts提供3条明确标注的静态示例，非正式公告、非后端字段定义；空列表与未知id分别显示Empty。
- 正文使用React文本节点，长内容自动换行，不执行HTML。未知id可返回列表。
- 无API/已读提交/鉴权，不照搬HU_CHAIN feature事实，不注册空刷新函数，不改变资源中已有的红点。

## 验证

运行回归覆盖Header入口与预览隔离、列表卡片路由、详情匹配、空数组、未知id和安全文本；浏览器375/750检查页面、入口、详情、返回及无横向溢出。执行pnpm build（包含lint/测试并保留品牌门禁）、pnpm exec tsc -b和git diff --check。

实际结果：浏览器鼠标点击通知进入列表、列表进入对应详情、顶部返回恢复列表；直接打开未知id显示空状态，返回按钮进入列表。375/750下列表及详情的document滚动宽度均等于视口，浏览器warn/error为空。375px列表/详情截图位于`/private/tmp/yuanbao-announcements-375.png`与`/private/tmp/yuanbao-announcement-detail-375.png`。`pnpm build`的prebuild lint及268项测试通过，随后被现有Logo未就绪门禁阻止，未绕过或改变门禁；`pnpm exec tsc -b`、`git diff --check`通过。未联调真实公告接口或生产环境，未提交/推送。
