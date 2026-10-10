# DropletLoading

Reusable water-droplet spinner shared by business submissions and incremental pagination loading states.

可复用的水滴旋转加载图形，供业务提交遮罩和追加分页加载状态使用；普通页面首屏及配置读取不使用。

`regular` preserves the original 300px contract-loading artwork. `small` uses a 40px outer frame for centered incremental pagination indicators. Both variants keep the same seven-dot gradient, easing and staggered rotation.

`regular` 保留原合约 Loading 的 300px 图形；`small` 使用 40px 外框，用于追加分页的居中加载状态。两种尺寸共用同一套七水滴渐变、缓动与错峰旋转。

```tsx
import { DropletLoading } from '@/components/DropletLoading'

<DropletLoading size="small" ariaLabel="加载更多" />
```

## 多语言

未传 ariaLabel 时默认加载标签使用当前语言；显式 ariaLabel 保持原文，图形与尺寸保持。
