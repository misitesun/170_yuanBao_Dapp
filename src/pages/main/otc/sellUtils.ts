export function getSellAllValue(remaining: string) {
    return remaining.replaceAll(',', '')
}

export function hasSellQuantity(value: string) {
    return value.trim().length > 0
}
