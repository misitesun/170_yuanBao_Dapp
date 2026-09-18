import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import {
    getMockTeamMemberPage,
    MOCK_TEAM_MEMBERS,
    TEAM_MEMBER_PAGE_SIZE,
} from '../src/pages/main/user-team/pagination.ts'

test('team member fixtures paginate and filter by the entered address', () => {
    const firstPage = getMockTeamMemberPage('', 1)
    const secondPage = getMockTeamMemberPage('', 2)
    const filteredPage = getMockTeamMemberPage('dse12', 1)

    assert.equal(TEAM_MEMBER_PAGE_SIZE, 4)
    assert.equal(MOCK_TEAM_MEMBERS.length, 12)
    assert.equal(firstPage.items.length, 4)
    assert.equal(firstPage.hasMore, true)
    assert.equal(secondPage.items.length, 8)
    assert.equal(filteredPage.items.length, 1)
    assert.equal(filteredPage.hasMore, false)
})

test('team page renders the designed static summary and local interactions', async () => {
    const page = await readFile('src/pages/main/user-team/UserTeamPage.tsx', 'utf8')

    for (const text of ['我的团队', '地址账户', '我的邀请码', '7C2EX8GN', '团队质押总价值', '团队矿机数', '团队签到有效人数', '团队人数', '直推人数', '团队成员', '查询成员业绩', '个人质押', '团队质押']) {
        assert.match(page, new RegExp(text))
    }
    assert.match(page, /copyTextToClipboard/)
    assert.match(page, /usePageRefresh\(refreshPage\)/)
    assert.match(page, /usePageLoadMore\(loadNextPage/)
    assert.match(page, /<Input/)
    assert.match(page, /prefix=\{<svg/)
    assert.match(page, /<Toast message=\{message\}/)
})

test('team route, development preview and supplied assets stay connected', async () => {
    await Promise.all([
        access('src/assets/user-team/copy-action.png'),
        access('src/assets/user-team/team-value-coins.png'),
    ])

    const [routes, router, userPage, preview] = await Promise.all([
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/pages/main/user/UserPage.tsx', 'utf8'),
        readFile('src/showcase/UserTeamPreview.tsx', 'utf8'),
    ])

    assert.match(routes, /userTeam: '\/user\/team'/)
    assert.match(router, /ROUTE_PATH\.userTeam/)
    assert.match(router, /path="\/preview\/user-team"/)
    assert.match(userPage, /pushRoute\(ROUTE_PATH\.userTeam\)/)
    assert.match(preview, /<PagePullRefresh><UserTeamPage \/><\/PagePullRefresh>/)
})
