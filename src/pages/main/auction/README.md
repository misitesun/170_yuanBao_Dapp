# 抢拍卡牌

`AuctionPage` 对应 `/auction`，复用 MainLayout 和公共 Header。首页进入抢拍与侧栏抢拍卡片均到达此路由；侧栏点击沿用原有关闭行为。

数据来自Figma静态稿：三种卡牌、价格与每日参与时段，不视为支付参数或库存。立即抢拍显示待接入Toast，不发起API、授权或合约交易。没有数据加载，不启用下拉刷新。

尺寸、字体、颜色、布局与资源核对见 `docs/yuanbao-auction-checklist.md`。正文用Grid/Flex正常流；仅页面背景为非交互定位装饰。页面私有背景与价格图标在 `src/assets/auction/`，共享卡牌、时钟和抢拍按钮在 `src/assets/common/`，与首页引用同一份文件。

开发者确认页面默认使用微软雅黑，替代设计的Alibaba PuHuiTi/PingFang SC。字号、字重、行高与字距仍采用Figma读取值；平台未安装微软雅黑时由系统sans-serif回退，不声称字形与原稿完全相同。Header继续沿用现有公共样式。

## 多语言

固定文案、状态和无障碍标签接入五种语言，静态数值与交互边界保持。说明与富文本标题的处理见 docs/yuanbao-i18n-checklist.md。

2026-09-30 展示术语按 `PROJECT_TERMS.md` 统一：固定文案中的 USDT 显示为“余额”，并使用五种语言对应译文；内部资产标识、选择器值、字段名和后端原文保持原值。该规则覆盖本文历史展示文案说明。
