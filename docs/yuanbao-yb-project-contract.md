# YBProject 合约部署

## 正式部署（2026-10-10）

来源：开发者提供的 `bsc.json`，原样保存于 `docs/bsc.json`；schemaVersion 1，projectId 170，deploymentId `project-170-bsc-v1`。地址与开发者消息一致。

- network：bsc；chainId：56。
- YBProject：`0x937a802459F941dD0Ed09530bfD1aeeE3c241D37`。
- USDT：`0x55d398326f99059fF775485246999027B3197955`。
- `.env.production` 配置 `VITE_USDT`、`VITE_YB_PROJECT_ADDRESS`、`VITE_YB_PROJECT_CHAIN_ID = 56`；`VITE_BASE_URL`、`VITE_RPC_URL` 保持为空。env 文件仅保存在本地，不纳入 Git。
- 完整 YBProject ABI 位于 `src/services/contracts/ybProjectAbi.ts`，与正式部署 JSON 及原本地 ABI 完全一致。USDT ABI 保存于部署 JSON，现有通用标准 ERC20 封装覆盖其全部方法，未新增授权调用。
- SmartWalletFactory 仅保留部署记录，当前业务不接入。只有提现使用 YBProject 合约。后台签名配置需匹配正式链 ID、YBProject 与 USDT 地址；前端仍原样使用签名响应中的 token。

## 开发环境

`.env.development` 保留本地链 31337，YBProject `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`，MockUSDT `0x5FbDB2315678afecb367f032d93F642f64180aa3`。不回退或混用正式地址。

## 提现入口

`withdraw(uint256 id, address token, uint256 amount, uint256 deadline, bytes signature)`，nonpayable，无返回值。

封装 `withdrawYbProject` 接收具名参数，整数使用 bigint，金额为已换算的链上整数，不再次乘精度；签名与 token 原样传入。后续接口联调时，`POST /api/claims` 的 id、token、amount、expire_time、signature 对应这里的 id、token、amount、deadline、signature。封装不请求接口，claims/flow 编排接口申请与合约领取，提现页面已消费完整流程。

开发与生产环境分别配置 `VITE_YB_PROJECT_ADDRESS` 和 `VITE_YB_PROJECT_CHAIN_ID`。示例环境留空，未配置时调用报错，不回退到测试地址。调用前读取钱包实际链 ID，不匹配时阻止写入并提示，不自动切链或猜测 RPC。钱包应由用户连接到当前环境配置的网络，沿用注入 provider。

通过共享 `writeDappContract` 使用当前连接账户、等待交易回执，并原样传播拒签与回退错误。无 ERC20 授权、无原生币 value，新增 usedWithdrawIds(id) 公共状态读取用于防重复和结果确认，不依赖调用者，不传 account。JSON ABI 本身不能证明合约内部签名验证、付款与权限实现；这部分仍需链上联调验证。

验证：参数顺序及大整数、错误网络、非法参数、拒签/回退错误传播、环境缺失及非法配置测试；lint、类型检查、构建。未发起真实钱包签名或交易。
