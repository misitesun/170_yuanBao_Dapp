# 提现页实现清单（已确认）

## 最新范围修正：恢复完整表单（2026-09-29）

开发者明确要求提现页正常展示输入框和按钮，覆盖此前省略表单的决定；立即按该授权恢复数量输入、输入尾部“全部”和提现按钮，不再要求确认。仅修改提现页面TSX/SCSS/README、本清单及页面行为回归，不修改充值页或公共组件契约，不增加API/合约请求。

源量测：数量标题底部425到输入顶部455为30px；输入690×103、圆角20、1px90°渐变边框、白4%背景，内部左右30px，输入文字28px；尾部“全部”24px、源#41DEFF对应现有--app-cyan。输入底部558到手续费顶部588为30px，手续费24px/34px文字框；手续费底部622到提现按钮顶部682为60px，按钮690×88、圆角999、gap12、90°渐变、文字28px。按现有750px转换保持源尺寸，公共顶部差异与之前相同。

语义与复用：共享Input受控文本输入，inputMode=decimal、关联“提现数量”标签，尾部原生button；数量区改为form，按钮type=submit、阻止默认提交，仅展示待接入反馈。输入不推测精度、额度、最低额或费率；余额未配置时，“全部”提供余额待配置反馈、不写入伪余额。按钮展示正常紫—蓝—青渐变，复用--app-action-gradient与full-button；焦点保持共享Input原逻辑。验收包括输入值保留、全部未知余额反馈、按钮/回车本地反馈、无远程请求及750/375布局。

## 原确认范围（历史，表单排除已被最新要求覆盖）

目标：按开发者“按照充值页面逻辑同样实现”的要求，采用Figma 29534:12621布局，适配当前元宝紫色主题，提供静态提现二级页。沿用充值页排除规则，忽略数量输入框、输入内“全部”操作和提现提交按钮；保留币种、提现链、提现数量标题、可用余额和手续费展示。

允许修改：新增src/pages/main/withdraw/（WithdrawPage.tsx、WithdrawPage.scss、index.ts、README.md）；src/router/routes.ts、AppRouter.tsx、README.md新增/withdraw；AssetsPage.tsx的提现入口及资产README；本清单、聚焦行为回归与设计参考图。若有确实缺失的切图，开发者已授权沿用充值流程从Figma下载至src/assets/withdraw/。优先复用现有相同图标，不重画、不新增依赖。

明确不做：输入或提交、API/合约、真实余额读取、手续费计算或业务规则、提现记录页、地址表单、二维码、全局架构/公共导航重建、钱包门槛、环境变量、Git远程操作、充值页逻辑重构及无关模块调整。

事实依据：用户指定Figma节点、现有DepositPage、AssetsPage、SecondaryHeader、Picker、Empty、Toast和路由封装；AGENTS.md、docs/ai-collaboration.md、architecture.md、layout-standards.md、PROJECT_TERMS.md。项目文案表当前无专属词汇规则。

验证：750px源画板宽度截图对照及375px无横向溢出；资产提现进入、返回兜底、币种/链选择器、空链状态、记录待接入反馈、无输入/提交；充值和转账入口不回退。pnpm lint、pnpm test、pnpm exec tsc -b、pnpm build、git diff --check，生产Logo门禁保持并如实报告。

## 源设计量测

当前Figma工具为get_figma_data/download_figma_images，不提供get_design_context/get_screenshot。已读取整个目标节点的属性，参考图为docs/design-reference/withdraw-source-29534-12621.png（750×1624），仅用于验收、不作页面资产。可读数值严格保留为750px样式源值；布局使用正常流。

| 图层 | 源位置与尺寸 | 字体/结构/颜色 |
| --- | --- | --- |
| 背景 | 750×1624 | 原#14133F，适配--app-bg（#150336） |
| 标题 | x343/y62，64×45 | PingFang SC Bold，MCP weight400、32px；共享SecondaryHeader既有32/600保留 |
| 返回 | 槽24×24，x30/y72；图形12×22 | 2px白描边，沿用SecondaryHeader既有返回 |
| 记录 | x656/y52，64×64 | 同充值页File text 26435:2572组件；充值页相同导出含外描边66×66，计划复用完整record.svg并保留根尺寸 |
| 设备状态栏 | x10/y10，高19.54 | 设计外壳，忽略内容和占位 |
| 信息卡 | x30/y158，690×188 | radius20，白4%背景、白20% 1px边框 |
| 第一行 | 标签x60/y198，112×39；USDT x589/y198 | Regular400/28，标签白50%、值白色；箭头14×14、gap12 |
| 第二行 | 标签x60/y267，84×39；TRX20 x576/y267，88×39 | Regular400/28，标签白50%、值白色；箭头x676/y279、14×14，两行顶差69 |
| 数量标题 | x30/y386，112×39 | Regular400/28、白色，卡后间距40 |
| 可用余额 | x445/y388，266×34 | Regular400/24，#B8C3D4，静态示例4568.2684 USDT |
| 数量输入 | x30/y455，690×103 | radius20、白4%背景、1px原90°渐变边框；整块忽略 |
| 全部 | x642/y489，48×34 | 24px、原#41DEFF；随输入区忽略 |
| 手续费 | x586/y588，134×34 | Regular400/24、白色，示例0.1%，原位于输入底部30px后 |
| 提现提交 | x30/y682，690×88 | radius999、原90°渐变；整块忽略 |

工具未暴露文本lineHeight和letterSpacing；计划按源文字框高度39/34px排版，标为估算而非实测行高。字体沿用充值页的微软雅黑，源PingFang字形差异记录。共享100pxHeader及安全区布局不改，正文距Header30px属于与充值页相同的适配规则；信息卡188px、左右30px，卡内顶40px、左右30px，行gap30px；数量标题与信息卡保留40px，省略输入后手续费放在数量行下30px。省略后的手续费间距为本地适配规则，不宣称其y坐标仍为源588。

## 正常流、语义与复用

1. SecondaryHeader → main → 币种/链信息section → 提现数量/可用余额行 → 手续费文本。Flex负责信息两行及数量摘要，主内容按正常流排列；不新增定位装饰或页面fixed/absolute。
2. 信息两行用button打开现有Picker，保留焦点与开闭；USDT作为静态币种示例，未知网络使用空选项并复用Empty。记录按钮放共享Header右插槽并提示“提现记录待接入”。返回沿用现有SecondaryHeader契约。
3. 配色全部引用--app-bg、--app-text、--app-text-muted/secondary、--app-surface-subtle、--app-border-medium、--app-color，不在页面散落色值。源灰蓝余额文案适配为当前--app-text-secondary。复用flex/items-center/justify-between/min-vh-100等公共类；必要时使用已有gradient-card，不为两个简单行新增公共抽象。
4. 源链TRX20、示例余额4568.2684及手续费0.1%不是当前项目业务契约：链显示“待配置”、可用余额显示“-- USDT”、手续费显示“待配置”。不从资产页静态余额复制为真实可提现金额，不推测BSC钱包链等于提现网络。
5. 提现流程页不注册占位刷新；当前没有请求，也不新增服务层。选择器保持仅本地开闭，后续真实业务以API Markdown单独联调。
6. 路由常量/withdraw不含/h5，置于MainLayout外避免双Header；资产页提现使用useAppNavigate入口，充值路由与转账反馈保持。

## 资源

| 源节点 | 语义用途 | 计划 |
| --- | --- | --- |
| 29534:12680 | 记录图标 | 同File text组件，复用src/assets/deposit/record.svg（66×66导出边界） |
| 29534:12634、12647 | 链/币种箭头 | 14×14，与充值图标视觉相同，复用src/assets/deposit/select-chevron.svg；必要时按已授权流程下载源SVG核对，不重复索要资源 |
| 29534:12628 | 返回 | 复用SecondaryHeader已有Icon，保留共享布局差异 |

背景、信息面板使用CSS边框与主题底色，不下载整块布局作为切图。提现稿无二维码，不沿用充值页二维码图块。

当前状态：开发者已确认开始，实现范围与资源下载方式均已确认。已完成提现模块、资产入口、路由接入及以下验证。

资源核对：源记录与两枚箭头已下载至docs/design-reference/withdraw-icons。记录SVG除Figma节点ID（29534_12680与29534_12663）之外与已有充值资源完全一致；两枚箭头与已有select-chevron.svg字节一致，因此页面复用原资源，无需重复业务切图。保留根尺寸66×66和14×14。

## 首次验收结果（历史，不含表单，2026-09-29）

- 750px：信息卡x30/y129.992、690×188；两行x60、宽630、高39、y169.992/238.992，顶差69px；数量摘要y357.984，与卡片间距40px；手续费y426.984、高34px。源设备状态栏不保留；共享顶部与充值一致，其正文约1.54px的源位置差异来自既有100px Header与30px正文间距。输入及提交省略后手续费上移，符合已确认适配规则。
- 375px：document.scrollWidth=innerWidth=375，无横向溢出。三张img全部complete且naturalWidth为66/14/14，记录与两个箭头在正确槽位。输入框数量为0，无二维码、全部或提现提交按钮。750/375截图已与参考图核对，配色使用当前公共主题token。
- 资产提现按钮进入/h5/withdraw，返回恢复/h5/assets，再进入正常；直接打开提现页且没有应用历史时，返回兜底到/h5/home。币种选择器只含USDT，确定后关闭；链选择器展示公共Empty“暂无可用提现链”、确定禁用；记录按钮提示“提现记录待接入”。浏览器error/warn日志为空。
- 回归测试执行实际提现页面回调，覆盖选择器开闭、未知链空数据、余额及费率占位、无输入/提交、记录反馈。资产入口回归覆盖充值/提现两条路由及转账原反馈，现有充值运行测试继续通过。
- pnpm build前置lint和258项测试通过，随后因现有Logo未就绪门禁失败；pnpm exec tsc -b及git diff --check通过。保持品牌门禁，未更改环境、依赖、远程Git状态。截图：/private/tmp/yuanbao-withdraw-750.png、/private/tmp/yuanbao-withdraw-375.png。源码未提交、未推送。

## 恢复表单验收结果（当前，2026-09-29）

- 已恢复共享Input、尾部“全部”和原生表单提交按钮；输入使用关联label，inputMode=decimal。配色引用公共token与full-button，不改充值页面及公共组件契约。
- 750px：输入x30/y426.984、690×102.992；手续费y559.976、高34；按钮x30/y653.976、690×87.992。保持源输入高度103、按钮高度88及输入前30、手续费前30、按钮前60的间距；共同顶部偏移与首次验收一致。750/375截图均已检查，无横向溢出。
- 375px：输入12.3400后保留原字符串；“全部”提示“可用余额待配置”且不覆盖输入；点击提现及回车均提示“提现功能待接入”，仍停留/h5/withdraw且输入值不变。源码提交回调只preventDefault和本地Toast，没有API/合约调用；浏览器error/warn日志为空。截图：/private/tmp/yuanbao-withdraw-form-750.png、/private/tmp/yuanbao-withdraw-form-375.png。
- 页面运行回归已覆盖输入变化、全部未知余额反馈、提交阻止默认行为与待接入提示；既有选择器/空状态测试保持通过。pnpm build前置lint与258项测试通过；pnpm exec tsc -b、git diff --check通过。生产构建仍在现有Logo未就绪门禁处失败，未绕过门禁、未提交或推送。
