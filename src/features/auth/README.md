# 元宝钱包鉴权

对外邀请链接统一通过 `buildInvitationLink` 生成：当前站点origin + `/ref/` + 编码后的真实邀请码，示例 `http://192.168.110.83:5175/ref/Oa0y507g`。链接不包含应用部署前缀 `/h5`；根路径邀请入口由服务器转发至H5。邀请码为空或非浏览器环境返回空串，侧栏和团队页共用此函数，展示与复制值一致。应用内部导航仍使用既有 `/h5/` 部署规则。

开屏参考 HU 的延迟自动授权流程，当前签名协议保持 Login-{timestamp}，POST /api/auth/login。session.ts 管理真实连接地址与已验证会话两种状态；普通请求的 address 来自 provider 查询、连接或事件，不依赖 Token，缓存地址不能作为依据。只有登录 POST 明确省略 address 请求头。钱包切换/断开立即更新地址并清理旧会话；Token 过期保留真实连接地址。

恢复被动读取 eth_accounts，携带 Bearer 与当前地址读取 /users/my，核对成功后进入业务页面，不重复签名。公开登录移除旧 Bearer 和 address 请求头，body 与发送前身份校验仍绑定本轮签名地址。每轮 AbortController 取消旧请求，等待步骤仍用 generation 淘汰迟到结果；POST 成功但 GET 失败保留 Token，重试读取。邀请码只读取链接/本地存储，没有输入框或临时 Token。金额和等级在 user/api.ts 解析；详见 docs/yuanbao-api-integration.md。

2026-10-12 邀请码校验交由后端：链接或本地缓存的非空邀请码即使长度或内容错误，也正常连接钱包、签名后随 POST /api/auth/login 提交。前端只去除首尾空白，空值省略 ref；后端错误沿公共 HTTP Toast 提示并释放本轮授权锁，不增加本地长度拦截或自动修改邀请码。已有 Token 的资料验证重试不受邀请码格式影响。

2026-10-12 手机连接时序修复：accountsChanged先更新真实请求地址；相同地址（忽略大小写）及重复空地址事件不使登录失效。无已验证身份/Token时从无地址到首次连接地址属于正常连接过程，继续等待connect返回再签名；不增加延时或自动重签。真实换号、从已连接地址断开、携带Token时更换身份仍递增generation并清理旧会话，禁止迟到签名/POST回写。tests/yuanbao-auth.test.mjs复现连接返回前的初始事件、签名期间的同地址事件及真实换号/断开。

## 2026-10-16 登录地址快照与请求取消

登录连接返回的地址同时传给 `signDappMessage(message, address)`、登录 body 和 `request` 的 `walletAddress`。按当前要求，只有 `POST /api/auth/login` 另传 `walletAddressHeader: 'omit'`，HTTP 拦截器删除 address 请求头（包括旧默认头或调用方传入的头）；`walletAddress` 仍用于发送前身份校验，不会写入该 POST 的 header。即使最后一次被动账号检查通过，发送前仍可能换号，所以 HTTP 层继续比对已注册的实时地址，已变化或断开则取消发送。登录后的 `/api/users/my` 等请求继续携带正确的 address。

每轮授权以独立 AbortController 管理；登录 POST 和该轮 `/users/my` 验证都传 signal，恢复及资料验证的 GET 还显式传本轮地址快照。成功后的 controller 保留到会话失效，以同样取消 `refreshCurrentUser` 的资料刷新。真实换号、断开、网络变化、clearSession 和卸载时取消旧轮，再用 generation 阻止旧签名、Token、资料或错误写回。`authorizeWallet` 对外 Promise 与 abort 竞速，换号或卸载立即释放等待，不依赖不可取消的钱包 RPC 结束；底层 work 继续被观察，迟到拒绝（包括旧 4001）不产生旧 Toast。过期轮次按 `ERR_CANCELED` 处理，登录页不弹失败 Toast 并释放水滴遮罩；有效轮次的正常钱包 4001 拒签保持原提示。旧轮 finally 不得清除新轮的等待状态；首次连接、同地址重复事件仍按 2026-10-12 规则继续。已存 Token 的恢复不重新签名或 POST。

缓存地址与真实地址不同、以及签名后拦截器读取到新地址，是两种不同原因；当前登录 POST 不发送 address 头，签名和 body 仍不从 `WALLET_ADDRESS` 取值。客户的“地址验证失败”尚未确认由此前竞态触发，需同一次请求抓包及后端日志验证。取消客户端请求不能撤销后端已收到的登录，也不能保证关闭钱包已显示的签名弹窗；旧签名迟到后只丢弃，不为新账号复用。详见 [ADR 0009](../../../docs/decisions/0009-wallet-login-address-snapshot.md)。

## 人工测试点

- 干净首次登录：清理应用会话后用钱包 A 授权，核对签名/body 地址为 A；登录 POST 没有 address 和 Authorization 头，正常取得 Token。
- 旧地址缓存和旧 Token：保留 A 的缓存与 Token，连接 B，先按既有恢复流程核对身份；进入新登录后 body 使用 B，POST 不携带缓存 address 或旧 Bearer，不能进入 A 的会话。
- 各阶段切号/断开：分别在连接等待、签名等待、POST 等待、资料 GET 等待时切换或断开，旧轮立即释放水滴等待，不继续发旧 POST、不回写旧用户或 Token，不弹旧错误；首次连接和同地址事件不应误取消。
- 新账号重试：切到 B 后立即重新授权，即使旧钱包 RPC 尚未返回也能开始新轮；旧签名或旧 4001 迟到不影响 B，不清除新轮 pending 或新 Token。
- POST 后资料请求：登录 POST 无 address 头，但后续 `/api/users/my` GET 仍携带本轮正确地址及新 Bearer；后续资料刷新和其他普通请求的地址策略保持不变。
- 失败及拒签重试：登录 HTTP 失败正常提示并释放等待，可重新授权；有效轮次拒签保持原提示。POST 已成功但资料 GET 失败时保留 Token，重试只验证 GET，避免重复登录 POST。
