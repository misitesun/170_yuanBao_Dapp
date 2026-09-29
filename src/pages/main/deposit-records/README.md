# 充值记录

`/deposit/records` 为静态二级页，充值页记录图标进入，复用SecondaryHeader返回。UI迁自HU_CHAIN_Dapp的user-recharge-records模块，保留30px页边距、20px卡间距、202px卡最小高度、30px卡内距、20px圆角、28px主文字和24px次文字。使用当前项目颜色token，不改公共组件。

正常流为Header→列表，卡片为article，地址/金额、时间/金额标签用Flex排列，交易哈希允许换行。无新增切图或定位例外。

与现有业务页面相同，通过页面局部html:has规则复用hide-scrollbar mixin，避免桌面滚动条占宽影响vw；保留滚动。

默认data.ts六条静态示例，页头明确标注；地址和哈希不伪造真实链上值。可通过records传空数组验证公共Empty。没有API、鉴权、合约、复制或伪刷新/分页；后续接入以当前项目契约为准。

## 多语言

固定文案、状态和无障碍标签接入五种语言，静态数值与交互边界保持。说明与富文本标题的处理见 docs/yuanbao-i18n-checklist.md。
