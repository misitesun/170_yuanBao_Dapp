# YBProject 测试合约

ABI 和原始部署元数据来源：开发者提供的 `localhost (4).json`，schemaVersion 1，projectId 170，deploymentId `project-170-localhost-v1`。当前 YBProject、MockUSDT 地址以开发者 2026-10-10 最新消息为准，覆盖该部署文件中的旧地址。开发者确认本地测试网络已部署，当前仅接入 YBProject；只有提现需要链上操作。

- network：localhost；chainId：31337。
- YBProject：`0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`。
- MockUSDT：`0x5FbDB2315678afecb367f032d93F642f64180aa3`，记录于开发环境 `VITE_USDT`；提现 token 使用后台签名响应原值，前端不覆盖该地址。
- SmartWalletFactory：原部署文件记录 `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`，本次未提供新地址，当前业务不接入。
- `localhost (4).json` 与 `localhost (2).json` 的历史对比：三个合约 ABI 完全一致，chainId 与 deploymentId 相同。本次开发者只提供两项新地址，沿用已有 ABI 和链配置，未重新验证新部署元数据。后台提现签名配置需同步新 YBProject 和 MockUSDT 地址。
- ABI 原样保存于 `src/services/contracts/ybProjectAbi.ts`。不添加管理方法封装。

## 提现入口

`withdraw(uint256 id, address token, uint256 amount, uint256 deadline, bytes signature)`，nonpayable，无返回值。

封装 `withdrawYbProject` 接收具名参数，整数使用 bigint，金额为已换算的链上整数，不再次乘精度；签名与 token 原样传入。后续接口联调时，`POST /api/claims` 的 id、token、amount、expire_time、signature 对应这里的 id、token、amount、deadline、signature。封装不请求接口，claims/flow 编排接口申请与合约领取，提现页面已消费完整流程。

开发环境配置 `VITE_YB_PROJECT_ADDRESS` 和 `VITE_YB_PROJECT_CHAIN_ID`。生产及示例环境留空，未配置时调用报错，不回退到测试地址。调用前读取钱包实际链 ID，不匹配时阻止写入并提示，不自动切链或猜测 RPC。钱包应由用户连接到已部署的本地链，沿用注入 provider。

通过共享 `writeDappContract` 使用当前连接账户、等待交易回执，并原样传播拒签与回退错误。无 ERC20 授权、无原生币 value，新增 usedWithdrawIds(id) 公共状态读取用于防重复和结果确认，不依赖调用者，不传 account。JSON ABI 本身不能证明合约内部签名验证、付款与权限实现；这部分仍需链上联调验证。

验证：参数顺序及大整数、错误网络、非法参数、拒签/回退错误传播、环境缺失及非法配置测试；lint、类型检查、构建。未发起真实钱包签名或交易。


本轮完成提现页面领取接入：先检查实际钱包账户与网络，申请后严格消费签名，再读取usedWithdrawIds并调用withdraw。后续重复点击沿用同一id，未知交易结果只查询、不重发。production地址仍空，运行本地链31337，签名与领取行为需要开发者实际钱包联调。
