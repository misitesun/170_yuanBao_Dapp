import huTokenIcon from '@/assets/user/hu-token.png'
import pointsTokenIcon from '@/assets/user/points-token.png'

export type MarketAssetType = 'hu' | 'points'

export interface MarketAssetPreview {
    type: MarketAssetType
    name: string
    label: string
    price: string
    change: string
    positive: boolean
    icon: string
}

export const MARKET_ASSET_PREVIEWS: Record<MarketAssetType, MarketAssetPreview> = {
    hu: {
        type: 'hu',
        name: 'HU',
        label: 'HU实时价格',
        price: '1.874582 USDT',
        change: '+0.16%',
        positive: true,
        icon: huTokenIcon,
    },
    points: {
        type: 'points',
        name: '积分',
        label: '积分实时价格',
        price: '0.1596 USDT',
        change: '+0.16%',
        positive: true,
        icon: pointsTokenIcon,
    },
}

export const MARKET_ASSET_LIST = [
    MARKET_ASSET_PREVIEWS.hu,
    MARKET_ASSET_PREVIEWS.points,
] as const
