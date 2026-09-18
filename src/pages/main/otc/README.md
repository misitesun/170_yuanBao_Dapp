# OTC page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29394:839`. Static phase only.
Device status chrome is omitted. Existing HU/USDT/brand assets are reused, and the
market cards keep compact inline sparklines.

Normal flow: HU/USDT asset artwork followed by horizontally swipeable HU and
points market cards → gradient heading and local actions → paged sell-order list.
No page content uses absolute or fixed positioning. Shared HeaderBar, TabbarMenu,
GradientText, ActionButton, Toast, Swiper, color tokens, flex utilities and the
hide-scrollbar-compatible carousel behavior are reused.

The Figma-provided 1254px HU/USDT artwork is cropped inside its 200×244 card.
Market cards use local radial glows, the Figma 36px northeast arrow path and a
158×69 inline SVG sparkline with a matching translucent area fill. The post-buy
button keeps the Figma 60px semi-transparent gradient fill and gradient border.

The mock list has 12 rows and exposes 4 more rows per page. `usePageRefresh()`
awaits the mock reload before resetting page 1; `usePageLoadMore()` awaits the mock
next page. Post-buy and order history navigate to their second-level static routes,
while each market card opens the shared bottom `MarketPopup`. The popup uses the
Figma 710×1200 panel, shared HU/points fixtures and an intentionally blank chart
region; only the points variant displays `积分兑换算力`, which navigates to the static `/points/convert-power` page. A sell action opens the
shared centered Popup from Figma node 29440:372;
its unit price and remaining amount follow the selected mock order, while All fills
that remaining amount. The fee, available balance and total stay literal design
fixtures because no fee, balance or token-precision contract has been supplied.
Confirm validates non-emptiness only and reports static-demo Toast feedback. There
is no API, wallet, transaction or translation integration.

The sell quantity field uses the shared Input surface variable; its resting border
is neutral and its focused border follows the same action gradient as every other
business text input.

The order-history icon navigates to `/otc/orders`, where the buy and sell order
tabs use local fixtures, pull refresh and mock load-more pagination.

Validation: focused pagination tests, `pnpm lint`, `pnpm test`, `pnpm exec tsc -b`,
the production build gate, and mobile-browser checks for asset swiping, refreshing,
single-flight pagination, finished state, Toast actions and tabbar navigation.
