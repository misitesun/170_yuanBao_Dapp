# Storage service

This module centralizes SSR-safe local storage access. The base template owns only business-neutral keys: wallet address, optional auth token and language.

本模块集中提供兼容 SSR 的本地存储访问。基础模板只维护与业务无关的键：钱包地址、可选鉴权 Token 和语言。

```ts
STORAGE_KEY.walletAddress // WALLET_ADDRESS
STORAGE_KEY.token         // TOKEN
STORAGE_KEY.language      // LANG
```

Use semantic methods from `src/services/storage/index.ts`; do not access `window.localStorage` directly in pages, features or stores. Read failures return defaults, and write/remove failures do not interrupt the UI in private browsing or restricted WebViews.

页面、feature 和 store 应使用 `src/services/storage/index.ts` 的语义方法，不直接访问 `window.localStorage`。隐私模式或受限 WebView 中读取失败会返回默认值，写入或删除失败不会中断 UI。

Project-specific referral, login-account, preference or cache keys should be added only after their owner and lifecycle are documented.

邀请、登录账号、偏好或缓存等项目专属键，只有归属与生命周期明确后才可添加。
