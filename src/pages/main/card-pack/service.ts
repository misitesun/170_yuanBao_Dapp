import type { CardPackCardOrder, CardPackColor, CardPackOrder, CardPackOrderType, CardPackPageLoader, CardPackReleaseOrder } from './types.ts'

const PAGE_SIZE = 3
const DESIGN_CARDS: readonly CardPackCardOrder[] = [
    { kind: 'card', id: 'design-red', color: 'red', name: '元宝典藏卡', principal: '100', principalLabel: '本金(元气）', principalAsset: 'yuanqi', purchasedAt: '2026.02.24 12:28' },
    { kind: 'card', id: 'design-blue', color: 'blue', name: '元宝尊享卡', principal: '300', principalLabel: '本金(元气）', principalAsset: 'yuanqi', purchasedAt: '2026.02.24 12:28' },
    { kind: 'card', id: 'design-green', color: 'green', name: '元宝至尊卡', principal: '1,000', principalLabel: '本金(元气）', principalAsset: 'yuanqi', purchasedAt: '2026.02.24 12:28' },
]

const INCOMING_PRINCIPALS: Record<CardPackColor, Pick<CardPackCardOrder, 'principal' | 'principalLabel'>> = {
    red: { principal: '109+1', principalLabel: '本金(USDT+宝气）' },
    blue: { principal: '309+3', principalLabel: '本金(元气）' },
    green: { principal: '1030+10', principalLabel: '本金(元气）' },
}
const INCOMING_DESIGN_CARDS = DESIGN_CARDS.map<CardPackCardOrder>((card) => ({
    ...card,
    ...INCOMING_PRINCIPALS[card.color],
    id: `design-incoming-${card.color}`,
    principalAsset: 'usdt-baoqi',
}))
const DESIGN_RELEASES = Array.from({ length: 3 }, (_, index): CardPackReleaseOrder => ({
    kind: 'release',
    id: `design-release-${index + 1}`,
    principal: '109+1',
    wonAt: '2026.02.24 12:28',
    totalUsdtIncome: '286.00',
    totalBaoqiIncome: '46.00',
    todayUsdtIncome: '6.124875',
    todayBaoqiIncome: '1.293846',
    period: '20/180',
}))

// Two finite pages of design samples, not wallet assets or documented API DTOs.
// Winner and completed filters stay empty; their records have no supplied design.
const PREVIEW_ORDERS: Record<CardPackOrderType, readonly CardPackOrder[]> = {
    outgoing: [...DESIGN_CARDS, ...DESIGN_CARDS.map((card) => ({ ...card, id: `${card.id}-page-two` }))],
    incoming: [...INCOMING_DESIGN_CARDS, ...INCOMING_DESIGN_CARDS.map((card) => ({ ...card, id: `${card.id}-page-two` }))],
    released: [...DESIGN_RELEASES, ...DESIGN_RELEASES.map((order) => ({ ...order, id: `${order.id}-page-two` }))],
}

export const loadCardPackPreviewPage: CardPackPageLoader = async (query, page) => {
    // The local preview waits for its data source, exposing the shared loading UI.
    await new Promise<void>((resolve) => setTimeout(resolve, 250))

    const showPreview = query.orderType === 'released' ? query.status === 'ongoing' : query.status === 'pending'
    const orders = showPreview
        ? PREVIEW_ORDERS[query.orderType]
        : []
    const start = (page - 1) * PAGE_SIZE

    return {
        items: orders.slice(start, start + PAGE_SIZE),
        hasMore: start + PAGE_SIZE < orders.length,
    }
}
