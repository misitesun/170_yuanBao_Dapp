# User extraction records page

Figma sources: `NVwAAv12WZx1LiCTqPMNWD / 29534:13009` for the pending state and `29534:13251` for the rejected state. Project terminology normalizes the visible title to `提取记录`. Device status chrome is omitted.

The authenticated second-level route is `/user/withdraw/records`; development preview is `/preview/user-withdraw-records`. The record artwork in the extraction page header navigates here. The page reuses `SecondaryHeader`, `SegmentedTabs` and the shared pull-refresh shell without changing their public contracts.

Normal flow is header → status tabs → record list. The list uses semantic `article` elements; no page content is positioned outside normal flow and there are no layout exceptions. The three local states are pending, approved and rejected. The Figma file supplies pending and rejected frames, so the approved state deliberately reuses the measured standard-card structure. Rejected records add the measured reason row.

Measured values include a 750×1624 frame, 30px page gutters, three 220×68 tabs with 15px gaps, a 30px list offset, 20px card gaps, 690×146 standard cards and 690×202 rejected cards. Cards use a 20px radius, `20%` white border, `4%` white surface, 28px primary text, 24px secondary text and the project action gradient. The approved font decision uses the existing project font stack because Poppins files are not bundled.

Fixtures reproduce the visible note, date, amount and rejection reason. Pull refresh waits for the mock loader before replacing the current status list. There is no API, wallet, contract, remote pagination or transaction behavior.
