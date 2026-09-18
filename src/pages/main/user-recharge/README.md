# User recharge page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29534:12578`. The first phase is a static UI reproduction with local fixtures and interactions only. Device status chrome is omitted.

The authenticated route is `/user/recharge`; development preview is `/preview/user-recharge`. The User page recharge action navigates here. The page reuses `SecondaryHeader`, the global `Input` without page-level visual overrides, `ActionButton`, `Picker`, `Toast`, and the shared clipboard helper. There is no API request, wallet read, QR generation, recharge transaction, balance update, pagination or translation work.

Normal flow is header → recharge information card → QR scanner artwork → amount input → confirmation action → risk notice. The QR scanner layers use CSS Grid overlap instead of positioned page content. Asset and chain selection, address copy, record feedback, empty amount validation and successful static submission are local interactions.

Measured Figma values include a 750×1624 frame, `#14133F` background, 30px page gutters, a 690×291 information card, 28px labels and values, a 26px/36px two-line address, a 24×24 copy icon, a 480×480 scanner frame, a 360×360 QR backdrop, a 300×300 QR image, a 690×88 confirmation action, and a 24px/36px `#FF2D2D` risk notice. The action gradient reuses the exact project token `#F934FF 0% → #5039FE 50% → #41DEFF 100%`.

The design amount field is 690×103, while this implementation intentionally keeps the existing global `Input` component's 98px minimum height, 24px radius, shared background, border and focus effect as explicitly required by the developer. No value is presented as a Figma measurement when it comes from the shared component contract.

Assets under `src/assets/user-recharge/` are exact Figma exports: `qr-code.png` from node `29534:12615`, `qr-backdrop.png` from node `29534:12612`, `qr-scanner-frame.png` from node `29534:12600`, and `copy.svg` from node `29534:12590`. `records.png` and `select-arrow.png` reuse the already exported matching design nodes.
