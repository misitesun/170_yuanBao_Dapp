# ActionButton
Shared HU Chain action button. Variants: primary gradient, outline, soft gradient; sizes: regular (88 design px) and small (68). Native button props are forwarded. `loading` disables interaction and exposes aria-busy. Optional `icon` is decorative; accessible text belongs in children.
公共按钮，颜色取自 color.scss。第一版只展示静态操作入口，不触发业务请求。

Outline/soft variants use a masked gradient ring, preserving a transparent or tinted interior. Mask colors are opacity-only, not theme colors. Enabled buttons scale to 97% while pressed and recover on release/cancel. Disabled/loading states do not scale; reduced-motion preference disables scaling.
描边使用透明镂空渐变环，按压缩小、松开恢复；禁用/加载状态不缩放，并尊重系统减少动态效果设置。

`secondary` is the subdued cyan outline action used for stake orders.
secondary 为质押订单使用的低强调青色描边变体。
