# YBProject 合约部署

## 当前正式部署（2026-10-30）

来源：开发者于 2026-10-30 提供并确认更换的 `bsc.json`，原样保存于 `docs/bsc.json`；schemaVersion 1，projectId 170，deploymentId `project-170-bsc-fresh`。

- network：bsc；chainId：56。
- YBProject：`0x5B17B4b618baFfaF8af8d4aff546c3F85e2160a7`。
- USDT：`0x55d398326f99059fF775485246999027B3197955`。
- VUSDT：`0xfD5840Cd36d94D7229439859C0112a4185BC0255`。
- ProjectTokenWallet：`0x62Bbf88938B1b59810B6758cA0DdEc84aD2631C7`。
- SmartWalletFactory：`0xA5D0cF8DB511b47f0E768FB20E693697B0E9127A`。
- `.env.production` 配置 `VITE_USDT`、`VITE_YB_PROJECT_ADDRESS`、`VITE_YB_PROJECT_CHAIN_ID = 56`；`VITE_BASE_URL`、`VITE_RPC_URL` 保持为空。env 文件仅保存在本地，不纳入 Git。
- 完整 YBProject ABI 位于 `src/services/contracts/ybProjectAbi.ts`，与当前正式部署 JSON 完全一致，共 33 项。相较旧部署的 28 项，构造参数改为 `(initialOwner, usdt_, vusd_)`，新增 `VenusRedeemFailed(uint256)` 错误以及 `emergencyWithdrawFromWallet`、`usdt`、`vusd`、`withdrawWallet` 四个函数；原有 `withdraw` 和 `usedWithdrawIds` 的参数、返回值及可支付性不变。USDT 地址及 ABI 不变，现有通用标准 ERC20 封装覆盖其全部方法，未新增授权调用。
- VUSDT、ProjectTokenWallet 和 SmartWalletFactory 仅保留部署记录，当前前端不直接接入。提现使用 YBProject，充值继续向接口返回的收款地址调用 USDT `transfer`。后台签名配置需匹配正式链 ID、YBProject 与 USDT 地址；前端仍原样使用签名响应中的 token。

## 切换与回退边界

- 旧部署为 `project-170-bsc-v1`，YBProject `0x937a802459F941dD0Ed09530bfD1aeeE3c241D37`，SmartWalletFactory `0xA17cBd87C6bf9f1B617CF215beEfbD6B78d36AE3`。本次只替换前端正式配置、完整 ABI 与部署记录，不改变提现请求、签名参数或页面交互。
- 正式地址在构建时注入；其他构建环境必须同步 `.env.production` 后重新构建和发布，已打开的旧页面仍使用旧构建的地址。本次本地文件更新不代表生产站点或后台已切换。
- 发布前确认 `POST /api/claims` 的签名配置匹配新 YBProject，并核对新工厂对应的 `/api/users/my/recharge_address`、充值入账监听和旧充值地址处理。当前仓库不包含后台实施证据；不能将新工厂或 ProjectTokenWallet 地址硬编码为用户充值地址。
- 提现申请可能已扣余额，旧未完成单需由后台核对处理。签名单仅按账户保留于内存，不含部署标识且不跨整页刷新；不能用刷新页面后重新 POST 代替旧单处理，也不能假定旧签名可在新合约领取。
- 如需回退，恢复上一版本 `docs/bsc.json`、YBProject ABI 和生产 YBProject env 地址后重新构建；同时与后台协调签名配置及未完成单处理，不能仅回退前端就认定业务恢复。

## 开发环境

`.env.development` 保留本地链 31337，YBProject `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`，MockUSDT `0x5FbDB2315678afecb367f032d93F642f64180aa3`。不回退或混用正式地址。

## 提现入口

`withdraw(uint256 id, address token, uint256 amount, uint256 deadline, bytes signature)`，nonpayable，无返回值。

封装 `withdrawYbProject` 接收具名参数，整数使用 bigint，金额为已换算的链上整数，不再次乘精度；签名与 token 原样传入。`POST /api/claims` 的 id、token、amount、expire_time、signature 对应这里的 id、token、amount、deadline、signature。封装不请求接口，claims/flow 编排接口申请与合约领取，提现页面已消费完整流程。

开发与生产环境分别配置 `VITE_YB_PROJECT_ADDRESS` 和 `VITE_YB_PROJECT_CHAIN_ID`。示例环境留空，未配置时调用报错，不回退到测试地址。调用前读取钱包实际链 ID，不匹配时阻止写入并提示，不自动切链或猜测 RPC。钱包应由用户连接到当前环境配置的网络，沿用注入 provider。

通过共享 `writeDappContract` 使用当前连接账户、等待交易回执，并原样传播拒签与回退错误。无 ERC20 授权、无原生币 value，新增 usedWithdrawIds(id) 公共状态读取用于防重复和结果确认，不依赖调用者，不传 account。JSON ABI 本身不能证明合约内部签名验证、付款与权限实现；这部分仍需链上联调验证。

验证入口：`tests/yb-project-runtime.test.mjs` 核对完整 ABI 与部署 JSON 一致，按该部署地址执行提现及公开 used-ID 读取，并验证参数顺序、大整数、无原生币 value、公开读取无 account、错误网络阻断、非法参数、拒签/回退错误传播和环境配置校验；`tests/claim-flow-runtime.test.mjs` 覆盖签名单与重复提交边界。质量门禁为 `pnpm lint`、`pnpm test`、`pnpm exec tsc -b` 和 `pnpm build`。Mock 与构建不证明新合约内部付款、签名校验或主网联调已通过；本次未发起真实钱包签名或交易。
