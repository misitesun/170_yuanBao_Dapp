# OTC post-buy page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29444:598`. The visible design copy and existing OTC entry use “发布挂买”, even though the Figma frame layer is named “发布挂卖”. Device status chrome is omitted.

This authenticated form is a second-level route at `/otc/post-buy`; it uses the shared `SecondaryHeader` without the main HeaderBar or TabbarMenu. The OTC “挂买” action navigates to it. The development preview is `/preview/otc-post-buy`.

The confirmed Figma `image 4745` layer is exported at 1x as `src/assets/otc/post-buy-background.png` (750×888). Existing USDT and HU icons, Input, ActionButton and Toast are reused. Both fields keep their page-specific translucent surface through the Input CSS variable and use the project-wide gradient focus border. The static price and balances are literal design fixtures. All fills the HU fixture amount. Submit validates non-empty inputs only and shows explicit static-demo feedback; there is no market feed, API, wallet, balance calculation, token precision rule or transaction.

Validation: focused route/form tests, `pnpm lint`, `pnpm test`, `pnpm exec tsc -b`, and mobile-browser checks for navigation, All, empty validation and submit feedback.
