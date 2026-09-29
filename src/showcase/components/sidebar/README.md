# Sidebar preview / 侧边栏预览

Development-only route: `/showcase/components/sidebar`.
仅开发环境提供，使用独立地址展示六项菜单和钱包卡片，不修改真实钱包或登录状态。

Menu buttons select locally until their business pages exist. Copy copies the full preview address; Escape and the existing header menu close the drawer.
待开发的业务菜单先提供本地选中反馈；复制使用完整预览地址，Escape 和原有顶部菜单关闭抽屉。

六项按钮的本地选中同时驱动高亮PNG、文字和箭头；正式路由使用相同内容映射及NavLink选中状态。预览切换不导航到业务页，不修改钱包/鉴权状态。
