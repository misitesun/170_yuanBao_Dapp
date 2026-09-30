# Project terminology
# 项目术语规范

This file is the project-owned glossary for user-facing copy. The base template intentionally defines no product terms or banned words.
本文件用于维护真实项目的前台文案词表。基础模板有意不预置任何产品术语或禁用词。

Before copying visible text from Figma or legacy code, record every confirmed wording rule here. When a design conflicts with this glossary, source code and UI copy follow this file and the mismatch is noted in the implementation checklist.
从 Figma 或旧项目代码复制可见文案前，先在此记录已确认的用词规则。设计稿与本词表冲突时，源码和 UI 文案以本文件为准，并在实现清单中记录差异。

## Confirmed terms
## 已确认术语

以下术语由开发者明确确认，各自适用范围见表格。

| Source term | Approved term | Scope | Reason |
| --- | --- | --- | --- |
| 蓝色卡牌标题 | Yuanbao Premium Card | 首页蓝卡 | 开发者提供卡牌名称截图 |
| 红色卡牌标题 | Yuanbao Collection Card | 首页红卡 | 开发者提供卡牌名称截图 |
| 绿色卡牌标题 | Yuanbao Supreme Card | 首页绿卡 | 开发者提供卡牌名称截图 |
| USDT | 余额 | 全局前台固定展示文案及各语言对应翻译 | 2026-09-30 开发者明确要求；接口/合约字段、内部资产标识、选择器值、环境变量和后端原文保持原值 |
| 释放订单累计收益/今日收益的 USDT 单位 | 元气 | 卡包释放订单中 `totalUsdtIncome`、`todayUsdtIncome` 的展示标签 | 2026-09-30 开发者红框明确指定；此局部规则覆盖全局余额术语，字段与金额保持原值 |
