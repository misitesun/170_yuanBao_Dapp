# Stake orders page
Figma source: NVwAAv12WZx1LiCTqPMNWD / 29432:4095. Static phase only; device status chrome is omitted and existing stake currency assets are reused.

The second-level route uses `SecondaryHeader` without the first-level header or tabbar. `SegmentedTabs` controls the staking, redeemed and converted lists. Each status owns 12 visual fixtures, exposes four rows per page, resets on tab change or pull refresh, and loads four more rows through `usePageLoadMore()`.

Active staking rows show earned power and render reclaim and convert actions. Redeemed rows show the fee in the staked asset. Converted rows show earned power plus the cyan extra-conversion power. Both actions show explicit static-demo Toast feedback without implying an API, wallet or contract transaction.

质押订单页当前仅还原静态 UI、Tab 切换、下拉刷新和 mock 分页；不包含翻译、接口、钱包或合约逻辑。
