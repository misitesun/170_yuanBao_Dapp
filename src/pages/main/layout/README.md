# HU Chain layout
HeaderBar reuses AppBrand and LanguageSwitch, with the supplied brand/notification/language PNGs. No simulated device status bar. `staticPreview` shows inert controls without language or wallet actions.
TabbarMenu presents five entries; home, stake, presale, OTC and user navigate in both authenticated and development-preview flows. Missing screens stay inert rather than inventing business pages. The fixed shared header/tabbar maintain existing app chrome behavior. Normal page content remains in flow. After wallet authentication, all five first-level pages use the same masked wallet-address chip in the shared header; HeaderBar no longer exposes a per-route address-suppression option.
公共导航已按 HU Chain 设计适配，第一版预览只展示视觉，不接入通知或语言逻辑。底部安全区保留为真实设备适配，不是设计图状态栏占位。
