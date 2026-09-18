# Presale page
Figma: NVwAAv12WZx1LiCTqPMNWD / 29381:1653. Approved static checklist: GradientText title, six horizontally scrollable tabs, centered looping Swiper with neighboring cards visible, two-way selection, fixture prices/benefits, demo Toast actions. No API, wallet, purchase or translation integration.

Normal flow: heading → tabs → carousel → benefits → actions. Shared MainLayout, GradientText, ActionButton, Toast, flex/typography utilities and hide-scrollbar mixin are reused; no positioned page content. Device status bar is omitted. Design's duplicated labels are numbered 1–6; default selection is 1. Tab keyboard arrows/Home/End select cards. Selected tabs scroll into view.

Assets in src/assets/presale are named by artwork/function. The knight image includes a 40px outer glow on each side (610×720); centered background sizing aligns its visible 530×640 face with other cards without modifying the original image. USDT and arrow artwork reuse existing assets. Card faces are 530 design px with a 40px gap, revealing 35px of each adjacent card on a 375px viewport (approximately the requested 30px).

Validation: pnpm lint, pnpm test, pnpm exec tsc -b, pnpm build; browser checks for tab clicks, swipe/loop synchronization, horizontal tab scrolling, viewport resize, Toast and preview navigation.

The “预售订单” action navigates to the authenticated `/presale/orders` static order page.
