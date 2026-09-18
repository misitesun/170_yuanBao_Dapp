export function isValidReserveCheckinDays(value: string) {
    return /^[1-9]\d*$/.test(value.trim())
}
