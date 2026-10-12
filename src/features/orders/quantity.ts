import { multiplyDecimalNumbers } from '@/shared/calculations/decimalNumbers.ts'

/** Both order mutations accept 1–100 whole cards. Invalid input stays editable. */
export function parseOrderQuantity(value: string): number | null {
    if (!/^\d+$/.test(value)) return null
    const quantity = Number(value)
    return Number.isInteger(quantity) && quantity >= 1 && quantity <= 100 ? quantity : null
}

export function validateOrderQuantity(quantity: number): number {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error('请输入 1–100 的整数数量')
    }
    return quantity
}

export function orderQuantityTotal(price: string | undefined, input: string): string {
    const quantity = parseOrderQuantity(input)
    if (price === undefined || quantity === null) return '--'
    return multiplyDecimalNumbers(price, String(quantity))
}
