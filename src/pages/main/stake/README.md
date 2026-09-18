# Stake page
Figma source: NVwAAv12WZx1LiCTqPMNWD / 29354:977. Static phase only; exported artwork is stored in src/assets/stake. Device status chrome is omitted.
Flow: hero, asset radio cards, amount input, estimate, actions. Shared header/tabbar, ActionButton, Radio, Input and Toast are reused; the amount field inherits the project-wide gradient focus border and only background artwork/selection decoration uses positioning.
Switching assets clears the entered amount and updates the suffix. Max copies the selected fixture balance. Submit validates trim-based non-emptiness only; any non-empty value receives an explicit demo message. No numeric, precision, balance or on-chain validation is implied. The estimate remains 0.00; order action explains the missing screen via Toast.
静态质押页：单选、输入、全部回填和非空提示均为本地交互，无翻译、接口或合约调用。余额为设计稿演示数据，交易规则留待真实契约确认。“质押订单”入口跳转至 `/stake/orders` 静态订单页。
