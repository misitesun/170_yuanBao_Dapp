# HU 风格开屏授权

根入口 /、/login 和 /ref/:ref 均显示同一个开屏，位于 MainLayout 和 PagePullRefresh 之外。沿用 HU 的黑底星空、居中 Logo/名称、底部提示与 1000ms 动画后自动授权。无邀请码、账号或密码输入框；ref 从路由/查询链接读取并保留，后续读取本地邀请码。失败显示原错误与重新授权按钮，恢复已登录 Token 不重复签名，成功返回原业务目标或首页。

Galaxy.tsx 保留 HU shader 与开屏参数，使用原生 WebGL，无新增依赖；不支持 WebGL 时保留品牌与提示。Logo 使用当前项目资源，不复制 HU 品牌或登录 API。尺寸沿用 HU 160px Logo、28px 间距、36px 名称、20px 提示、30px 底部距离，交给现有 px-to-vw 管线。视口开屏内容与背景定位例外见 docs/layout-standards.md。

自动授权定时器有卸载清理，StrictMode 重建不会重复触发；session 层合并并发授权且淘汰钱包切换后的旧结果。测试见 tests/yuanbao-splash-runtime.test.mjs。

## 多语言

开屏、重试和已知本地认证错误接入五种语言；错误状态保存 key，渲染时翻译。独立自动授权与无输入框规则保持。

提交反馈统一规则：保持按钮原文案，提交期间禁用重复操作，并通过 ContractLoading 显示全屏水滴遮罩；结束后关闭遮罩。提交结果只通过 Toast 提示，公共 HTTP 错误已提示时不重复提示，不在表单/页面插入提交状态或错误文本。原请求参数、确认步骤与成功后的数据刷新保持。
