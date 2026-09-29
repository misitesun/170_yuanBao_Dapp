/** Small runtime checks for the confirmed YuanBao PHP wire contract. */
export function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('接口数据格式错误')
    return value as Record<string, unknown>
}
export function string(value: unknown): string {
    if (typeof value !== 'string') throw new Error('接口文本字段格式错误')
    return value
}
export function integer(value: unknown, minimum = 0): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) throw new Error('接口整数字段格式错误')
    return value
}
export function decimal(value: unknown): string {
    const text = string(value)
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new Error('接口金额字段格式错误')
    return text
}
export function boolean(value: unknown): boolean {
    if (typeof value !== 'boolean') throw new Error('接口布尔字段格式错误')
    return value
}
export function list(value: unknown): unknown[] {
    if (!Array.isArray(value)) throw new Error('接口列表字段格式错误')
    return value
}
export function dateTime(value: unknown): string {
    const text = string(value)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) throw new Error('接口时间字段格式错误')
    return text
}
export function formatApiTime(value: string): string {
    return value.replaceAll('-', '.')
}
export const API_PAGE_SIZE = 20
