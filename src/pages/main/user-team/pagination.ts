export interface MockTeamMember {
    id: string
    address: string
    level: '新手'
    joinedAt: string
    personalStake: string
    teamStake: string
}

export interface MockTeamMemberPage {
    items: readonly MockTeamMember[]
    hasMore: boolean
    page: number
}

export const TEAM_MEMBER_PAGE_SIZE = 4

export const MOCK_TEAM_MEMBERS: readonly MockTeamMember[] = Array.from(
    { length: 12 },
    (_, index) => ({
        id: `team-member-${index + 1}`,
        address: index < 4 ? 'sbds****dsel' : `sbds****dse${index + 1}`,
        level: '新手',
        joinedAt: '2025.08.26 12:24',
        personalStake: '4,428 Token',
        teamStake: '4,428 Token',
    }),
)

export function getMockTeamMemberPage(
    query: string,
    requestedPage: number,
    pageSize = TEAM_MEMBER_PAGE_SIZE,
): MockTeamMemberPage {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const safePage = Math.max(1, Math.floor(requestedPage))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const matchingMembers = normalizedQuery
        ? MOCK_TEAM_MEMBERS.filter((member) => member.address.toLocaleLowerCase().includes(normalizedQuery))
        : MOCK_TEAM_MEMBERS
    const end = Math.min(safePage * safePageSize, matchingMembers.length)

    return {
        items: matchingMembers.slice(0, end),
        hasMore: end < matchingMembers.length,
        page: safePage,
    }
}
