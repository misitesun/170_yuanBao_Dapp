import { request } from '../../services/http/index.ts'
import { API_PAGE_SIZE, dateTime, decimal, integer, list, object, string } from '../api-fields.ts'
import { parseLevel, type UserLevel } from '../user/api.ts'

export interface TeamStatistics { inviteCount: number; teamCount: number; kpi: string; teamKpi: string }
export interface Referral { id: number; name: string; joinedAt: string; kpi: string; teamKpi: string; inviteCount: number; teamCount: number; level: UserLevel | null }
export function parseStatistics(value: unknown): TeamStatistics {
    const row = object(value)
    return { inviteCount: integer(row.invite_count), teamCount: integer(row.team_count), kpi: decimal(row.kpi), teamKpi: decimal(row.team_kpi) }
}
export function parseReferrals(value: unknown): Referral[] {
    return list(object(value).referrals).map((value) => {
        const row = object(value)
        return { id: integer(row.id, 1), name: string(row.maddress), joinedAt: dateTime(row.created_at),
            kpi: decimal(row.kpi), teamKpi: decimal(row.team_kpi), inviteCount: integer(row.invite_count),
            teamCount: integer(row.team_count), level: parseLevel(row.level) }
    })
}
export async function getTeamStatistics(): Promise<TeamStatistics> {
    return parseStatistics(await request<unknown>({ url: '/api/users/my/statistics' }))
}
export async function getReferrals(page: number): Promise<Referral[]> {
    return parseReferrals(await request<unknown>({ url: '/api/users/my/referrals', params: { page_no: page, page_size: API_PAGE_SIZE } }))
}
