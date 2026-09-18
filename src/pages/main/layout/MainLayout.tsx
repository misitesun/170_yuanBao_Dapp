import { useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'

import {
    DEFAULT_LAYOUT_MENU_TYPE,
    LAYOUT_MENU_TYPE,
    type LayoutMenuType,
} from '@/router/config'

import { ROUTE_PATH } from '@/router/routes'

import { HeaderBar } from './HeaderBar/HeaderBar.tsx'
import { SidebarMenu } from './SidebarMenu.tsx'
import { TabbarMenu } from './TabbarMenu.tsx'
import './MainLayout.scss'

type MainLayoutProps = {
    menuType?: LayoutMenuType
    staticPreview?: boolean
    children?: ReactNode
}

export function MainLayout({
    menuType = DEFAULT_LAYOUT_MENU_TYPE,
    staticPreview = false,
    children,
}: MainLayoutProps) {
    const location = useLocation()
    const [showSidebarMenu, setShowSidebarMenu] = useState(false)
    const isSidebarLayout = menuType === LAYOUT_MENU_TYPE.sidebar
    const isTabbarLayout = menuType === LAYOUT_MENU_TYPE.tabbar
    const appLayoutClassName = isTabbarLayout
        ? 'app-layout app-layout--tabbar vw-100 min-vh-100'
        : 'app-layout vw-100 min-vh-100'

    function handleOpenSidebarMenu() {
        setShowSidebarMenu(true)
    }

    function handleCloseSidebarMenu() {
        setShowSidebarMenu(false)
    }

    return (
        <div className={appLayoutClassName}>
            <HeaderBar
                staticPreview={staticPreview}
                showGap={!staticPreview && location.pathname !== ROUTE_PATH.home && location.pathname !== ROUTE_PATH.stake && location.pathname !== ROUTE_PATH.presale && location.pathname !== ROUTE_PATH.otc && location.pathname !== ROUTE_PATH.user}
                showSidebarMenu={isSidebarLayout}
                onSidebarMenuClick={handleOpenSidebarMenu}
            />

            <div className="app-layout__body">
                <main className="app-layout__main">
                    {children ?? <Outlet />}
                </main>
            </div>

            {isSidebarLayout ? (
                <SidebarMenu
                    show={showSidebarMenu}
                    onClose={handleCloseSidebarMenu}
                />
            ) : null}
            {isTabbarLayout ? <TabbarMenu staticPreview={staticPreview} /> : null}
        </div>
    )
}
