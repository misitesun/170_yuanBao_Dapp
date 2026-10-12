# 元宝钱包鉴权

对外邀请链接统一通过 `buildInvitationLink` 生成：当前站点origin + `/ref/` + 编码后的真实邀请码，示例 `http://192.168.110.83:5175/ref/Oa0y507g`。链接不包含应用部署前缀 `/h5`；根路径邀请入口由服务器转发至H5。邀请码为空或非浏览器环境返回空串，侧栏和团队页共用此函数，展示与复制值一致。应用内部导航仍使用既有 `/h5/` 部署规则。

开屏参考 HU 的延迟自动授权流程，当前签名协议保持 Login-{timestamp}，POST /api/auth/login。session.ts 管理真实连接地址与已验证会话两种状态；HTTP 全局 address 来自 provider 查询、连接或事件，不依赖 Token，缓存地址不能作为依据。钱包切换/断开立即更新地址并清理旧会话；Token 过期保留真实连接地址。

恢复被动读取 eth_accounts，携带 Bearer 与当前地址读取 /users/my，核对成功后进入业务页面，不重复签名。公开登录只移除 Bearer。等待步骤使用 generation 淘汰旧结果；POST 成功但 GET 失败保留 Token，重试读取。邀请码只读取链接/本地存储，没有输入框或临时 Token。金额和等级在 user/api.ts 解析；详见 docs/yuanbao-api-integration.md。

2026-10-12 邀请码校验交由后端：链接或本地缓存的非空邀请码即使长度或内容错误，也正常连接钱包、签名后随 POST /api/auth/login 提交。前端只去除首尾空白，空值省略 ref；后端错误沿公共 HTTP Toast 提示并释放本轮授权锁，不增加本地长度拦截或自动修改邀请码。已有 Token 的资料验证重试不受邀请码格式影响。

2026-10-12 手机连接时序修复：accountsChanged先更新真实请求地址；相同地址（忽略大小写）及重复空地址事件不使登录失效。无已验证身份/Token时从无地址到首次连接地址属于正常连接过程，继续等待connect返回再签名；不增加延时或自动重签。真实换号、从已连接地址断开、携带Token时更换身份仍递增generation并清理旧会话，禁止迟到签名/POST回写。tests/yuanbao-auth.test.mjs复现连接返回前的初始事件、签名期间的同地址事件及真实换号/断开。
