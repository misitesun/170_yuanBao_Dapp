# 充值/提现记录静态UI迁移

目标：复用HU_CHAIN_Dapp已有记录页面UI，接入当前充值/提现顶部记录入口，适配元宝主题。

允许修改：deposit-records与withdraw-records新页面模块；deposit/withdraw顶部记录导航与README；router路由/README；相关页面行为测试及本清单。保留全部既有工作。

不做：源项目API、审核数字状态映射、鉴权、合约、真实钱包数据、取消业务、刷新/分页接口、依赖、环境和远程Git变动；公共Header/Tab/Button/Empty契约不修改。

依据：HU_CHAIN_Dapp/src/pages/main/user-recharge-records、user-withdraw-records源TSX/SCSS/README/data.ts。本次为现有代码UI迁移，未声明重新读取或测量Figma。源项目已联调，仅迁视觉结构，数据采用明确标注的本地示例。

源样式值（750px转换源）：充值页main padding30/30/64、卡间距20、最小高度202、padding30、边框1、radius20、标题28/42、次文24/36、meta间距6、哈希间距20；提现页main顶部28/左右30/底64、Tab高度68/gap15、列表顶部30/gap20、卡最小高度146/拒绝202、padding30/radius20、主次字体同充值、取消按钮最小高度60/字体22/顶部20。审核中含按钮的卡实际高度随正常流增长，不能宣称146固定高度。

结构：SecondaryHeader→充值列表；SecondaryHeader→SegmentedTabs→提现tabpanel列表。卡片article，同行Flex，地址可收缩、金额不换行、哈希允许换行。无页面定位例外、无新切图。复用flex/items-center/justify-between/flex-column/字体工具类及公共Empty。源Tab黑色10%边框改当前--app-border，其他配色沿用token；文字采用当前项目“提现”，不迁源项目“提取”术语规则。页头增加静态示例说明。

本地交互：三个提现状态切换示例集；取消提示待接入，不修改列表；记录入口导航、共享返回。空数组使用Empty；默认充值6条，提现保留源静态9/9/5条。示例金额与时间为视觉fixture，地址及哈希标示例，不构成当前业务或账户事实。

桌面滚动条适配：与当前home/card-pack/assets/team/ranking相同，使用路由局部html:has规则复用hide-scrollbar mixin，保持750px的vw和可用宽度一致；不改全局滚动能力或其他页面。

验收：375/750无横向溢出、卡片尺寸/主题、两记录入口与返回、Tab切换/取消本地反馈/空数据渲染；pnpm lint、pnpm test、pnpm exec tsc -b、pnpm build、git diff --check。生产Logo门禁保留。

## 实际验收（2026-09-29）

- 充值及提现顶部记录图标分别进入/h5/deposit/records与/h5/withdraw/records；点击共享返回恢复对应表单页面，再进入正常。记录模块使用当前元宝主题，无新接口或鉴权。
- 750px充值首卡x30/y129.992、690×202；提现已通过首卡x30/y225.984、690×146，未通过首卡同位置690×202，审核中卡含按钮实际高226。375px两页scrollWidth=innerWidth=375，卡宽345。桌面750px隐藏原生滚动条后scrollWidth=750，保留垂直滚动能力。
- 审核中9条、已通过9条、未通过5条及驳回原因正确；非审核中不显示取消操作。取消按钮提示待接入，列表保持9条。运行回归覆盖静态页面允许的依赖边界、空数组Empty、Tab面板关联、取消仅反馈以及两页记录导航。
- 浏览器error/warn日志为空。截图检查：/private/tmp/yuanbao-deposit-records-375.png、/private/tmp/yuanbao-deposit-records-750.png、/private/tmp/yuanbao-withdraw-records-375.png、/private/tmp/yuanbao-withdraw-records-rejected-750.png。
- pnpm build前置lint与260项测试通过；pnpm exec tsc -b通过。生产构建被原有Logo未就绪门禁阻止，没有绕过。滚动条局部适配后另跑pnpm lint及git diff --check，不重复无关测试。未修改HU_CHAIN_Dapp源项目、依赖、环境、远程Git，未提交或推送。
