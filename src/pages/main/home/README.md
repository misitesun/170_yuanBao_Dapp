# HU Chain static home
Source: Figma NVwAAv12WZx1LiCTqPMNWD, node 29342:270.
First release displays literal design values and labels, with no translation, requests, wallet writes, pull refresh. Notices scroll vertically and countdowns run locally from 24 hours. The immediate check-in action opens the shared centered Popup from Figma node 29421:3344. The reserve action opens the centered form from node 29432:3614, accepts positive integer days, and deliberately keeps both fee values as `-- BNB` because no fee rule has been supplied. Overlay and close controls dismiss either popup; confirm actions only report static-demo Toast feedback. Device status chrome is excluded.
Flow: hero → notice → two countdowns → check-in → miner offer → public metrics. Flex/Grid lays out all meaningful content. Positioned exceptions are only decorative card artwork/backgrounds. Shared Popup, Input, ActionButton and Toast components provide the check-in dialog behavior. The check-in and reserve dialogs reuse the same `hu-popup-surface` dark background and top-to-bottom gradient border as `MarketPopup`; their content remains page-specific. The reserve field supplies only its local dark surface color, while the shared Input owns the project-wide gradient focus border.
Assets are the developer's exported PNGs renamed by function; theme values live in src/styles/color.scss. The development-only /preview/home route renders the same HomePage and shared header/tabbar without authentication.
首版仅供静态视觉验收，业务交互及真实数据留待后续明确任务。

The supplied `src/assets/home/head-bg.png` is the hero background; its alpha edge blends into the shared page color.
用户补充的 head-bg.png 用于顶部主视觉，透明边缘与公共背景色衔接。
