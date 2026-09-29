# 元宝侧边栏实现清单

## 已确认范围

开发者确认本次先实现 Figma `NVwAAv12WZx1LiCTqPMNWD` 的 `30121:4877` 侧边栏，忽略钱包卡片退出按钮，复用已有双高光环绕动画。

- 目标：五项导航、钱包卡片和对应紫色主题。
- 允许修改：main layout、sidebar 配置、相关公共颜色、设计资源、开发 showcase、相关测试和文档。
- 范围之外：其他业务页面、API/ABI、鉴权、环境配置、依赖、远程 Git、正式 Logo 就绪状态、多语言翻译解锁。
- 依据：Figma 图层数据、开发者手动导出的 PNG、`PROJECT_TERMS.md`、公共布局文档和已有 `WalletOrbitBorder`。
- 验证：`pnpm build`、`pnpm exec tsc -b`、`git diff --check`，750px/375px 浏览器截图和本地交互。

## 影响关系

`SIDEBAR_ITEMS` 从 `MAIN_PAGE_ITEMS` 复用首页路由，补充四项未开发页面的本地选中项，不注册虚构路由。Sidebar 仍由 MainLayout 控制，继续使用 Popup 管理退出卸载和滚动锁定。Header 使用现有 AppBrand 的可选资源/隐藏名称参数，保留原有槽位和交互结构。AppBrand 未传新参数的调用方保持原先默认行为。

复制仍调用公共剪贴板方法；真实钱包地址来自已有 store。开发预览传入局部示例地址，不修改 wallet/auth store。回退时可撤销本次 layout、资源和配置改动，不涉及数据迁移。

## Figma 量测

以下为源画板数值，直接交给现有 750px px-to-vw 流程。Figma 画板为 750×1624；顶部 28px 设备状态栏不属于 H5，浏览器对照尺寸为 750×1596。下表 y 坐标仍为 Figma 原始坐标，浏览器对应值减 28。

| 图层 | 实测属性 |
| --- | --- |
| 侧栏 | 背景 `#150336`，背景模糊 10px；复用 100px Header 下方的 Popup |
| 导航 | x40、宽670，首项 y190、单项高68，纵向 gap48 |
| 导航文字 | 相对项 x98、y13，PingFang SC 400，字号30、文字框高42；选中 `#AB44FF`，普通白色 |
| 图标外框 | 68×68、圆角12、白色6%背景、白色20%/1px边框；整体使用原始 PNG |
| 图标内容 | 首页42、抢拍38、卡包36、资产32、社区40；由导出资源保留 |
| 箭头 | 20×20，项内 x650、y24，选中紫色，普通白色50% |
| 钱包卡片 | x40、y1320、670×274、圆角40、背景 `#22065A`、边框2 |
| 卡片边框原始渐变 | 135°；紫色10%/20%，紫色100%/50%，品红40%/57%，紫色10%/80% |
| 重叠徽标 | x76、y1290、100×100，背景 `#11022B`、紫色1px描边；内部元宝82×82，居中 |
| 钱包名称 | x70、y1406，Poppins 500/32，文字框48高 |
| 已连接状态 | x302，PingFang SC 400/20，绿色 `#00FF48`；圆点8、间距10 |
| 地址条 | x70、y1484、610×80、圆角999，padding8/20、gap16、白色4%背景 |
| 地址条描边 | 1px，90°：品红100%于0%/100%、透明于16%/84% |
| 地址条内容 | 链接图标48；地址Poppins 400/24、白色50%；分隔线1×32、白色20%；复制图标32 |
| Header 元宝 | 58×58；保留公共Header既有30px水平padding，Figma图层x27不强行改公共布局 |
| Header 装饰线 | 270°，粉色20%/40%、100%/50%、20%/60%；2px高，`matrix(1,0,0,-1,0,0)`，按开发者更正保留原始背景尺寸和静态居中高光 |

## 资源与语义

| 开发者导出 | 项目语义路径 |
| --- | --- |
| Frame 30.png | `src/assets/common/menu-home.png` |
| Frame 1312317123.png | `src/assets/common/menu-auction.png` |
| Frame 1312317125.png | `src/assets/common/menu-card-pack.png` |
| Frame 1312317123 (1).png | `src/assets/common/menu-assets.png` |
| Frame 1312317122.png | `src/assets/common/menu-community.png` |
| image 4898.png | `src/assets/common/yuanbao-logo.png` |
| Group 181.png | 复用相同的 `src/assets/common/wallet-link.png` |
| Mask group.png | `src/assets/common/wallet-copy.png` |
| 箭头节点30121:4991/4998 | `menu-chevron-active.svg` / `menu-chevron.svg` |

610×80 的地址条组合切图包含复制图标，采用实测背景与独立按钮实现，避免把按钮嵌进不可交互的图片。未使用其他页面背景或退出图标。

- 导航复用 `nav`；已存在页面用 NavLink，待开发项用带 `aria-pressed` 的 button。
- 邀请链接复制用 button；邀请链接默认空，空值时按钮禁用；钱包名称仍调用现有 `maskWalletAddress`。
- 复用 Popup、Toast、AppBrand、Header、菜单开关、剪贴板和 `WalletOrbitBorder`。
- 复用 `.flex-center` 等共享布局工具；该卡片无适用的通用 mixin，不新增重复 mixin。
- 页面特例：元宝徽标覆盖卡片边缘；SVG仅绘制非交互边框。正文使用 Flex/Grid 正常文档流，钱包卡片用 `margin-top:auto` 保持底部位置。
- 公共颜色提升到 `color.scss` 侧栏 token；一次性边框渐变留在 layout SCSS。

## 已知差异和估算

- 项目未包含 Poppins 字体文件，英文字体声明 Poppins 后回退 Inter/sans-serif；因此不能宣称英文字符轮廓与 Figma 完全一致，名称区域在回退字体下可能省略。
- 工具未提供地址文字的显式行高，使用36px（24px字号的1.5倍），属于估算；状态行高保留字体正常行高。
- 环绕动画的12秒周期、335px高光长度和分段模糊来自已有实现，不是 Figma 实测运动数据；颜色采用图层紫/品红。双高光相隔半周移动，起始峰值朝右上/左下，不以静态截图冻结动画相位。
- 钱包名称替换设计示例串为真实地址摘要；退出按钮按开发者要求省略。未发现已确认术语冲突。
- 375px下细描边沿用项目现有最小像素转换规则，不手动缩放描边。

## 验收记录（2026-09-28）

下述为初次实现的历史验收，钱包显示条件和链接语义已由本节后的开发者更正覆盖。

- 750×1596：DOM量测菜单 x39.99、首项y162、行高68、gap48；卡片 x39.99/y1292.01/宽670.02/高273.99；地址条 x69.98/y1456.01/宽610.03/高80。小数误差来自vw浏览器布局取整。
- 375×798：文档宽375，无横向溢出；卡片宽335.02/高136.99。设计资源均加载成功。
- 开发预览：菜单本地选中正确、地址复制显示成功Toast、Escape退出后卸载并恢复body overflow，再次打开正常。浏览器剪贴板读取接口返回空串，完整系统剪贴板内容未通过该接口验证；调用参数与公共剪贴板测试仍验证完整地址传递。
- 实际首页：开关正常，首页NavLink点击后关闭侧栏，未连接钱包时卡片不显示；预览控制台未发现warning/error。
- 动画：实际计算的stroke-dashoffset随时间变化，周期12s，双高光不遮挡按钮；减少动态效果的既有CSS保护保留，未在本次切换系统设置验收。
- 开发预览路径：`/h5/showcase/components/sidebar`，仅开发环境注册。
- `pnpm build` 的lint与228项测试通过，但Logo占位门禁阻止正式构建；不修改门禁。
- `pnpm exec tsc -b` 与 `git diff --check` 均通过。

后续：继续静态页面并补齐四项真实路由；Poppins资源到位后再对照英文文字。接口和合约接入遵循 `PROJECT_WORKFLOW.md` 后续阶段。

## 开发者更正（2026-09-28）

- 导航栏光效按开发者粘贴的CSS修正：取消200%背景尺寸和2秒背景位移动画；保留750px设计宽度对应的100%宽、2px高、270度渐变和垂直翻转。
- 取消钱包地址存在才显示卡片的条件，实际首页和静态预览均展示卡片。无钱包时显示 `--` 与未连接状态，不写入虚构钱包地址。
- 地址条更正为邀请链接条，`invitationLink` 默认空串；不猜测邀请地址。复制按钮空值时禁用，有链接时继续使用公共剪贴板。
- 修改范围：Header SCSS、SidebarMenu、卡片状态样式、对应测试和布局文档；不涉及API、ABI、钱包连接流程或退出按钮。
- 更正后验收：实际5176端口首页，393×852无横向溢出，未连接钱包卡片可见，邀请条为空、复制禁用；导航线计算样式为270度原尺寸渐变、2px高、无动画、垂直翻转。750×1596下卡片仍为x39.99/y1292.01/670.02×273.99。lint、类型检查和228项测试通过。

### 导航线动画追加

开发者追加要求导航光效左右无限滚动：保留原始270度渐变和色标，背景宽度保持一倍视口，按开发者明确的跑马灯要求沿水平方向从左向右连续循环，每圈3秒。位移从-50vw到50vw，正好等于100vw背景瓦片宽度，循环首尾呈现相同图案，不再反向折返。背景横向重复保证边缘连续，减少动态效果时恢复居中静止；不修改钱包卡片。

## 导航高亮图标接入（2026-09-29）

依据开发者提供的选中态截图及已下载原图，仅增加侧栏资源配置与选中态切换。六张原图均实测68×68，完整复制原PNG，保留原有图标框与透明度，不重绘、不滤镜着色。样式继续由68px源值经过px-to-vw处理，不改布局、主题、Header、页面路由、鉴权、接口或依赖。图标高亮与文字/箭头统一active条件，正式路由和静态预览两种消费方式均接入。

| 原始导出 | 语义路径 | 菜单 |
| --- | --- | --- |
| Frame 2147236753.png | src/assets/common/menu-home-active.png | 首页 |
| Frame 2147236754.png | src/assets/common/menu-auction-active.png | 抢拍卡片 |
| Frame 2147236755.png | src/assets/common/menu-card-pack-active.png | 我的卡包 |
| Frame 2147236756.png | src/assets/common/menu-assets-active.png | 全部资产 |
| Frame 2147236757.png | src/assets/common/menu-community-active.png | 社区 |
| Frame 2147236758.png | src/assets/common/menu-ranking-active.png | 排行榜 |

验证：核对全部原图映射及尺寸，浏览器检查路由选中、预览本地选中、未选中复原，运行pnpm lint/test/tsc/build和git diff --check。

本次验收：375px真实首页路由只有首页高亮，切到排行榜后侧栏自动关闭；再次展开仅排行榜使用高亮原图，首页恢复普通资源。开发预览逐一选择六项，每次恰好一项高亮、其余五项恢复普通图标，图片无缺失、路由仍停留showcase；控制台无错误。六张目标PNG与原始导出的SHA-256一致。pnpm lint、255项测试、tsc及diff检查通过；生产构建仍被既有Logo未就绪门禁阻止。

## 首页、排行榜未高亮资源补充（2026-09-29）

开发者要求这两项未选中时使用白色普通图标。Downloads中的Frame 1312317122.png与Frame 1312317122 (1).png均为68×68，SHA-256完全一致，实际内容都是白色排行榜柱状图，未包含首页房屋图标。已将该白色原图完整替换src/assets/common/menu-ranking.png，紫色menu-ranking-active.png不变。首页普通menu-home.png目前与高亮原图一致；因缺少白色首页切图，保留原文件并等待开发者补充，不使用滤镜重着色、不误用排行榜图片。

不改SidebarMenu选中逻辑、路由、样式、其他图标、API或依赖；验证非排行榜路由的白色普通图及排行榜路由的紫色高亮图。

本次验证：375px在我的卡包路由展开侧栏，卡包仍用紫色选中资源，排行榜使用新白色PNG，正常加载；首页仍为原紫色文件，缺少普通白色切图，不能标记完成。lint、255项测试、tsc及diff检查通过；构建仍受现有Logo门禁阻止。

## 首页普通图标补齐（2026-09-29）

开发者已补充Downloads/Frame 30.png，实测PNG尺寸68×68。完整复制到src/assets/common/menu-home.png，SHA-256与原图一致（5fe00ab56f84db307ee6a70d971f3c4e1c697ba0b290c9957ce769de392b6580）；menu-home-active.png保持原样。此前首页普通资源缺失问题已解决，现在首页与排行榜均为未选中白色、选中紫色。仅替换资源和更新记录，不改路由、选中逻辑、样式、API或依赖。

验收：375px我的卡包路由展开侧栏，首页与排行榜均显示白色普通图标，卡包保持紫色高亮；切到首页后侧栏自动关闭，再展开仅首页使用紫色高亮原图，其余恢复普通图标，图片全部正常加载（naturalWidth=68）。pnpm build的前置lint及255项测试通过，生产构建仍因现有Logo未就绪门禁失败；pnpm exec tsc -b和git diff --check通过。截图：/private/tmp/yuanbao-sidebar-default-icons-complete.png。
# 侧栏入口暂未开放（2026-09-29，历史确认）

开发者截图指定“抢拍卡片”“我的卡包”“全部资产”“排行榜”点击提示“暂未开放”。仅在SIDEBAR_ITEMS设置四项unavailable并于SidebarMenu点击时阻止默认导航，复用现有Toast；保留当前路由、高亮及侧栏开关，staticPreview也不改变本地选中。首页/社区、现有页面、其他入口、样式、API/钱包均不改。本规则覆盖本文后续历史导航说明。

浏览器逐一点击四项，Toast准确且URL保持/h5/assets；社区仍进入/h5/team并关闭侧栏，首页仍进入/h5/home并关闭侧栏。375px截图：/private/tmp/yuanbao-sidebar-unavailable-375.png；浏览器error/warn日志为空。新增运行回归覆盖真实配置四项、preventDefault、侧栏保留、高亮不变及两项可用导航；staticPreview亦覆盖同一禁用规则。pnpm verify的lint和263项测试、pnpm exec tsc -b、git diff --check通过。未改路由注册、依赖、环境或远程Git，未提交/推送。

# 恢复全部资产导航（2026-09-29，当前行为）

开发者截图明确要求打开侧栏“全部资产”跳转。移除该项unavailable，复用现有NavLink导航到`/assets`并关闭侧栏；预览模式恢复资产项本地选中。抢拍卡片、我的卡包、排行榜保留“暂未开放”；首页三个未开放入口不改。本次仅调整sidebar-config.ts、侧栏行为测试、layout README及本清单，不改路由注册、页面、样式、API、依赖或远程Git。

验证：运行回归测试确认资产链接点击不阻止导航、关闭侧栏且不新增未开放提示，staticPreview可选中资产项；浏览器从首页通过侧栏资产链接键盘激活，进入`/h5/assets`且导航开关变为关闭状态。自动化鼠标定位存在偏移，未将误点卡包的结果计为资产点击验证。lint、264项测试、`pnpm exec tsc -b`和`git diff --check`通过；`pnpm build`在prebuild验证通过后由既有Logo未就绪门禁阻止，未绕过。
