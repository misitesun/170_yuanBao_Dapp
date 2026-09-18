# User partner page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29444:4491`. This second-level page reproduces the first-phase static “成为合伙人” design. Device status chrome is omitted. The design's banned withdrawal wording is rendered with the approved project term `提取手续费`.

Normal flow: shared `SecondaryHeader` → hero artwork and heading → membership amount card and confirmation action → benefits heading → dividend and referral benefit cards. The supplied artwork lives under `src/assets/user-partner/` with semantic filenames. Shared `ActionButton`, `Toast`, color tokens, utility classes and `gradient-card` mixin are reused. No meaningful content is positioned out of flow.

The authenticated route is `/user/partner`; the development preview is `/preview/user-partner`. The user-page partner banner navigates to this route. “确认加入” only displays static-demo Toast feedback; there is no API, wallet, contract write, transaction, pagination or translation integration.

Validation: focused user-partner tests, `pnpm exec tsc -b`, `pnpm lint`, `pnpm test`, direct Vite production build, and mobile-browser visual and navigation checks.
