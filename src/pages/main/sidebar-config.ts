import homeImage from '@/assets/common/menu-home.png'
import auctionImage from '@/assets/common/menu-auction.png'
import cardPackImage from '@/assets/common/menu-card-pack.png'
import assetsImage from '@/assets/common/menu-assets.png'
import communityImage from '@/assets/common/menu-community.png'
import rankingImage from '@/assets/common/menu-ranking.png'
import homeActiveImage from '@/assets/common/menu-home-active.png'
import auctionActiveImage from '@/assets/common/menu-auction-active.png'
import cardPackActiveImage from '@/assets/common/menu-card-pack-active.png'
import assetsActiveImage from '@/assets/common/menu-assets-active.png'
import communityActiveImage from '@/assets/common/menu-community-active.png'
import rankingActiveImage from '@/assets/common/menu-ranking-active.png'
import { ROUTE_PATH } from '@/router/routes'

import { MAIN_PAGE_ITEMS } from './config'

export type SidebarItem = {
    id: string
    title: string
    image: string
    activeImage: string
    path?: string
    unavailable?: boolean
}

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
    ...MAIN_PAGE_ITEMS.map((item) => ({ ...item, id: item.path, image: homeImage, activeImage: homeActiveImage })),
    { id: 'auction', title: '抢拍卡片', image: auctionImage, activeImage: auctionActiveImage, path: ROUTE_PATH.auction },
    { id: 'card-pack', title: '我的卡包', image: cardPackImage, activeImage: cardPackActiveImage, path: ROUTE_PATH.cardPack },
    { id: 'assets', title: '全部资产', image: assetsImage, activeImage: assetsActiveImage, path: ROUTE_PATH.assets },
    { id: 'community', title: '社区', image: communityImage, activeImage: communityActiveImage, path: ROUTE_PATH.team },
    { id: 'ranking', title: '排行榜', image: rankingImage, activeImage: rankingActiveImage, path: ROUTE_PATH.ranking },
]
