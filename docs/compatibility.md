# Compatibility-sensitive behavior
# 兼容性敏感行为

## 元宝卡包分页与刷新（2026-09-28）

卡包路由局部复用PagePullRefresh，默认列表为两页有限设计样本，未接入真实API。第一页或Tab替换期间同步清空列表/页码/hasMore并关闭加载更多；generation阻止旧请求结果和错误写入新Tab。首次滚动追加3→6，空Tab只展示Empty，恢复默认Tab先保留第一页3项。观察器与fallback注册均从未启用开始，历史window.scrollY不触发下一页。新增运行组件与页面状态行为测试，覆盖新scroll启用、重复事件防重和下拉等待真实Promise；实体手机触摸仍未验证。

750与375视口均无横向溢出，图片全部加载，首页与侧栏卡包跳转关闭导航并恢复body滚动。该路由通过html:has(.card-pack-page)隐藏桌面常驻滚动条，避免其占宽影响vw还原；其它页面样式保持不变。精确量测、默认微软雅黑设计差异和截图见docs/yuanbao-card-pack-checklist.md。

This file records runtime behavior that is known to differ across browser, wallet, host, or H5 deployment environments. Do not add speculative entries; each entry needs observed evidence, a regression test, or a reproducible manual verification.
本文记录已知会随浏览器、钱包、宿主或 H5 部署环境变化的运行时行为。不要添加猜测性条目；每项都需要已观察到的证据、回归测试或可复现的人工验证。

## Current contracts
## 当前契约

### Wallet transaction rejection

Viem can wrap a wallet provider rejection inside contract errors. `getDappUserRejectionMessage()` follows `cause` and treats only numeric provider code `4001` as cancellation. Future transaction pages should show the innermost provider message with neutral feedback, or the localized cancellation fallback when no message is available. Other failures should retain their existing error feedback. The regression test constructs real viem wrapper errors; wallet UI still requires manual verification.

viem 可能把钱包拒签包装在合约错误内。`getDappUserRejectionMessage()` 沿 `cause` 查找数字错误码 `4001`。后续接入交易页面时，应以普通提示展示最内层钱包原始消息；缺失消息时使用本地化取消文案。其他失败仍按原错误处理。回归测试覆盖真实 viem 包装结构；钱包界面仍需人工验证。

### Delayed injected wallet provider

Wallet injection can arrive after the page starts. `src/services/dapp/provider.ts` uses `@metamask/detect-provider` with a bounded optional wait; the project authentication or connect flow decides when that wait is required. Preserve this capability unless a tested wallet-compatibility change supersedes it.
钱包注入可能晚于页面启动。`src/services/dapp/provider.ts` 用 `@metamask/detect-provider` 提供有上限的可选等待；真实项目的鉴权或连接流程决定何时启用。除非有测试过的钱包兼容性改动替代它，否则保留该能力。

### Flutter host bridge

Flutter bridge calls are guarded by runtime availability checks. Native message names and upload protocols are project contracts and are not built into the generic upload service.
Flutter Bridge 调用受运行时可用性检查保护。原生消息名和上传协议属于项目契约，不内置在通用上传服务中。

### EIP-7702 user-context reads

An `eth_call` without `account` or `from` can execute under an empty-address context for a delegated account. When a read derives user assets, orders, rewards, eligibility, or permissions through `msg.sender`, its business wrapper must pass the connected address. Public configuration, market data, and token metadata remain account-free.
委托账户的 `eth_call` 若没有 `account` 或 `from`，可能在空地址上下文执行。读取若通过 `msg.sender` 推导用户资产、订单、收益、资格或权限，业务封装必须传入当前钱包地址。公共配置、行情和 Token 元数据仍应不传账户。

### `/h5` history fallback

Some deployments serve the same HTML for root paths and `/h5/...` without redirecting. `AppBrowserRouter` must accept browser URLs with and without `/h5`, while internal route paths stay prefix-free.
部分部署会对根路径与 `/h5/...` 返回同一份 HTML 而不重定向。`AppBrowserRouter` 必须同时接受带和不带 `/h5` 的浏览器路径，内部路由路径保持无前缀。

The blank template's `/h5` entry redirects to `/home` for static UI preview. The router regression test protects this behavior. A real project's confirmed authentication flow may replace the root element with a login gate; its wallet recovery and HTTP header behavior then need project tests.
空白模板的 `/h5` 入口跳转 `/home`，供静态 UI 预览；路由回归测试保护此行为。真实项目可依据已确认鉴权流程把根路由改为登录门槛，钱包恢复和 HTTP 请求头行为随后由项目测试覆盖。

### Wallet authentication headers

In a DApp wallet host, a stored `WALLET_ADDRESS` may outlive the currently authorized account. `src/services/http/client.ts` therefore does not infer the `Address` header from storage or injected-provider presence. A wallet-authenticated project registers an address provider only after matching the current account to the Token owner. While registered, missing Token or missing checked address removes both `Authorization` and `Address`; an account-only project without that provider retains Bearer-only requests. `tests/http-client.test.mjs` covers these states and the post-401 omission.

在 DApp 钱包宿主中，缓存的 `WALLET_ADDRESS` 可能与当前授权账号不同。因此 `src/services/http/client.ts` 不从缓存或注入钱包的存在推断 `Address`。钱包鉴权项目须在核对当前账号与 Token 关联账号后注册地址提供者。注册期间，Token 或已核对地址缺失时两个鉴权头都不发送；未注册该提供者的纯账号项目仍使用 Bearer。`tests/http-client.test.mjs` 覆盖这些状态及 401 后不再发送鉴权头。

### Route scroll reset

Route pages share the document/window scroller. `RouteScrollReset` sets browser history restoration to `manual` while the router is mounted and calls `window.scrollTo(0, 0)` in a layout effect whenever the normalized pathname changes. This prevents a long or paginated page from leaking its bottom scroll position into the next page, including browser back and forward transitions. Query-string and hash-only changes intentionally preserve scroll because the pathname is unchanged; local scroll containers such as dialogs remain independently owned.

Manual regression: open a long page, scroll to its bottom, then switch to another first-level or secondary route and confirm `window.scrollY === 0` before interacting with the destination. Repeat with browser back and forward. Confirm that changing only a query string or hash does not reset the page, and that dialog/list-local scroll positions are unaffected.

路由页面共用 document/window 滚动容器。Router 挂载期间，`RouteScrollReset` 将浏览器历史滚动恢复设为 `manual`，并在标准化 pathname 变化时通过 layout effect 调用 `window.scrollTo(0, 0)`。因此长页面或分页页面滚到底部后，不会把底部位置带到下一页；浏览器前进与后退也遵循同一规则。仅 query 或 hash 变化时 pathname 不变，会有意保留当前位置；弹窗等局部滚动容器仍由各自组件维护。

人工回归：打开长页面并滚到底部，切换到另一个一级或二级路由，确认操作目标页面前 `window.scrollY === 0`；再用浏览器前进与后退重复验证。仅改变 query 或 hash 时不应重置页面，弹窗和列表内部滚动位置也不受影响。

### Infinite-list observation fallback

`PagePullRefresh` uses `IntersectionObserver` to load the next page when its bottom sentinel approaches the viewport. H5 hosts without that API use passive window scroll and resize listeners with the same 160px prefetch distance. Both paths begin disarmed whenever the current pagination registration becomes active and require a later scroll event; historical scroll position from another tab or data set must not immediately request page two. Pages also keep load-more disabled and `hasMore=false` until their replacement page-one request settles. Regression coverage checks both observation paths and page guards remain present; mobile browser QA verifies one request runs at a time and the finished state stops further loads.
`PagePullRefresh` 默认通过 `IntersectionObserver` 在底部哨兵接近视口时加载下一页。不支持该 API 的 H5 宿主使用被动 window scroll 与 resize 监听，并保持相同的 160px 预加载距离。当前分页注册生效时，两条路径都保持未启用状态，必须等待之后的新滚动事件；其他 Tab 或旧数据集留下的滚动位置不能立即触发第二页。页面在替换型第一页请求完成前也必须关闭加载更多并保持 `hasMore=false`。回归测试覆盖两条观察路径和页面门控，移动端浏览器验收确保每次只执行一次请求，结束状态不再加载。

When a future route combines `PagePullRefresh` with the fixed Tabbar, pass `bottomInset="tabbar"` to reserve the 100px navigation height and `safe-area-inset-bottom` inside the load-more footer.
未来路由将 `PagePullRefresh` 与固定 Tabbar 组合时，应传入 `bottomInset="tabbar"`，在上拉加载区域预留 100px 导航高度与 `safe-area-inset-bottom`。

### SegmentedTabs transparent droplet filter

公共 Tab 动效使用每实例唯一的 SVG 透明度阈值滤镜，保留主题 RGB 渐变，不使用黑色衬底或 mix-blend-mode。同步来源中已观察到旧的黑底混合方式会在带 z-index 的容器下显示黑块，因此保留透明画布方案。水滴连续向内移动，胶囊缩放和透明度使用独立动画，避免中段停留；静态选中面始终使用本项目的 --app-action-gradient。

人工回归：在 750px、375px 视口下，将两个组件实例分别放入普通容器与 position: relative; z-index: 1 的容器，反复点击和用方向键切换，观察四周水滴连续聚合、背景透明、最终渐变不变；快速切换结束后临时粒子应清空。系统减少动态效果开启时直接切换静态状态。测试覆盖组件语义、滤镜实例隔离及主题引用。替换透明绘制实现时必须重新验证上述场景。

### Shared motion timing and orbit-border

Tab 的可见动效统一为 500ms，50ms 清理缓冲仅移除已不可见的粒子。CountUp 默认500 毫秒，数据未加载时调用方保留占位；真实金额始终来自数据层。两者均尊重减少动态效果设置。

`orbit-border` 通过 `@property --orbit-border-progress` 的 angle 插值与 CSS mask 沿圆角边框旋转。不支持注册属性平滑插值的旧 WebView 可能出现跳变；需要支持此类宿主时应在真实设备验收，不能宣称其平滑效果已验证。它占用 `::before`，不应与同一伪元素上的其他装饰混用。

人工回归：在 375px/750px 下使用不同圆角的两张卡片，分别设置 normal/reverse 与镜像起点，检查五秒一圈、中心内容不被遮挡、点击可用。减少动态效果时转圈静止、Tab 和 CountUp 直接呈现最终状态。快速切换 Tab 后粒子应清空，CountUp 卸载后应取消定时器和动画帧；相同余额重渲染不重播。自动回归位于 `tests/segmented-tabs.test.mjs`、`tests/count-up.test.mjs`、`tests/orbit-border.test.mjs`。替换这些实现后重复以上检查。

### Successful mutations with incompatible unused payloads

A real downstream integration observed a button-triggered mutation complete on the backend while an unused nested response field had a type incompatible with a frontend parser reused from a read/detail response. Parsing that field turned HTTP success into a failure Toast and could encourage a duplicate write. Template-derived projects must classify each mutation response before implementation: unused success bodies return `Promise<void>` and are not parsed; values required for a contract call, navigation, follow-up request or download remain strictly validated. Post-success refresh failures use a separate error boundary. Template governance coverage lives in `tests/ai-governance.test.mjs`; each real endpoint must add its own behavior regression. Project endpoint names and payload fields stay in the project repository rather than this generic template.

真实下游项目曾出现：按钮提交已由后端成功完成，但响应中页面不使用的嵌套字段类型与复用的读取/详情解析器不兼容。解析该字段把 HTTP 成功误报成失败 Toast，并可能诱导重复写入。从本模板派生的项目必须在实现前对每个提交响应分类：不消费的成功响应体返回 `Promise<void>` 且不解析；合约调用、跳转、后续请求或下载必需的数据仍严格校验。成功后的刷新失败使用独立错误边界。模板治理回归位于 `tests/ai-governance.test.mjs`，真实接口还需增加各自的行为回归。具体接口名和 payload 字段留在项目仓库，不写入通用模板。

## Adding an entry
## 新增条目

Record the affected runtime, trigger, observed behavior, source file, chosen workaround, validation method, and removal condition. Add a regression test when practical; otherwise record precise manual reproduction steps next to the entry.
记录受影响的运行时、触发条件、观察到的行为、源码位置、选定的规避方案、验证方式和移除条件。可行时增加回归测试；否则在条目旁记录精确的人工复现步骤。

### Sidebar motion and viewport

The right sidebar fills the viewport below the existing 100px design header. Its local transparent Popup overlay is an explicit sidebar-only exception; shared Popup defaults remain intact. Popup retains body-scroll locking during exit. Menu icon reverses within 250ms; reduced-motion snaps the icon and disables wallet decorative animation. The header divider travels continuously left to right in a three-second loop; its one-viewport displacement matches the repeat-x tile for a seamless wrap and stays centered under reduced motion. The wallet card is always visible, and its invitation link defaults to empty with copying disabled; supplied links use the centralized clipboard fallback.

Manual regression: at 375px and 750px check header/panel alignment, no horizontal overflow, connected/disconnected wallet, five language widths, rapid menu reversal, Escape/menu close, body scroll restoration and reduced-motion. Tabbar remains the alternative navigation mode.

### YuanBao verified wallet session

元宝钱包授权页为/login，恢复仅被动读取eth_accounts并查询/users/my，不触发签名；签名消息严格为Login-{timestamp}。钱包事件淘汰所有旧授权结果，HTTP旧Token的401不能清理新会话。React StrictMode清理会增加generation并移除监听/回调，保留Token供第二次mount重新验证。回归位于tests/yuanbao-auth.test.mjs与tests/http-client.test.mjs。

人工验收：带邀请码打开/ref/:ref；取消签名后重试；在签名弹窗/请求期间切账号；刷新页面恢复已登录钱包；更换账号后确认团队/资产不会继续显示旧数据；关闭钱包授权与Token过期都应返回授权页。浏览器无钱包时显示提示与重试按钮。实际钱包签名与真实账号数据仍需钱包浏览器验收，Mock测试不代表后端E2E通过。

开屏匹配 HU 的品牌/星空/底部提示，1 秒后自动授权，没有输入框；有 Token 先被动恢复。HTTP address 全局使用真实连接账号，与 Bearer 独立：无 Token 登录仍发送，401 保留连接地址，钱包切换更新、断开移除。回归补充 tests/yuanbao-splash-runtime.test.mjs 与 HTTP/session 测试。

登录跳转回归：开发者实测 /users/my 返回 created_at=-0001-11-30 00:00:00，旧时间正则拒绝该信息字段，导致 token 已取得而会话未进入 authenticated。用户注册时间现保留原文本，不参与授权校验；对应真实形状测试覆盖解析、会话完成与开屏跳转。

## 元宝多语言

五种语言按需加载；页面 :lang 规则为英文、日文、韩文提供长文本换行。保持既有语言切换后的刷新、新 lang 请求头及金额/钱包原值。范围与移动端验收见 docs/yuanbao-i18n-checklist.md。

## 元宝卡接口版本迁移（2026-10-10）

依据API接口文档 (2).md，前端只接收新版配置enabled字符串和can_sell/can_buy，不兼容旧phase/server_time响应；旧后端会显式加载失败，部署需同步接口版本。权限由服务端布尔值决定，不依赖浏览器时间，双时间窗重叠可以同时操作。卡包订单必须携带product对象或null，取消补请求产品列表。测试覆盖开关大小写、双权限、null产品、缺货无提交、每次一张及成功提交后的刷新失败边界。

## YBProject 本地测试部署

YBProject ABI 和提现写入封装已接入，开发环境地址及链 ID 来自 `project-170-localhost-v1`（31337）。生产地址与链 ID 留空，无测试地址兜底。错误钱包网络在发送前阻止；不改变通用开发环境跳过切链规则，不自动添加网络。当前提现页面尚未调用封装，后台申请成功后的链上领取仍待接入。回退时移除该合约模块与两项 env 字段即可，现有 API 页面不受影响。测试覆盖参数顺序、大整数、错误网络与错误传播；真实签名和回执尚未验证。


## 提现完整 API 与合约流程（覆盖前述“链上待接入”阶段）

提现页已接入 claims/flow：申请前核对授权账户、配置网络，严格消费2xx签名体并原样映射YBProject.withdraw。拒签及明确回执回退沿用本次提取单；未知交易结果仅检查usedWithdrawIds，防止再次发交易。签名过期、2xx参数异常或请求结果不明不允许重新POST。账户切换后不得发起旧用户的领取，状态按账户隔离，跨路由保留。领取回执成功与余额刷新分开提示，无索引刷新延迟，因为用户余额在API申请时已经扣除。

当前接口文档没有恢复/重新签名/取消提取单接口；签名仅保留内存，不跨整页刷新。测试覆盖申请/合约参数、拒签、错误网络、账户变化、过期、未知结果核对、防重复与刷新失败；没有真实钱包签名和交易证据。

## 提交加载展示统一（2026-10-10）

首页购买、抢拍、转账、提现和钱包重新授权保持按钮原文案，提交中通过同步锁阻止重复并显示 ContractLoading 水滴遮罩，完成/失败关闭。错误通过 Toast，公共 HTTP 已提示时页面不重复提示；不渲染提交错误文案。转账遮罩为 Popup 的同级节点，确认弹窗关闭后资产刷新期间仍可显示。

## YBProject 正式部署（2026-10-10，覆盖前述生产配置留空记录）

正式环境使用 `docs/bsc.json` 的 BSC 链 56、YBProject `0x937a802459F941dD0Ed09530bfD1aeeE3c241D37` 和 USDT `0x55d398326f99059fF775485246999027B3197955`，开发环境继续使用本地链 31337。新旧 YBProject ABI 完全一致，提现及公开 usedWithdrawIds 调用契约不变。实际钱包网络必须与当前环境配置一致；签名 token 和金额仍由后台返回并原样透传。回退可恢复上一版本 ABI 与生产 env 配置，部署前后台签名配置必须与目标部署一致。验证覆盖正式链调用及错误网络阻止；没有真实钱包交易或主网回执证据。
