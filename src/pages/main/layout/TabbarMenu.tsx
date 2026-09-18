import { NavLink } from 'react-router'
import home from '@/assets/layout/tabbar/home.png'
import homeActive from '@/assets/layout/tabbar/home-active.png'
import stake from '@/assets/layout/tabbar/stake.png'
import stakeActive from '@/assets/layout/tabbar/stake-active.png'
import presale from '@/assets/layout/tabbar/presale.png'
import presaleActive from '@/assets/layout/tabbar/presale-active.png'
import otc from '@/assets/layout/tabbar/otc.png'
import otcActive from '@/assets/layout/tabbar/otc-active.png'
import user from '@/assets/layout/tabbar/user.png'
import userActive from '@/assets/layout/tabbar/user-active.png'
import { ROUTE_PATH } from '@/router/routes'

const TAB_ITEMS = [
    { label: '首页', icon: home, activeIcon: homeActive, path: ROUTE_PATH.home },
    { label: '质押', icon: stake, activeIcon: stakeActive, path: ROUTE_PATH.stake },
    { label: '预售', icon: presale, activeIcon: presaleActive, path: ROUTE_PATH.presale },
    { label: 'OTC', icon: otc, activeIcon: otcActive, path: ROUTE_PATH.otc },
    { label: '我的', icon: user, activeIcon: userActive, path: ROUTE_PATH.user },
] as const

/** Unbuilt destinations are inert in the static first release. */
export function TabbarMenu({ staticPreview = false }: { staticPreview?: boolean }) {
    return (
        <nav className="app-tabbar vw-100" aria-label="主导航">
            <div className="app-tabbar__bar flex">
                {TAB_ITEMS.map((item) => {
                    const content = (active: boolean) => <><span className="app-tabbar__icon flex items-center justify-center"><img src={active ? item.activeIcon : item.icon} alt="" /></span><span className="size-24 mt-2">{item.label}</span></>
                    const classes = 'app-tabbar__link flex-1 flex flex-column items-center justify-center'
                    const previewPath = item.path === ROUTE_PATH.home ? '/preview/home'
                        : item.path === ROUTE_PATH.stake ? '/preview/stake'
                        : item.path === ROUTE_PATH.presale ? '/preview/presale'
                        : item.path === ROUTE_PATH.otc ? '/preview/otc'
                        : item.path === ROUTE_PATH.user ? '/preview/user' : undefined
                    const path = staticPreview ? previewPath : item.path
                    if (!path) {
                        return <button type="button" key={item.label} className={classes} disabled aria-disabled="true" title="静态展示">{content(false)}</button>
                    }
                    return <NavLink key={item.label} to={path} className={({ isActive }) => `${classes}${isActive ? ' app-tabbar__link--active' : ''}`}>{({ isActive }) => content(isActive)}</NavLink>
                })}
            </div>
            <div className="safe-bottom" />
        </nav>
    )
}
