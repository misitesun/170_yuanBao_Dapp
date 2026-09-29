# Shared styles / 公共样式

Global styles enter through `src/styles/index.scss`; `common/common.scss` is already loaded. Reuse utilities before adding page-specific SCSS. Keep the demo's `color.scss` tokens and existing px-to-vw pipeline.
公共样式由 `src/styles/index.scss` 统一引入，已包含 `common/common.scss`。优先复用工具类，保留 demo 主题 token 与 px-to-vw 流程。

## 元宝项目颜色

排行榜新增前三名文字、底色及边框和普通行底色/边框token；保留Figma浮点通道，第二名文字与边框的不同颜色分别记录。标题和我的排名强调色复用卡包强调色。底卡背景使用人工切图，局部光晕留页内SCSS。

资产页增量颜色包括三种余额卡底色、精确渐变边框、转账按钮和流水提示色；其余背景、文字、绿/红状态优先复用既有token。私有曲线使用人工切图，星空与卡包共用common/account-background.png。

卡包释放订单的宝气累计收益复用独立`--app-card-pack-release-baoqi`，保留Figma原始#B7FF2D浮点通道；USDT累计收益沿用已有卡包标题强调色，底框/状态继续复用既有token，不更换主题绿。

首页设计阶段将背景、强调色、次文字、卡片、选择面板、金色文字与Header控件渐变集中在 `color.scss`。既有侧栏颜色变量保留为兼容别名，不改变公共组件接口。按开发者要求，首页艺术渐变也集中为变量，首页SCSS和TSX不定义裸色值。详细设计数值与批准的CSS背景差异见 `docs/yuanbao-home-checklist.md`。

## Orbit border / 卡片转圈光效

`orbit-border` is the reusable asset-card border effect, not a React component. It uses a masked conic gradient and a registered angle property to move the highlight along the container border. It adds no layout dimensions; the card owns its size, radius and content.
`orbit-border` 是资产卡片转圈光效的公共样式类，而非独立 React 组件。遮罩后的锥形渐变沿容器边框旋转；卡片自行定义尺寸、圆角与内容。

```tsx
<article className="balance-card orbit-border">
    <h2>Balance</h2>
    <CountUp to="12.3400" />
</article>
```

```scss
.balance-card {
    border-radius: 32px;
    --orbit-border-start-angle: 41deg;
    --orbit-border-color-start: var(--app-cyan);
    --orbit-border-color-peak: var(--app-cyan);
}

.balance-card--reverse {
    --orbit-border-start-angle: 319deg;
    --orbit-border-direction: reverse;
    --orbit-border-color-start: var(--app-violet);
    --orbit-border-color-peak: var(--app-violet);
}
```

These angles illustrate mirrored highlights; they are not requirements for every card. Apply page overrides after the global utility.
示例角度用于镜像起点，并非所有卡片的固定设计要求；页面覆盖样式应在公共工具类之后加载。

| Variable | Default | Purpose |
| --- | --- | --- |
| `--orbit-border-start-angle` | `0deg` | Brightest point's initial angle / 最亮点起始角 |
| `--orbit-border-direction` | `normal` | Clockwise; `reverse` for counterclockwise / 顺时针或逆时针 |
| `--orbit-border-speed` | `5s` | One revolution / 每圈时长 |
| `--orbit-border-delay` | `0s` | Start delay / 启动延迟 |
| `--orbit-border-width` | `1px` | Highlight thickness / 高亮线宽 |
| `--orbit-border-color-start` | `var(--app-cyan)` | Highlight edges / 高亮两端 |
| `--orbit-border-color-peak` | `var(--app-violet)` | Brightest color / 最亮颜色 |
| `--orbit-border-glow` | `6px` | Glow radius / 光晕半径 |

The utility owns `::before`, establishes relative positioning/isolation and clips overflow. Do not put it on a container that already uses `::before` (including `SegmentedTabs` buttons); use a separate decorative wrapper if needed. It does not intercept pointer events. Reduced-motion users see a stationary highlight.
工具类占用 `::before`，建立相对定位与独立叠层，并裁切溢出；不要与已有 `::before` 的样式（包括 Tab 按钮）直接叠加，必要时使用独立装饰容器。不拦截点击；减少动态效果时保留静止高亮。

Tab and CountUp use 500ms transitions; the continuous orbit keeps its independent five-second cycle. Do not change orbit speed merely to match switching animations.
Tab 与 CountUp 是500 毫秒过渡；持续转圈仍使用独立的五秒周期，不因切换动效统一而改快。浏览器验证步骤见 `docs/compatibility.md`。
