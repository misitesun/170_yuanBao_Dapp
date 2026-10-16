# ADR 0009：钱包登录地址快照与旧请求取消

- Status: Accepted
- Date: 2026-10-16

## 背景

2026-10-16 元宝登录排查中，本地时序复现表明：签名与 body 已固定为地址 A，最后一次账号检查后恰好收到换号事件，HTTP 异步拦截器再读取全局地址 B，会形成 body/header 不一致。该路径与“缓存残留”不同，即使地址只来自实时内存也存在。客户实际遇到的“地址验证失败”尚无抓包或后端校验日志，不能把本地复现等同于生产根因已确认。

## 决策

完整规范集中在 [PHP 接口契约边界](../php-api-contracts.md#login-address-consistency-and-cancellation)，AGENTS 与相关开发/审查 skill 只保留关键检查入口。

- 当前决策：仅 `POST /api/auth/login` 通过 `walletAddressHeader: 'omit'` 省略 address 请求头，包含删除旧默认头或调用方传入的头；同时继续移除旧 Bearer。单轮签名、登录 body 和 HTTP `walletAddress` 元数据仍绑定同一地址快照，用于发送前身份校验，不在登录 POST 的 header 中发送该地址。
- 请求发送前发现实时地址已换号或断开时取消，真实身份变化与卸载还要取消该轮登录及资料验证，并用 generation 丢弃任何迟到结果。对外授权 Promise 与 abort 竞速以立即释放等待，底层不可取消的钱包 RPC 仍被观察，迟到拒绝（含旧 4001）不提示旧 Toast。
- 登录后的 `/api/users/my` GET 和其他普通请求继续携带正确地址，Bearer 使用和签名文本继续遵循当前项目契约。禁止从旧钱包缓存推断当前身份，也不把所有请求冻结到某轮登录地址。
- 保留首次连接和同地址重复事件的正常流程；旧请求取消不产生失败 Toast，不得影响新 Token 或新 pending 状态。
- 主动取消不能证明后端没有执行；客户端必须继续隔离迟到结果。缺少抓包证据时，不从错误文案单独推断是缓存、前端或后端故障。

## 后果与验证

元宝在 feature 层绑定签名地址和登录请求的 `walletAddress` 元数据；HTTP 层先核对发送前地址一致性，再按 `walletAddressHeader: 'omit'` 删除登录 POST 的 address 头。每轮授权的 signal 贯穿登录和资料验证；省略地址头不关闭快照校验或旧轮取消。通用签名助手可接收显式签名地址，仍不包含登录原文或 PHP 字段。

验证应覆盖登录 POST 无 address/旧 Bearer、旧默认头清理、签名/body 地址快照、后续 GET 正确地址、切换取消、旧轮隔离和原有首次连接行为；人工测试点见 `src/features/auth/README.md`，实际结果以本次完成汇报为准。尚未取得客户录屏、该次生产请求抓包或真实手机复测，不能据此宣称客户故障已确认或已恢复。回退只恢复本次 auth/HTTP/签名助手及其测试和文档，不重置既有工作区。
