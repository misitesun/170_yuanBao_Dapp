# 充值

`DepositPage` 是 `/deposit` 二级业务页，资产页充值按钮通过 `useAppNavigate` 进入；位于 MainLayout 外，复用 SecondaryHeader 的返回、标题和右侧记录插槽，不改变公共 Header/侧栏。设计参考为其他项目 Figma 29534:12578，量测、资源、适配差异见 `docs/yuanbao-deposit-checklist.md`。

保留信息卡、二维码和提示布局。2026-10-12开发者要求增加金额输入与确认充值，覆盖此前省略表单的决定：信息卡 → 二维码 → 金额form → 提示。Input默认空，使用decimal键盘；ActionButton显示确认充值。Form为Flex正常流，距二维码60px、控件gap30px，复用现有样式尺度；这些为本次功能适配值，非Figma实测。全部配色引用现有公共token，不新增定位。

登录 GET /api/users/my/recharge_address，解析裸对象 recharge_address，校验0x加40位十六进制，保持服务端地址大小写；无查询参数。进入加载地址，失败重试，卸载或重试取消旧请求且不接收晚到结果。未加载成功不允许复制/提交，成功使用共享剪贴板并显示复制反馈。充值链展示BSC20，没有链选择器；币种复用原有余额/USDT选择器，顶部记录入口不变。不添加下拉刷新。

提交经features/deposits调用标准ERC20 transfer(to,amount)，不approve或提交充值POST。Token取当前env VITE_USDT；目标网络取DAPP_CURRENT_CHAIN（生产BSC56，开发本地31337），不根据展示链名称推断网络；转入地址与二维码/复制地址相同，不硬编码截图地址。读取合约decimals进行严格精度校验，金额精确转换一次；超精度不舍入。金额正数、账户/链检查和USDT余额校验通过后调用钱包，等待成功回执。

同步防重，提交期间禁用表单及币种选择并显示ContractLoading。失败保留输入且恢复编辑，结果只Toast；拒签/明确回退可手动重试，未知回执结果跨路由按账户阻止重发并提示核对钱包历史，刷新浏览器不提供恢复。成功清空输入、按开发者文案要求提示“充值成功”，延迟刷新资料，刷新失败不改报转账失败。离页或换账户的旧结果不回写。真实后台入账、最低金额与索引时延仍未验证。

静态示例二维码不用于充值。开发者已批准新增 qrcode.react；地址加载成功后通过 QRCodeSVG 在本地生成二维码，value 原样使用 recharge_address，与页面复制的地址一致，不附加金额或协议前缀。SVG 使用黑白配色、M 级纠错和4模块静区，复用现有四角与白色底板；未加载、失败或重试清空地址时不展示二维码。生成过程不发送第三方请求。信息卡及说明保持正常流布局，无新增定位。契约见 docs/yuanbao-recharge-address-contract.md。

共享 SecondaryHeader 保持既有100px及安全区布局；源设备状态栏不实现。文字行高未被Figma MCP暴露的部分按39/36px排版并记录为估算，字体沿用微软雅黑；记录SVG含描边导出66×66，保留导出原始尺寸。表单采用公共Input/ActionButton视觉与正常流间距，不重建共享组件。

充值币种选择器通过 `Picker.className` 使用页面专属 `deposit-page__coin-picker`，面板背景复用不透明的 `--app-bg`，避免二维码和说明透入弹窗。Picker 经 Popup Portal 挂载到 body，专属样式位于页面根选择器外；公共遮罩、尺寸、动画、选中项及确认交互保持不变。

## 多语言

固定文案、状态和无障碍标签接入五种语言，静态数值与交互边界保持。说明与富文本标题的处理见 docs/yuanbao-i18n-checklist.md。

2026-09-30 展示术语按 `PROJECT_TERMS.md` 统一：固定文案中的 USDT 显示为“余额”，并使用五种语言对应译文；内部资产标识、选择器值、字段名和后端原文保持原值。该规则覆盖本文历史展示文案说明。
