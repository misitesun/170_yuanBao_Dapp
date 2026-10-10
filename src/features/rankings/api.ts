import { request } from '@/services/http/index.ts'
import { decimal, integer, list, object, string } from '../api-fields.ts'

export interface TeamRanking {
    list: { rank: number; address: string; teamKpi: string }[]
    me: { rank: number; teamKpi: string }
}

export function parseTeamRanking(value: unknown): TeamRanking {
    const root = object(value)
    const rows = list(root.list)
    if (rows.length > 50) throw new Error('排行榜数据格式错误')
    const me = object(root.me)
    return {
        list: rows.map((value) => {
            const row = object(value)
            return { rank: integer(row.rank, 1), address: string(row.address), teamKpi: decimal(row.team_kpi) }
        }),
        me: { rank: integer(me.rank), teamKpi: decimal(me.team_kpi) },
    }
}

export async function getTeamRanking(signal?: AbortSignal): Promise<TeamRanking> {
    return parseTeamRanking(await request<unknown>({ url: '/api/rankings/team_kpi', signal }))
}
