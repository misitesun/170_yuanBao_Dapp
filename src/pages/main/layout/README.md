# Main application layout

开发者最新确认恢复侧栏“全部资产”跳转：点击导航到 `/assets` 并关闭侧栏，staticPreview可本地选中资产项。侧栏“抢拍卡片”“我的卡包”“排行榜”仍暂未开放：SIDEBAR_ITEMS对应三项设置unavailable，正式点击阻止NavLink导航并用共享Toast提示“暂未开放”，保持当前路由、高亮和侧栏；staticPreview也仅提示，不改变本地选中。首页、社区继续原导航与关闭行为；现有页面及其他入口不改。这一规则覆盖下方历史导航说明。

排行榜通过SIDEBAR_ITEMS新增第六个入口“排行榜”，使用68px人工图标并导航到 `/ranking`。继续复用既有菜单项结构、选中样式与点击关闭行为；排行榜固定底卡层级低于Header与侧栏Popup。

首页设计适配在Header既有右插槽内按钱包、通知、语言、菜单排列；通知/语言使用手动导出的52px图标，钱包仍取真实store，通知使用useAppNavigate进入`/announcements`，staticPreview不导航。菜单继续使用MenuToggleIcon的连续开关动画，100pxHeader、侧栏控制与Popup契约保持原有结构。公共颜色从color.scss读取，未修改鉴权行为。

2026-09-30 导航图标背景更新：通知使用开发者补充的 `Group 2085666468.png`（`header-notification.png`）；语言现有 `header-language.png` 与补充的 `Group 181.png` 完全一致，无需替换；菜单使用 `Group 286.png`（`header-menu.png`）作为52×52背景，前景继续由 `MenuToggleIcon` 绘制并保持开关动画。三个入口的大小、顺序、交互和无障碍标签不变。

`MainLayout` is the reusable first-level shell. It combines the project brand, language switch, optional wallet-address chip, and exactly one navigation mode: `tabbar` or `sidebar`.

`MainLayout` 是可复用的一级页面外壳，组合项目品牌、多语言切换、可选钱包地址摘要，以及 `tabbar` 或 `sidebar` 二选一的导航模式。

Both menus reuse the home route from `MAIN_PAGE_ITEMS`. `SIDEBAR_ITEMS` adds the confirmed artwork and implemented auction, card-pack, assets, team and ranking routes.

首页路由来自 `MAIN_PAGE_ITEMS`；`SIDEBAR_ITEMS` 补充设计切图及已实现的抢拍、卡包、资产、团队、排行榜页面路由，不注册空路由。

`staticPreview` disables brand navigation and real wallet data for isolated visual checks. An optional `previewWalletAddress` displays a local fixture without changing authentication state. It does not emulate device chrome.

`staticPreview` 关闭品牌跳转和真实钱包数据；可选 `previewWalletAddress` 仅展示局部示例，不修改鉴权状态，也不模拟设备外壳。

## Sidebar presentation

侧栏从固定顶部栏下方向右侧滑入，铺满剩余视口；保留模板 100px（750px 设计宽度）顶部栏，不复制业务项目的路由或 API。`HeaderBar.sidebarOpen` 驱动菜单图标 250ms 连续反向动画与控件隐藏；品牌及关闭按钮留在顶部栏。菜单复用已有首页配置，并显示六个已确认的设计菜单。

钱包卡片始终展示，名称和连接状态读取现有 `useDappStore.walletAddress`；未连接时名称为 `--` 并显示未连接状态。`staticPreview` 可通过 `previewWalletAddress` 展示独立示例地址。邀请条读取可选 `invitationLink`，默认空串，空值时复制按钮禁用；没有邀请接口。`WalletOrbitBorder` 提供对称环绕高光，减少动态效果时静止。紫色使用侧栏专用主题 token。

侧栏局部允许透明 Popup 遮罩以衔接顶部栏，其他 Popup 保持共享遮罩契约；Popup 负责锁滚动与退出卸载。Escape、已有路由菜单项和顶部关闭按钮关闭侧栏；待开发项仅本地选中。


## YuanBao sidebar / 元宝侧边栏

Source: Figma `NVwAAv12WZx1LiCTqPMNWD`, node `30121:4877`. Device chrome is excluded; the existing 100px header remains stable. AppBrand accepts optional `logoSrc` / `showName` for content adaptation. Its default consumers retain their existing branding.
依据为上述 Figma 节点；不实现设备状态栏，保留 100px Header。AppBrand 通过可选资源和名称开关适配内容，默认调用方契约保持稳定。

The invitation copy action uses the shared clipboard boundary when a link is supplied. The card is always visible and the link defaults to empty. The header divider uses the developer-supplied 270-degree gradient at its original scale, traveling continuously left to right with a three-second cycle and a seamless repeat-x wrap. Reduced motion keeps it centered. The design's exit action is intentionally omitted. Implemented sidebar entries navigate to their pages and close the sidebar.
邀请链接非空时才通过公共剪贴板复制，保留成功/失败 Toast。卡片始终可见，邀请链接默认空。Header 装饰线使用开发者提供的270度渐变，保留原始比例，每圈3秒从左向右连续循环，背景移动一倍视口后无缝衔接；减少动态效果时居中静止。退出按钮继续忽略；抢拍卡片、我的卡包、全部资产、社区分别接入 `/auction`、`/card-pack`、`/assets`、`/team`，点击后关闭侧栏。

Measured properties and verification constraints are recorded in `docs/yuanbao-sidebar-checklist.md`. Preview: `/h5/showcase/components/sidebar` (development only); it never changes wallet/auth stores.
设计量测与验收约束见清单；预览仅在开发环境提供，不修改钱包或鉴权状态。

## 导航高亮图标

SIDEBAR_ITEMS为六项导航同时配置image与activeImage，未选中使用各项image普通资源，选中使用开发者手动导出的68×68紫色完整PNG（menu-*-active.png），不使用CSS filter重新着色。SidebarMenu的图标、文字和箭头由同一个active状态驱动：正式导航使用NavLink的isActive，staticPreview沿用本地selectedItem，预览不写路由或钱包状态。资源映射见docs/yuanbao-sidebar-checklist.md。

首页与排行榜未选中资源均已补为开发者提供的白色68×68原图：Frame 30.png对应menu-home.png，Frame 1312317122.png对应menu-ranking.png。选中时继续使用各自紫色menu-*-active.png，不改选中逻辑、布局或样式。

元宝接口接入后MainLayout仅从会话user.referralCode构造邀请链接，传入SidebarMenu现有invitationLink插槽；staticPreview仍传空字符串，不改变公共结构、复制封装或退出按钮原有范围。邀请链接与团队页统一使用buildInvitationLink：当前站点origin + `/ref/邀请码`，不带 `/h5`；应用部署目录仍为 `/h5/`，根邀请入口由服务器转发至H5。

## 多语言

导航标题和语言入口无障碍标签补齐五种语言；LanguageSwitch 与 SidebarMenu 的结构、钱包展示、菜单可用状态和路由行为保持。
