# 元宝接口联调

## 已确认范围与事实来源

开发者于 2026-09-29 确认开始对接登录、公告、团队、资产，并参考 HU_CHAIN 项目加入独立登录授权页。接口事实来源为 `docs/yuanbao-api-contract.md`（从开发者提供的 Markdown 原样复制）。HU_CHAIN 仅用于独立授权入口、邀请链接、会话生命周期的流程参考；其 PHP 参数、签名协议、临时 Token、业务模型均不复用；开屏视觉与 Galaxy shader 按开发者后续要求参考 HU。

开发环境 `VITE_BASE_URL=http://192.168.110.13:9544`；生产 API/RPC 地址保持为空。所有 API 路径为 `/api/...`，通过 `src/services/http` 请求，不加信封层。金额与业绩保留小数字符串；数据库时间不推断时区。未登录的业务页面进入 `/login`；授权后返回原目标页面，否则进入 `/home`。公告列表及详情公开，showcase 保持开发预览用途。

## 影响与回退

新增 features/auth、user、notices、team、assets 与独立 pages/auth/login。路由接入全局会话恢复与业务门槛；HTTP 仅新增明确的公开/恢复鉴权模式及旧 Token 401 隔离；storage 增加项目邀请码键；DApp 增加无权限弹窗的账户查询。公共布局仅给已有侧栏邀请链接插槽传入真实链接，不改变结构。团队与资产沿用已有分页状态机与公共刷新控件。依赖、合约、远程 Git、充值/提现/转账与其他订单模块不在本次范围。

改动前已有大量静态页面及样式修改，保留这些工作。回退时只还原本次鉴权/API 文件、路由接入及页面数据接入，不整体 reset 工作区；开发环境地址单独恢复，不写入生产域名。

## 登录与邀请

开屏沿用 HU 的星空背景、居中品牌、底部提示与 1 秒后自动钱包授权，不添加表单。清理定时器避免 StrictMode 重复启动；错误后可手动重试，已存 Token 优先被动恢复。Galaxy 使用原生 WebGL 承载 HU shader，无新增依赖。

独立入口 `/h5/login`，根入口也显示同一个开屏；对外邀请入口为 `/ref/:ref`，服务器转发至H5，浏览器路由继续兼容带/不带 `/h5` 的邀请入口，并支持 `/login?ref=...`。团队与侧栏邀请链接由共享buildInvitationLink使用当前站点origin和 `/users/my.referral_code` 组成，不添加 `/h5` 部署前缀；示例 `http://192.168.110.83:5175/ref/Oa0y507g`。邀请码存储键 `YUANBAO_REFERRAL_CODE`，当前链接优先，没有输入框；登录成功、401、钱包切换不清理。没有邀请码时省略 POST 的 ref，不传空字符串。

登录复用 DApp provider、链初始化、连接和签名能力。生成秒级 timestamp，对 `Login-{timestamp}` 原文签名，提交 address/signature/timestamp/ref。仅校验并消费必需 token。普通请求独立携带实时连接的 address；只有登录 POST 省略 address 头且不携带旧 Bearer，body 与发送前身份校验仍绑定本轮签名地址。Token 存储后通过 Bearer 与当前 address 读取 `/users/my` 核对钱包地址，成功后显示业务页面。钱包监听在签名开始前安装，真实账号/网络变化会立即清理会话、abort 旧登录和资料验证并淘汰迟到签名/HTTP 响应。相同有效授权合并为一个 pending Promise，不重复弹签名或提交；旧轮清理不得覆盖新轮。

开发者于 2026-10-12 确认：前端不因链接或本地缓存的邀请码长度、内容错误而阻止钱包授权。非空 ref 去除首尾空白后提交，长度及有效性由 POST /api/auth/login 校验并通过公共 HTTP Toast 提示；空值继续省略。后端的 8 位约束保持，前端不预先拦截。已有 Token 时继续只恢复、验证会话，不因错误邀请码改成重新签名或 POST。

恢复登录使用被动 `eth_accounts` 能力，不请求新权限、不再次签名或 POST。校验失败不进入业务页面；401 清理 Token，网络/解析失败保留 Token 供读接口重试。登录 POST 成功后资料获取失败独立反馈“登录已完成，用户资料验证失败”，下一次授权先重试 GET。HTTP 的旧 Token 请求 401 不得清理当前新 Token。没有临时 Token 或无签名登录路径，即使后端开发环境跳过验签，也仍由钱包签名。

## 页面字段映射

| 接口 | 页面 | 字段 |
| --- | --- | --- |
| POST /api/auth/login | 独立授权页 | request address/signature/timestamp/ref?；response token |
| GET /api/users/my | 登录验证、团队身份、资产余额 | address；referral_code→邀请码/链接；level.name/icon→等级；balance_usdt/energy/bao→USDT/元气/宝气余额 |
| GET /api/users/my/statistics | 团队统计 | team_kpi/kpi/team_count/invite_count→团队业绩/个人业绩/团队人数/直推人数 |
| GET /api/users/my/referrals | 直推成员列表 | id；maddress→展示地址；created_at→加入时间；kpi/team_kpi→业绩；nullable level→等级 |
| GET /api/balance_logs | 资产三币种 Tab | ccy=balance_usdt/balance_energy/balance_bao；id/content/created_at→流水信息；amount+is_inc→金额和增减方向 |
| GET /api/notices | 公告列表 | notices[]；id/title/updated_at/content→标题、更新时间及提取的纯文本摘要 |
| GET /api/notices/{id} | 公告详情 | id/title/updated_at/content；正整数 ID，不复用示例字符串 ID |
| GET /api/notices/pop | 已登录业务页面公告弹窗 | is_show 和 notice 对象或空数组，语言/用户变化后重新查询 |
| GET /api/notices/{id}/read | 弹窗“我已阅读” | 只等待 HTTP 成功，返回 Promise<void>，不解析未使用成功体 |

HTML 正文转换为白名单 React 元素，保留常用文本排版、图片和 HTTP(S) 链接，剔除 script/style/iframe/form/svg 等活动内容及事件属性，不直接注入服务器 HTML。关闭弹窗仅关闭本地显示；点击“我已阅读”才提交已读。游客弹窗不接入，以免依赖文档矛盾的游客已读行为。

列表每页20条，没有 total/has_more 字段；满页继续尝试下一页，短页或空页结束。替换第一页时同步清空列表/游标/hasMore，禁用追加，已有 generation 丢弃旧请求。下拉刷新等待真实首页与概览，追加不重复读取概览。loadingIndicator 使用 droplet，空第一页不显示“没有更多了”。数值0不是缺失值，缺失/无效字段报错；加载前展示占位，不展示 fixture 金额或V1。

## 明确保留的缺口

- 老用户再次登录是否强制提供邀请码：文档说已有用户必须有效 ref，但未区分注册/再次登录；按开发者要求只从邀请链接读取；缺失时省略 ref 并遵循后端错误，不添加输入框或猜规则。
- 业绩单位未确认，团队移除固定 Token/USDT 后缀。
- 大型等级艺术图没有等级专属资源契约，实际用 level.icon；level=null 显示暂无等级，不伪装成V1。
- `/api/notices/{type}` 文档注明500，未接入；游客已读章节互相矛盾，未接游客弹窗。
- 充值、提现、转账、拍入/拍出订单接口缺失，保持既有待接入反馈。释放订单本次不纳入接入范围。
- 本次只有钱包签名登录和 PHP 查询，不写合约，因此不需要猜 ABI、合约地址或 RPC；后续合约逻辑另按文档阶段进行。
- 语言切换影响公告筛选与后端翻译，但静态页面文案的多语言解开/翻译属于项目流程后续阶段，不在本次范围。

## 验证记录

自动测试覆盖 DTO 解析、金额精度、空数组/null、登录签名与提交时间戳一致、恢复不重复签名、钱包切换竞态、登录成功后GET失败重试、旧请求401隔离、三币种映射、公告已读忽略成功体及HTTP失败、HTML白名单、第一页/追加/替换竞态与真实页面刷新。

2026-09-29 公开公告接口实测 HTTP 200，zh-Hans 列表为 {"notices":[]}，服务允许 Content-Type/Authorization/Address/Lang 跨域请求头。真实浏览器检查独立授权、未登录业务门槛、邀请码入口及公开公告空状态；本地无连接钱包，未提交远端登录或已读操作，团队/资产的真实账号响应与钱包签名需开发者在钱包浏览器验收。

构建、lint、类型检查和全量测试的最终结果以本次完成汇报为准；生产品牌资源护栏保持启用，不能绕过护栏宣称正式打包通过。

最终本地验证：pnpm test（284/284通过）、pnpm lint（无警告）、pnpm exec tsc -b、git diff --check均通过。pnpm build在lint/测试通过后被公共品牌占位Logo护栏阻断；另行pnpm exec vite build完成源码/样式编译，存在既有大chunk提示，不作为正式构建通过。375px与750px授权页截图检查通过，浏览器无错误日志；375px截图保存docs/design-reference/yuanbao-login-375.png。开发预览本地http://localhost:5174/h5/login，局域网http://192.168.110.83:5174/h5/login。

后续调整：按开发者要求 address 不再与 Token 配对开启，切换地址即时更新、断开移除；401 只清理会话而不伪装钱包断开。入口移除全部输入框，参考 HU 开屏自动授权。新的验证结果见本次完成汇报。

最新验证：293 项自动测试、pnpm lint、pnpm exec tsc -b、git diff --check 通过。登录回归采用开发者截图中的 created_at=-0001-11-30 00:00:00，验证 DTO 解析、会话进入 authenticated 及开屏导航。375px/750px DOM 边界无横向溢出，开屏无输入框，浏览器无 error/warn。截图保存 yuanbao-splash-375.png；浏览器无真实钱包，未重复远端登录，真实钱包需刷新后验收。pnpm build 经完整检查后仍被品牌 Logo 未就绪护栏阻断。

## 2026-10-16 登录地址一致性修复

`requestWalletLogin(body, signal?)` 把 `body.address` 显式传给 HTTP `walletAddress`，并设置 `walletAddressHeader: 'omit'`；`signDappMessage(message, address)` 使用同一轮地址。只有该登录 POST 省略 address 头，拦截器会删除旧默认头或调用方传入的 address；`walletAddress` 仍用于发送前实时地址校验，不读取业务 body。若已注册的实时地址不再相同或已断开，则按取消处理，不发旧 POST。每轮授权 signal 同时传给登录和资料验证，换号/断开/网络变化/清会话/卸载使旧轮 abort，generation 继续防止迟到写入。

资料 GET 和其他普通请求继续携带正确地址；首次连接/同址事件容忍、已存 Token 恢复不重复 POST、邀请码后端校验及登录成功后资料失败保留 Token 等行为保持。成功会话保留 controller，后续 `refreshCurrentUser` 也使用同一生命周期的 signal 与地址快照，换号时一起失效。此前竞态已有本地复现，当前省略登录 address 头的调整按开发者要求执行，尚未证明是客户“地址验证失败”的生产根因；后续核对同次请求的 body、address/Bearer 头是否确已省略和后端验证分支，不能仅从错误文案判断缓存或责任点。规范与取消限制见 [ADR 0009](decisions/0009-wallet-login-address-snapshot.md)。
