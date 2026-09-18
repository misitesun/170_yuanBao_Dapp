# Points convert page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29534:12103`. Device status chrome is omitted.

The authenticated second-level route is `/points/convert-power`; development preview is `/preview/points-convert`. Both existing points-market popup entries close the popup and navigate here. The page uses the shared `SecondaryHeader`, `ActionButton` and `Toast`, plus the manually exported top background and complete 116×116 points-market artwork under `src/assets/points-convert/`. The background artwork is rendered at its native 750×888 size and full opacity; no extra dark overlay is applied above it.

Flow order is header → outgoing points card → in-flow overlapping conversion icon → incoming power card → confirmation action → points market summary → period row → empty chart placeholder. Flex layout keeps the meaningful content in normal flow; no page-positioned exception is required.

The outgoing amount uses the shared `Input` with a transparent resting surface and the project-wide gradient focus border. The input, All button and confirmation feedback are local-only interactions. Its initial `0` uses the muted text color; user-entered content and the All-button value use the primary white text color. The incoming power value stays at the design fixture `0` because no conversion-rate contract is available. The candlestick area intentionally stays empty for this phase. There is no API, wallet, ABI, balance read, market feed, rate calculation or transaction submission.

Measured design values include 750px frame width, 30px page gutters, 690×266px and 690×246px cards with 40px radii, 84×84px conversion artwork, 690×88px action, 116×116px market badge and the exact typography, gradients, opacity and spacing recorded in the implementation styles.
