# 充值页实现清单（已确认）

## 范围

目标：实现元宝项目充值静态页，采用Figma 29534:12578的布局，配色对齐当前元宝主题。开发者明确忽略金额输入框与确认充值按钮，删除它们并收拢其布局空间，不保留空白占位。

允许修改：新增src/pages/main/deposit/页面模块与src/assets/deposit/手动导出资源；在src/router/routes.ts、AppRouter.tsx、README.md注册/deposit二级路由；AssetsPage.tsx的充值按钮接入该路由，资产模块README更新入口说明；本清单与必要行为回归。共享色如确实缺失，允许增量更新src/styles/color.scss与样式README，优先复用现有token。

明确不做：充值提交、后端/合约、金额输入、确认充值按钮、充值记录页、真实到账规则、新依赖、环境配置、钱包门槛、远程Git操作及无关页面调整。保持公共Header/MainLayout/SecondaryHeader结构与交互契约；二级充值路由位于MainLayout之外，仅复用SecondaryHeader，避免两个顶部导航。

事实依据：用户指定的跨项目Figma节点；当前AssetsPage/SecondaryHeader/Picker/Icon/Toast/clipboard/路由封装/主题token；AGENTS.md及docs/ai-collaboration.md、architecture.md、layout-standards.md、PROJECT_TERMS.md。

验收：750px画板宽度对照源码参考图并在375px验证无溢出；资产入口、返回、选择器开关、空选项、记录待接入反馈、无地址禁用复制；所有可见图片非空且槽位/比例正确。pnpm lint、pnpm test、pnpm exec tsc -b、pnpm build、git diff --check。保留现有Logo生产构建门禁，如被阻止按实际结果报告。

## 设计读取与实测

当前可用Figma MCP为get_figma_data与download_figma_images，不提供get_design_context/get_screenshot；已用节点数据获取可用精确属性，并仅导出整个画板作为分析对照图，未下载实施切片。截图：docs/design-reference/deposit-source-29534-12578.png，750×1624，不能用于页面整图实现。下表坐标为源设计参考，布局以正常流、Flex/Grid表达，保留750px源值供px-to-vw转换。

| 图层 | 源尺寸/位置 | 字体与结构 |
| --- | --- | --- |
| 画板 | 750×1624 | 原背景#14133F，本项目替换--app-bg |
| 标题 | x343/y62，64×45 | PingFang SC Bold，工具fontWeight=400，32px，居中；复用SecondaryHeader既有32px/600，作为共享组件差异记录 |
| 返回槽 | x30/y72，24×24，图形12×22 | 原白色2px描边；复用公共SecondaryHeader返回，保持既有布局与点击目标 |
| 右记录图标 | x656/y52，64×64 | 保留64×64导出资源，放SecondaryHeader右侧插槽 |
| 信息面板 | x30/y158，690×291 | radius20、白4%背景、白20% 1px边框；对应--app-surface-subtle、--app-border-medium |
| 币种行 | 标签x60/y198，112×39；值x589/y198，75×39 | PingFang SC Regular400/28，标签白50%，值白色，右对齐；行末箭头14×14 |
| 链行 | 标签x60/y267，84×39；值x577/y267，87×39 | Regular400/28，距首行69px，行末箭头14×14 |
| 地址行 | 标签x60/y336，112×39；值x243/y337，407×72 | 标签400/28；地址400/26、右对齐、白50%；复制槽24×24，内部图形22×22/2px白描边 |
| 二维码区域 | x134/y550，480×480 | radius56，原180°蓝色渐变0%透明→50%20%→100%透明，替换为品牌紫色同透明度 |
| 四角 | 每角90×90，顶/底之间gap300 | 保留完整导出形状，单色SVG使用主题色蒙版；不猜测SVG路径或原始圆角 |
| 白色底板 | x194/y609，360×360 | 白色；工具未暴露精确圆角，待人工导出完整底板资源保留原形状 |
| 二维码 | x225/y639，300×300 | 图层明确为“设计专用二维码”，仅作静态设计示例，不能作为本项目充值地址 |
| 底部说明 | x30/y1421，690×108 | PingFang400/24、lineHeight36px、原#FF2D2D，替换--app-red |
| 忽略输入区 | x30/y1130，690×103，radius20 | 整块省略 |
| 忽略确认按钮 | x30/y1273，690×88，radius999 | 整块省略 |

没有设备状态栏内容或预留其高度。源状态栏约29.54px（实例y10、高19.54），与既有100pxSecondaryHeader不同：按公共外壳布局排正文，不修改公共顶部以硬凑源坐标。正文信息面板计划在共享顶部后30px，以原面板左右30px、内部30px间距组织；二维码与信息面板间保留101px。省略输入/按钮后说明移到二维码下60px，不保留原y1421空白。这些正文顶部30px、说明间距60px属于本地适配规则，非独立图层实测值。

工具未暴露文字lineHeight、letterSpacing、部分SVG圆角/描边细节、右图标效果参数；不能把39px文字框高度宣称为行高。实现前用人工资源保留矢量形状；文字未暴露行高按源文字框39/72/45px核对排版，若采用这些行高需标为估算。字体沿用当前微软雅黑，记录源PingFang字形差异。

## 配色、语义与复用

1. 页面依次为SecondaryHeader → 充值信息section（币种/链选择button、地址文本及复制button）→ 二维码figure → 提示列表。正常流用Flex/Grid，四角仅属不承担内容布局的background-art，使用定位时添加layout-exception标记。
2. 页面背景--app-bg（#150336）、品牌--app-color（#AB44FF）、面板--app-surface-subtle、边框--app-border-medium、主文案--app-text、次文案--app-text-muted、提示--app-red。QRCode白底继续--app-text，二维码黑色保留切图。
3. 复用SecondaryHeader右插槽、Picker、Icon、Toast、copyTextToClipboard、useAppNavigate，以及flex/items-center/justify-between/flex-center/tc公共类。必要时复用gradient-card；不新增无实际第二消费者的公共抽象。颜色渐变尽量引用已有token，专属光效留页面SCSS，不在TSX散落色值。
4. 选择器只依据已提供选项展示，不自造币种/网络。当前USDT仅为静态币种示例；充值链/地址未确认，推荐链展示“待配置”、地址“--”、复制禁用；链Picker使用空列表复用Empty。二维码明确标“设计示例”，地址未配置时不声称可充值。顶部记录图标提示“充值记录待接入”。
5. 源稿TRX20、伪地址、最低0.01USDT属于其他项目事实，不复制为元宝规则。推荐说明文字为“请核对充值币种与网络，勿向充值地址转入不匹配的资产。”及“到账条件与最低充值金额以平台实际配置为准。”，等待开发者在确认本清单时批准静态文案；不改PROJECT_TERMS.md新增术语。
6. 本页为静态二级流程，不添加空刷新/加载注册。已有其他页面未提交变更全部保留。

## 所需人工资源（待开发者提供）

| 源节点 | 语义目标路径 | 导出要求 |
| --- | --- | --- |
| 29534:12663 | src/assets/deposit/record.svg 或record.png | 64×64含圆形底的完整记录图标，SVG优先 |
| 29534:12590 | src/assets/deposit/address-copy.svg | 24×24完整复制图标 |
| 29534:12592 | src/assets/deposit/select-chevron.svg | 14×14完整下拉箭头；两行共用 |
| 29534:12603/12605/12608/12610 | src/assets/deposit/qr-corner-{top-left,top-right,bottom-left,bottom-right}.svg | 各90×90、透明底，保留形状，主题色通过蒙版适配 |
| 29534:12612与12615合并导出 | src/assets/deposit/qr-example.png | 360×360，含原白色圆角底板和300×300设计专用二维码，仅静态示例 |

如已下载，开发者提供对应文件名后核对现有Downloads资源；不静默下载任意实施切片。返回图标直接复用SecondaryHeader已有Icon，不需要重复导出。禁止从整页截图裁切资源或把其他项目真实地址当作元宝地址。

当前状态：实现范围与直接下载资源均已确认，已完成页面、入口、资源接入，待最终验证。

## 实现补充（2026-09-29）

开发者已明确授权直接从Figma下载，按清单下载9个资源，无需手动提供。记录SVG导出含描边外扩为66×66，页面保留该根尺寸；复制24×24、下拉14×14、四角各90×90。白色圆角底板单独导出为qr-background.png（360×360）；设计码图API导出为qr-example-56586a.png（308×308），按实测设计槽300×300渲染。这两张独立原图以Grid同格居中叠加，未裁切整页截图、未修改切图字节。全部SVG保留根width/height。

二维码四角通过原SVG透明蒙版和--app-color显示紫色，渐变使用同token的20%透明度，底色/文本/面板/边框/提示复用公共token，不新增全局色值。正文为正常流和Grid，无absolute/fixed页面定位。二维码设计示例说明新增20px上间距和36px行高；说明在该示例标题之后60px展示，新增间距属于功能适配。28px文本行高39px、26px地址行高36px属于工具未暴露源行高时的排版估算。

币种Picker只含USDT静态选项；链Picker为空并显示Empty；地址--，复制禁用。充值记录仅待接入反馈，无真实地址、最低金额或其他项目链规则。资产充值入口使用路由封装，提现/转账继续原反馈。

## 验收结果

750px视口：信息卡x30/y129.992、690×291；二维码框x135/y521.992、480×480；码图x225/y611.992、300×300，白底360×360。二维码按屏幕水平居中（源图x134不完全居中，差1px属居中适配）；共享顶部去除设备外壳后与源正文约1.54px垂直差异来自既有100px Header与30px正文间距，未改共享布局。375px：scrollWidth=innerWidth=375，无横向溢出；四角45×45、颜色rgb(171,68,255)，6个正文img全部complete且naturalWidth非零，4个SVG蒙版均显示正确。两种宽度已截图对照并目视核对资源与配色，输入和充值按钮均省略。

资产充值入口进入/h5/deposit，顶部返回恢复/h5/assets，再进入正常；USDT选择器确认关闭，充值链空选择器显示公共Empty且确认禁用，地址复制禁用，记录按钮提示待接入。浏览器error/warn日志为空。回归覆盖选择器状态、未知链空数据、无真实地址和提交表单、资产充值跳转及提现转账反馈保留。pnpm build前置lint与257项测试通过，随后因既有Logo未就绪门禁失败；pnpm exec tsc -b及git diff --check通过。截图：/private/tmp/yuanbao-deposit-750.png与/private/tmp/yuanbao-deposit-375.png。源码未提交、未推送。

## 真实充值二维码补齐（2026-10-10）

开发者确认新增 qrcode.react。范围限充值页渲染/SCSS、package.json 与 pnpm-lock.yaml、五种语言标签和相关测试文档。页面顺序恢复为信息卡 → 真实充值地址二维码 → 原说明；四角480×480、白底360×360、码图300×300及信息卡间距101px沿用已量测样式，Grid 同格居中，不新增定位。QRCodeSVG 原样编码接口地址，4模块静区、M级纠错、默认黑白，无金额或链协议拼接；不恢复设计示例二维码，不发起链上充值。测试需覆盖未获取/失败无二维码、地址更新或清空不保留旧码、码值与复制地址一致；构建包含完整lint与测试。
