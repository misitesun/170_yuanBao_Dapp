# User withdrawal page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29534:12621`. Project terminology normalizes the visible withdrawal wording to the approved term `提取`. Device status chrome is omitted.

The authenticated second-level route is `/user/withdraw`; development preview is `/preview/user-withdraw`. The User page extraction action navigates here. The page reuses `SecondaryHeader`, `Input`, `ActionButton`, `Picker` and `Toast`. `SecondaryHeader` exposes an optional right slot for the supplied 66×66 records artwork without changing existing consumers. The supplied 14×14 selector arrow and records PNG live under `src/assets/user-withdraw/`.

Normal flow is header → extraction method card → amount heading → amount input → fee → action. The method card contains semantic buttons, the amount uses the shared native controlled `Input`, and no page content is positioned outside normal flow. Its resting border stays neutral and the public Input's project-wide action gradient appears only while the field contains focus. Existing Flex utilities and project color/gradient tokens are reused; no new mixin is needed.

The asset and chain pickers currently contain only the literal design fixtures `USDT` and `TRX20`. All fills `4568.2684`; the fee remains the literal `0.1%`. The records entry navigates to `/user/withdraw/records`, while submission provides explicit static-demo Toast feedback. There is no API, wallet, balance read, fee calculation, token precision rule or transaction submission.

Measured values include a 750×1624 frame, 30px page gutters, a 690×188 method card with two 94px rows, a 690×103 amount field, a 690×88 action, 32px header title, 28px form labels and 24px balance/fee text. The 16px card and field radii are visual estimates because Figma returned those background layers as flattened vector assets; they are verified at the 750px frame width.
