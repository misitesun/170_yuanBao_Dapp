# MarketPopup

`MarketPopup` is the shared HU/points market-detail overlay from Figma node
`29421:2585`. It composes the shared `Popup` with `position="bottom"`, so entry and
exit keep the existing bottom slide motion, portal, overlay dismissal and body
scroll lock contracts.

The caller controls `show`, `assetType` and `onClose`. HU and points presentation
fixtures live in `marketAssets.ts` so the OTC and User pages share the same names,
icons, prices and change values. The points variant alone renders the
`积分兑换算力` action and delegates its behavior through `onConvertPower`.

The 132×132 token ring is the human-exported Figma slice
`src/assets/common/market-asset-ring.png`. The component overlays the current
88×88 asset icon at its center and does not redraw the ring with CSS borders,
gradients or shadows. The panel uses the shared `hu-popup-surface` mixin: its
vertical `#2F1F53` to `#1A1948` background stays separate from the vertical
`#F934FF` to `#5039FE` to `#41DEFF` one-pixel border gradient. The Home check-in
and reserve popups reuse that surface treatment while keeping their own content.
Its overlay inherits the shared `Popup` 50% black mask without blur or a
page-specific overlay class. The panel owns its 20px bottom spacing so layout
does not require a mask override.

The chart region is intentionally an empty, accessible placeholder in this static
phase. It does not invent candlesticks, time ranges, gestures, APIs, contracts or
conversion behavior. When real public market data is integrated, keep the chart
read account-free and replace the placeholder inside this component.
