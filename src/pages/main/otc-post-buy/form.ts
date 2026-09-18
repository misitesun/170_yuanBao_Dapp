export interface OtcPostBuyValidation {
    invalidUnitPrice: boolean
    invalidQuantity: boolean
}

export function getOtcPostBuyValidation(
    unitPrice: string,
    quantity: string,
): OtcPostBuyValidation {
    return {
        invalidUnitPrice: !unitPrice.trim(),
        invalidQuantity: !quantity.trim(),
    }
}
