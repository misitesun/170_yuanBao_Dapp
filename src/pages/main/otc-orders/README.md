# OTC orders page

Figma sources: NVwAAv12WZx1LiCTqPMNWD / 29444:941 and 29444:4231. Static phase only; device status chrome is omitted and the page requires no exported artwork.

The second-level route uses `SecondaryHeader` without the first-level header or tabbar. `SegmentedTabs` switches between buy and sell orders. Each tab owns 12 visual fixtures, exposes four rows per page, resets on tab change or pull refresh, and loads four more rows through `usePageLoadMore()`.

Buy fixtures cover trading, cancelled and completed states. Trading rows expose a local Toast-only cancel action, while detail actions also remain static demonstrations. Sell fixtures reproduce the completed-state cards shown in the supplied design. No API, wallet, trade, contract or translation behavior is implied.

Figma node 29444:1219 supplies the static buy-order detail. The summary card keeps the six literal design fields, followed by three completed buy trade records. Buy-list detail actions navigate to `/otc/orders/buy/detail`; detail actions inside the completed-record list remain Toast-only because no third-level detail page was requested. The list and detail page share the module-local `OtcTradeOrderCard` component.

OTC 订单模块当前仅还原静态 UI、双 Tab 切换、下拉刷新和 Mock 上拉分页；挂买详情使用本地静态汇总与成交记录，不包含接口、钱包、真实撤单、三级详情、合约或翻译逻辑。
