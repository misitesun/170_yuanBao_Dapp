import type { MockOtcTradeOrder } from './pagination.ts'

export interface MockOtcBuyOrderDetail {
    orderNumber: string
    quantity: string
    unitPrice: string
    total: string
    tradedQuantity: string
    tradedTotal: string
    trades: readonly MockOtcTradeOrder[]
}

export function getMockOtcBuyOrderDetail(): MockOtcBuyOrderDetail {
    return {
        orderNumber: 'PPI2345678910',
        quantity: '5,000',
        unitPrice: '0.2345',
        total: '12,000',
        tradedQuantity: '2,3120',
        tradedTotal: '5,340',
        trades: Array.from({ length: 3 }, (_, index) => ({
            id: `buy-detail-trade-${index + 1}`,
            tab: 'buy',
            status: 'completed',
            createdAt: '2025.12.30 09:34:54',
            unitPrice: '0.453216',
            quantity: '48',
            total: '32.3424',
        })),
    }
}
