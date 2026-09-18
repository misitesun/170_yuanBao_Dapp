import { NavLink } from 'react-router'

import { Popup } from '@/components/Popup'

import { Icon } from '@/components/Icon'

import { MAIN_PAGE_ITEMS } from '../config.ts'
import { AppBrand } from './AppBrand/AppBrand.tsx'

const getMenuLinkClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive ? 'app-menu__link app-menu__link--active app-color' : 'app-menu__link'

type SidebarMenuProps = {
    show: boolean
    onClose: () => void
}

export function SidebarMenu({
    show,
    onClose,
}: SidebarMenuProps) {
    function handleMenuLinkClick() {
        onClose()
    }

    function handleCloseSidebarBrandClick() {
        onClose()
    }

    return (
        <Popup
            show={show}
            onClose={onClose}
            position="right"
            contentPreset={false}
        >
            <aside className="app-sidebar-menu vh-100" aria-label="Sidebar menu">
                <div className="flex-between">
                    <AppBrand onClick={handleCloseSidebarBrandClick} />
                    <Icon name="cross" className="size-48 opc-6" onClick={onClose} />
                </div>
                <nav className="app-menu scroll-y mt-60">
                    {MAIN_PAGE_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={getMenuLinkClassName}
                            onClick={handleMenuLinkClick}
                        >
                            {({ isActive }) => (
                                <div className="flex-between pt-30 pb-30">
                                    <div className="flex items-center">
                                        <img
                                            src={isActive ? item.activeIcon : item.icon}
                                            className="img-44"
                                            alt=""
                                        />
                                        <div className="ml-20 size-30">{item.title}</div>
                                    </div>
                                    <Icon
                                        name="arrow"
                                        className={isActive ? 'size-38' : 'size-38 opc-6'}
                                    />
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </Popup>
    )
}
