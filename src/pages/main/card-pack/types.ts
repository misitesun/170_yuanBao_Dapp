export type CardPackOrderType = 'outgoing' | 'incoming' | 'released'
export type CardPackStatus = 'pending' | 'won' | 'lost'
export type CardPackReleaseStatus = 'ongoing' | 'completed'
export type CardPackColor = 'red' | 'blue' | 'green'

export type CardPackQuery = {
    orderType: 'outgoing' | 'incoming'
    status: CardPackStatus
} | {
    orderType: 'released'
    status: CardPackReleaseStatus
}

export interface CardPackCardOrder {
    kind: 'card'
    id: string
    color: CardPackColor
    name: string
    principal: string
    principalLabel: string
    principalAsset: 'yuanqi' | 'usdt-baoqi'
    purchasedAt: string
}

export interface CardPackReleaseOrder {
    kind: 'release'
    id: string
    principal: string
    wonAt: string
    totalUsdtIncome: string
    totalBaoqiIncome: string
    todayUsdtIncome: string
    todayBaoqiIncome: string
    period: string
}

export type CardPackOrder = CardPackCardOrder | CardPackReleaseOrder

export interface CardPackPage {
    items: readonly CardPackOrder[]
    hasMore: boolean
}

export type CardPackPageLoader = (query: CardPackQuery, page: number) => Promise<CardPackPage>
