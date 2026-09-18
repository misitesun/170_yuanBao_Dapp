# User team page

Figma source: `NVwAAv12WZx1LiCTqPMNWD / 29444:4657`. This second-level page is a first-phase static UI reproduction. It uses local fixtures for the team summary and 12 members, filters member addresses locally, exposes four more rows per mock page, and resets pagination on pull refresh or search changes.

Normal flow: secondary header → current account → invitation card → team summary → counters → member toolbar → paged member cards. The page reuses `SecondaryHeader`, `PagePullRefresh`, `Input`, `Toast`, the shared clipboard helper, common utility classes and existing user avatar and newcomer assets. Team search uses the public Input prefix slot and the project-wide gradient focus border while retaining the compact pill dimensions. The supplied copy action and coin-stack PNGs live under `src/assets/user-team/`. No page content is positioned out of flow.

Invite-code and invite-address copy actions only provide local Toast feedback. There is no API, wallet, contract, translation, sharing or real team-performance integration.
