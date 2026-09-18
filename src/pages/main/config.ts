import homeIconUrl from '@/assets/layout/tabbar/home.png'
import homeActiveIconUrl from '@/assets/layout/tabbar/homeAct.png'
import userIconUrl from '@/assets/layout/tabbar/user.png'
import userActiveIconUrl from '@/assets/layout/tabbar/userAct.png'
import { ROUTE_PATH } from '@/router/routes'

export type MainPageItemPath =
    | typeof ROUTE_PATH.home
    | typeof ROUTE_PATH.user

export type MainPageItem = {
    path: MainPageItemPath
    title: string
    icon: string
    activeIcon: string
}

export const MAIN_PAGE_ITEMS: readonly MainPageItem[] = [
    {
        path: ROUTE_PATH.home,
        title: '首页',
        icon: homeIconUrl,
        activeIcon: homeActiveIconUrl,
    },
    {
        path: ROUTE_PATH.user,
        title: '我的',
        icon: userIconUrl,
        activeIcon: userActiveIconUrl,
    },
]
