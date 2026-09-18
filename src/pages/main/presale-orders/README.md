# Presale orders page
Figma source: NVwAAv12WZx1LiCTqPMNWD / 29433:4874. Static phase only; device status chrome is omitted and existing USDT and bronze-level assets are reused.

The second-level route uses `SecondaryHeader` without the first-level header or tabbar. Twelve visual fixtures expose four rows per page. Pull refresh resets page one after the mock delay, while `usePageLoadMore()` appends the next four rows.

Each card shows the presale name, timestamp, price, awarded power and awarded level. No API, wallet, purchase, contract or translation behavior is implied.

预售订单页当前仅还原静态 UI、下拉刷新和 mock 分页，不包含接口、钱包、购买、合约或翻译逻辑。
