import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
    getMockWithdrawalRecords,
    MOCK_WITHDRAWAL_RECORDS,
} from '../src/pages/main/user-withdraw-records/data.ts'

test('extraction record fixtures expose the three confirmed local states', () => {
    const pending = getMockWithdrawalRecords('pending')
    const approved = getMockWithdrawalRecords('approved')
    const rejected = getMockWithdrawalRecords('rejected')

    assert.equal(pending, MOCK_WITHDRAWAL_RECORDS.pending)
    assert.equal(pending.length, 9)
    assert.equal(approved.length, 9)
    assert.equal(rejected.length, 5)
    assert.equal(pending[0]?.rejectionReason, undefined)
    assert.equal(approved[0]?.rejectionReason, undefined)
    assert.equal(rejected[0]?.rejectionReason, '账户异常')
})

test('extraction records page wires semantic tabs, records and pull refresh', async () => {
    const [page, styles, readme, preview] = await Promise.all([
        readFile('src/pages/main/user-withdraw-records/UserWithdrawRecordsPage.tsx', 'utf8'),
        readFile('src/pages/main/user-withdraw-records/UserWithdrawRecordsPage.scss', 'utf8'),
        readFile('src/pages/main/user-withdraw-records/README.md', 'utf8'),
        readFile('src/showcase/UserWithdrawRecordsPreview.tsx', 'utf8'),
    ])

    assert.match(page, /<SecondaryHeader title="提取记录"/)
    assert.match(page, /<SegmentedTabs/)
    assert.match(page, /审核中/)
    assert.match(page, /已通过/)
    assert.match(page, /已驳回/)
    assert.match(page, /role="tabpanel"/)
    assert.match(page, /<article/)
    assert.match(page, /驳回原因：\{record\.rejectionReason\}/)
    assert.match(page, /usePageRefresh\(refreshPage\)/)
    assert.match(page, /await waitForMockData\(\)/)
    assert.doesNotMatch(page, /提现/)

    assert.match(styles, /min-height: 146px;/)
    assert.match(styles, /min-height: 202px;/)
    assert.match(styles, /gap: 15px;/)
    assert.match(styles, /gap: 20px;/)
    assert.doesNotMatch(styles, /position:\s*(?:absolute|fixed|sticky)/)

    assert.match(readme, /750×1624/)
    assert.match(readme, /no page content is positioned outside normal flow/)
    assert.match(preview, /<UserWithdrawRecordsPageWithRefresh \/>/)
})

test('extraction record entry and routes are connected', async () => {
    const [entry, routes, router, routerReadme] = await Promise.all([
        readFile('src/pages/main/user-withdraw/UserWithdrawPage.tsx', 'utf8'),
        readFile('src/router/routes.ts', 'utf8'),
        readFile('src/router/AppRouter.tsx', 'utf8'),
        readFile('src/router/README.md', 'utf8'),
    ])

    assert.match(entry, /pushRoute\(ROUTE_PATH\.userWithdrawRecords\)/)
    assert.match(routes, /userWithdrawRecords:\s*'\/user\/withdraw\/records'/)
    assert.match(router, /ROUTE_PATH\.userWithdrawRecords\.slice\(1\)/)
    assert.match(router, /\/preview\/user-withdraw-records/)
    assert.match(routerReadme, /\/user\/withdraw\/records/)
})
