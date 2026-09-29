import { API_PAGE_SIZE } from '@/features/api-fields.ts'
import { refreshCurrentUser } from '@/features/auth/session.ts'
import { buildInvitationLink } from '@/features/auth/referral.ts'
import { getReferrals, getTeamStatistics, type Referral } from '@/features/team/api.ts'
import type { UserLevel } from '@/features/user/api.ts'
import type { ListPage } from '../pagination/pagination.ts'

export type TeamMember = Referral
export interface TeamOverview {
    invitationCode: string
    invitationContent: string
    level: UserLevel | null
    statistics: readonly { label: string; value: string; accent: boolean }[]
}
export const TEAM_EMPTY_OVERVIEW: TeamOverview = {
    invitationCode: '', invitationContent: '', level: null,
    statistics: ['团队业绩', '个人业绩', '团队总人数', '直推人数'].map((label, index) => ({ label, value: '—', accent: index === 0 })),
}
export async function loadTeamPage(_query: 'all', page: number): Promise<ListPage<TeamMember, TeamOverview>> {
    const [items, user, statistics] = await Promise.all([
        getReferrals(page), page === 1 ? refreshCurrentUser() : Promise.resolve(null),
        page === 1 ? getTeamStatistics() : Promise.resolve(null),
    ])
    return { items, hasMore: items.length === API_PAGE_SIZE,
        ...(user && statistics ? { overview: {
            invitationCode: user.referralCode, invitationContent: buildInvitationLink(user.referralCode), level: user.level,
            statistics: [
                { label: '团队业绩', value: statistics.teamKpi, accent: true },
                { label: '个人业绩', value: statistics.kpi, accent: false },
                { label: '团队总人数', value: String(statistics.teamCount), accent: false },
                { label: '直推人数', value: String(statistics.inviteCount), accent: false },
            ],
        } } : {}),
    }
}
