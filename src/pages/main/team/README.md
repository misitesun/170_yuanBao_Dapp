# 我的团队

/team在已验证钱包会话后加载。身份、邀请码与可空等级来自/users/my；统计来自/users/my/statistics；下方明确显示直推成员，只对应/users/my/referrals。level=null显示暂无等级，有等级使用后端name/icon，不默认V1；业绩单位未确认，去掉固定Token/USDT后缀。钱包展示前5位 + 三个英文句点 + 后4位（如0xf39...2266），复制仍使用完整地址；仅本页采用该格式，不改变公共Header。成员maddress已脱敏不重复处理。

邀请码/邀请链接复制真实值，未加载时禁用。链接使用当前站点origin + `/ref/邀请码`，由共享buildInvitationLink生成，不拼接/h5部署前缀；根邀请入口由服务器转发到H5。PagePullRefresh等待第一页、用户及统计，追加只获取直推成员；已有generation隔离旧请求，首次读取不显示加载动画，追加分页使用droplet，空第一页只有Empty。保留Figma 30204:3490既有Grid/Flex结构、背景、卡片及共享样式；等级艺术图以真实icon替代，详细原始视觉参考见docs/yuanbao-team-checklist.md。

开发者最新确认：顶部等级图与成员等级图直接使用API level.icon，不组合独立name文案；level.id=1、level=null或icon为空时不渲染图标。规则不使用用户/成员id。顶部原有当前等级文字标签保留，成员卡无等级时不额外补“暂无等级”。

## 多语言

钱包/邀请/统计/成员区固定标签接入五种语言；等级 name、成员 maddress、业绩字符串与完整复制值不翻译，level.id=1 的图标隐藏规则保持。
