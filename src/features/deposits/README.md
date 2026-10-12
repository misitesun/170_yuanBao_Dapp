# USDT 链上充值

充值页调用 depositUsdt(account, recipient, input)。recipient 原样取登录 GET /api/users/my/recharge_address，token 取当前环境 VITE_USDT，目标链取 DAPP_CURRENT_CHAIN；不使用截图地址、不推断最低金额、不提交充值POST。

prepareUsdtRecharge 严格验证正十进制金额和非零地址，检查实际授权账户/网络，读取公开 decimals，不传account；拒绝超过Token精度的输入，不四舍五入。通过 parseDappAmountUnits 精确转换一次，再次检查账户/网络。调用既有 writeErc20Transfer：余额检查、标准ERC20 transfer(to,amount)、等待成功回执；不approve、不附加native value。

按账户保存内存阶段，同步防重且跨路由保留。拒签、明确回退或余额/Gas不足允许用户修改输入后手动重试；回执查询等未知结果记为uncertain，后续点击仅Toast要求核对钱包记录，不再发交易。没有取消/恢复接口，不编造到账查询；刷新浏览器会清除内存状态，用户需先核对钱包历史，不能视为转账未发生。

页面默认空金额，提交期间Input/确认禁用，显示ContractLoading。成功回执后按开发者要求显示“充值成功”；后台入账以索引/记录为准。成功后延迟刷新资料，刷新错误独立处理。离页或换账户后不回写旧结果，不自动切链。事实与范围见 docs/yuanbao-deposit-checklist.md。
