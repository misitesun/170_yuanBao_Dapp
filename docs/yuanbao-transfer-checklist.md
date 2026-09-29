# 转账弹窗实现清单（已确认）

用户确认开始，并明确相关图标已在项目内存在。因此复用common/token-baoqi.png（40×40导出，按源插槽48×48展示）及Popup现有Icon cross；不再下载新资源。关闭图标以现有矢量字形加56px圆环适配，保留与原导出字形的差异，不宣称为源切图。下方最初切图计划已被此决定覆盖。

## 目标与范围

依据用户指定Figma NVwAAv12WZx1LiCTqPMNWD / 30229:423，实现资产页转账按钮打开静态居中弹窗。沿用既有静态UI开发范围；弹窗为宝气转账，不从当前明细Tab推导或改为USDT/元气。

允许改动：src/pages/main/assets/内新增TransferPopup组件及私有SCSS、资源目录src/assets/assets/transfer/、AssetsPage转账开关、资产README、本清单及聚焦运行测试。若新增颜色确属公共主题，提升color.scss；当前已有token可覆盖全部所需颜色。保护公共Popup/Input/Header、资产余额/分页/Tab及其他页面，不新增依赖、API/合约、业务费率/额度/精度、环境或远程Git变更。

## Figma量测

通过当前MCP get_figma_data获取完整目标节点。工具不提供get_design_context/get_screenshot；整页1x参考图已保存docs/design-reference/transfer-source-30229-423.png（750×1624），仅作验收。以下为Figma源数值，样式继续使用现有750px px-to-vw流程。

| 图层 | 源坐标/尺寸 | 属性 |
| --- | --- | --- |
| 遮罩30229:582 | 0/0，750×1624 | 黑50%；与公共Popup一致，维持公共遮罩及锁滚动 |
| 面板30229:583 | x40/y486，670×666 | #22065A→--app-box-bg；白20% 2px边框→--app-border-medium；圆角40 |
| 标题30229:597 | x70/y519，64×45 | PingFang SC Regular400，32px，白色 |
| 关闭30229:600 | x624/y514，56×56 | 56圆环白20% 1px描边；内部交叉图标32×32；环层blur10；相对面板左584/上28 |
| 接收地址label30229:617 | x70/y604，112×39 | PingFang SC Regular400，28px白色 |
| 地址Input30229:618 | x70/y663，610×88 | 圆角24，白4%背景，源#FB00FF 1px边框；label底到输入顶20 |
| 地址placeholder30229:619 | x100/y688，252×39 | 28px/400，白50%；文字“请输入对方账户地址”；左右30内距 |
| 数量label30229:598 | x70/y781，112×39 | 28px/400白；前一个输入底到label顶30 |
| 全部30229:599 | x632/y784，48×34 | 24px/400，#41DEFF→--app-cyan，与数量label同一行 |
| 数量Input30229:605 | x70/y840，610×88 | radius24，白4%背景，白20% 1px边框；label底到输入顶20 |
| 数量placeholder30229:606 | x100/y865，196×39 | 28px/400，白50%；文字“请输入转出数量” |
| 宝气图标30229:625 | x612/y860，48×48 | 外部金色矢量含内阴影，内部46×46图像；完整组合48px，输入尾部20px右距 |
| 余额行30229:591 | x70/y958，610×34 | 输入底到余额行顶30；label24px白50%；value24px源#FB00FF，静态示例“78,877392 宝气” |
| 确认30229:607 | x70/y1032，610×80 | radius999，90°#F934FF 0%/#5039FE 50%/#41DEFF 100%；文字28px/600白色；余额行后40，面板底内距40 |

工具未暴露文本lineHeight/letterSpacing：采用源文字框45/39/34作为排版行高属于估算，字距沿用项目默认；字体沿用项目已确认微软雅黑，字形差异在750px截图中核对。源面板中心y819相对1624画板中点+7，本项目复用Popup标准居中，不加硬编码偏移。源地址边框、余额强调及确认首色与公共品牌略有差异，使用现有--app-color、--app-action-gradient对齐当前主题；输入焦点保持公共Input的渐变反馈。

## 语义、组件与资源

正常流：Popup预设标题/关闭→form→接收地址label+Input→数量label/全部同行+Input尾部图标→余额行→确认button。使用Flex、共享Input、ActionButton及Popup预设外壳。所有视觉覆盖只在caller的contentClassName私有SCSS中完成，保持公共开闭/锁滚动/遮罩契约，不重建公共组件。

所需切图：完整关闭组合30229:600→src/assets/assets/transfer/close.svg（56×56图层，保留导出边界）；完整宝气组合30229:625→src/assets/assets/transfer/baoqi.png（1x48×48）。已有common/token-baoqi.png为另一40px组合，避免未经确认直接放大替换源48px组合。沿用开发者此前由AI从Figma导出的授权，在清单确认后下载明确列出的两枚资源，不任意切片。背景/边框/渐变由CSS及既有公共token实现，不下载整块弹窗做页面图片；参考截图不用于实现。

本地交互：输入地址与数量；全部在真实余额缺失时提示“可用余额待配置”，余额显示“-- 宝气”，不拿资产页示例当真实可用额；确认阻止默认提交，仅提示“转账功能待接入”，保留输入，不伪造成功或清空数据。关闭图标/遮罩沿用Popup；关闭完成后清理本地输入，下次打开为空。无接口和合约，暂无真实业务校验规则。

## 验收

750×1624参考图对照及375×812可用性，面板/输入/按钮尺寸、资源文件与槽位几何、无横向溢出；打开/关闭/再次打开、本地输入/全部/确认与回车反馈、底层滚动锁定与恢复，现有资产Tab和分页回归。pnpm lint、pnpm test、pnpm exec tsc -b、pnpm build、git diff --check。生产Logo门禁保持，构建阻断如实记录。

## 实际验收（2026-09-29）

- 已接入资产页转账按钮；TransferPopup放PagePullRefresh外，继续复用Popup预设外壳与关闭生命周期，不影响资产Tab/分页注册。新增Input标签、decimal输入模式、form/dialog语义；表单内Escape请求关闭。
- 750×1624：面板x40/y479.016、670×665.969，与源670×666一致，标准居中使全部y坐标比原稿小7px，符合声明的公共居中适配。输入x69.992、宽610.016/高87.992；确认宽610.016/高80；关闭56×56；宝气图标x612.016、48×48，复用图片自然尺寸40×40且成功加载。750截图与参考图对照，修正尾图标右内距为20px。
- 375×812：面板x20/y238.516、335×334.969；现有px-to-vw对小边框值的保留使总高略大于直接一半，不手动缩放源样式。scrollWidth=innerWidth=375，无横向溢出。两尺寸截图：/private/tmp/yuanbao-transfer-750.png、/private/tmp/yuanbao-transfer-375.png。
- 地址preview-address与数量12.3400输入保留；全部仅提示可用余额待配置；确认和回车仅提示转账功能待接入，仍停留资产页，输入不变。关闭图标触发退出后popupCount=0、bodyOverflow恢复visible，再打开两输入为空。打开时bodyOverflow为hidden。浏览器error/warn日志为空。
- 运行回归覆盖本地输入保留、全部/确认待接入反馈、阻止默认提交、关闭/Escape回调与动画结束重置；资产原充值/提现路由及新增转账开闭继续通过。pnpm build前置lint和261项测试通过，pnpm exec tsc -b通过；生产构建仍在原有Logo门禁失败，未绕过。图标内距修正后再执行pnpm lint与git diff --check通过。未新增依赖、接口、合约、颜色散值，未提交或推送。
