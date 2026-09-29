import { request } from '../../services/http/index.ts'
import { API_PAGE_SIZE, boolean, dateTime, integer, list, object, string } from '../api-fields.ts'

export interface Notice { id: number; title: string; content: string; updatedAt: string }
export function parseNotice(value: unknown): Notice {
    const row = object(value)
    return { id: integer(row.id, 1), title: string(row.title), content: string(row.content), updatedAt: dateTime(row.updated_at) }
}
export function parseNotices(value: unknown): Notice[] { return list(object(value).notices).map(parseNotice) }
export function parsePopupNotice(value: unknown): { isShow: boolean; notice: Notice | null } {
    const row = object(value)
    const isShow = boolean(row.is_show)
    if (Array.isArray(row.notice)) {
        if (row.notice.length !== 0 || isShow) throw new Error('弹窗公告数据格式错误')
        return { isShow, notice: null }
    }
    return { isShow, notice: parseNotice(row.notice) }
}
export async function getNotices(_language: string, page: number) {
    const items = parseNotices(await request<unknown>({ url: '/api/notices', authentication: 'none',
        params: { page_no: page, page_size: API_PAGE_SIZE } }))
    return { items, hasMore: items.length === API_PAGE_SIZE }
}
export async function getNotice(id: number, signal?: AbortSignal): Promise<Notice> {
    return parseNotice(await request<unknown>({ url: `/api/notices/${id}`, signal, authentication: 'none' }))
}
export async function getPopupNotice(signal?: AbortSignal) {
    return parsePopupNotice(await request<unknown>({ url: '/api/notices/pop', signal }))
}
/** This GET changes read state, but its unused success body is deliberately not parsed. */
export async function markNoticeRead(id: number): Promise<void> {
    await request<unknown>({ url: `/api/notices/${id}/read` })
}
