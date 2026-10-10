import assert from 'node:assert/strict'
import test from 'node:test'

import { createCardPackPagination } from '../src/pages/main/card-pack/pagination.ts'
import { loadCardPackPreviewPage } from '../src/pages/main/card-pack/preview.ts'

const outgoing = { orderType: 'outgoing', status: 'pending' }
const incoming = { orderType: 'incoming', status: 'pending' }
const order = (id) => ({ kind: 'card', id, color: 'red', name: '元宝典藏卡', principal: '100', principalLabel: '本金(元气）', principalAsset: 'yuanqi', purchasedAt: '2026.02.24 12:28' })
const page = (id, hasMore = false) => ({ items: id ? [order(id)] : [], hasMore })

function deferredLoader() {
    const requests = []
    const pagination = createCardPackPagination((query, pageNumber) => new Promise((resolve, reject) => {
        requests.push({ query, page: pageNumber, resolve, reject })
    }))
    return { requests, pagination }
}

test('replacement resets list, cursor and load-more guards before requesting page one', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    await pagination.loadMore()
    assert.equal(requests.length, 1)
    assert.equal(pagination.getSnapshot().hasMore, false)
    requests[0].resolve(page('first', true))
    await first

    const replacement = pagination.replace(incoming)
    assert.deepEqual(pagination.getSnapshot(), {
        query: incoming, items: [], page: 0, hasMore: false,
        isFirstLoading: true, isLoadingMore: false, loadError: false,
    })
    await pagination.loadMore()
    assert.deepEqual(requests.map((request) => request.page), [1, 1])
    requests[1].resolve(page(null))
    await replacement
    assert.equal(pagination.getSnapshot().hasMore, false)
    assert.equal(pagination.getSnapshot().isFirstLoading, false)
})

test('pagination appends once and stops after the final response', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    requests[0].resolve(page('first', true))
    await first
    const second = pagination.loadMore()
    await pagination.loadMore()
    assert.equal(requests.length, 2)
    assert.equal(pagination.getSnapshot().isLoadingMore, true)
    requests[1].resolve(page('second'))
    await second
    assert.deepEqual(pagination.getSnapshot().items.map(({ id }) => id), ['first', 'second'])
    assert.equal(pagination.getSnapshot().page, 2)
    await pagination.loadMore()
    assert.equal(requests.length, 2)
})

test('a late previous-tab page two cannot append to or unlock replacement page one', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    requests[0].resolve(page('first', true))
    await first
    const oldSecond = pagination.loadMore()
    const replacement = pagination.replace(incoming)
    requests[1].resolve(page('stale', true))
    await oldSecond
    assert.equal(pagination.getSnapshot().isFirstLoading, true)
    assert.deepEqual(pagination.getSnapshot().items, [])
    assert.equal(pagination.getSnapshot().hasMore, false)
    await pagination.loadMore()
    assert.equal(requests.length, 3)
    requests[2].resolve(page('current'))
    await replacement
    assert.deepEqual(pagination.getSnapshot().items.map(({ id }) => id), ['current'])
})

test('fast filter changes keep only the latest result and ignore stale errors', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    const second = pagination.replace(incoming)
    const third = pagination.replace({ ...outgoing, status: 'won' })
    requests[2].resolve(page('newest'))
    await third
    requests[0].resolve(page('stale', true))
    requests[1].reject(new Error('stale failure'))
    await Promise.all([first, second])
    assert.equal(pagination.getSnapshot().query.status, 'won')
    assert.equal(pagination.getSnapshot().loadError, false)
    assert.deepEqual(pagination.getSnapshot().items.map(({ id }) => id), ['newest'])
})

test('refresh awaits reloaded page one and replaces appended data', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    requests[0].resolve(page('first', true))
    await first
    const second = pagination.loadMore()
    requests[1].resolve(page('second'))
    await second
    let finished = false
    const refresh = pagination.replace().then(() => { finished = true })
    await Promise.resolve()
    assert.equal(finished, false)
    assert.deepEqual(pagination.getSnapshot().items, [])
    requests[2].resolve(page('reloaded', true))
    await refresh
    assert.deepEqual(pagination.getSnapshot().items.map(({ id }) => id), ['reloaded'])
    assert.equal(pagination.getSnapshot().page, 1)
    assert.equal(pagination.getSnapshot().hasMore, true)
})

test('a current loading failure rejects, clears the guard and preserves the cursor for retry', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    requests[0].resolve(page('first', true))
    await first
    const second = pagination.loadMore()
    requests[1].reject(new Error('offline'))
    await assert.rejects(second, /offline/)
    assert.equal(pagination.getSnapshot().page, 1)
    assert.equal(pagination.getSnapshot().isLoadingMore, false)
    const retry = pagination.loadMore()
    assert.equal(requests[2].page, 2)
    requests[2].resolve(page('retried'))
    await retry
    assert.equal(pagination.getSnapshot().loadError, false)
    assert.deepEqual(pagination.getSnapshot().items.map(({ id }) => id), ['first', 'retried'])
})

test('page-one failure leaves an empty, stopped list and can be retried', async () => {
    const { requests, pagination } = deferredLoader()
    const first = pagination.replace()
    requests[0].reject(new Error('offline'))
    await assert.rejects(first, /offline/)
    assert.equal(pagination.getSnapshot().isFirstLoading, false)
    assert.equal(pagination.getSnapshot().loadError, true)
    assert.equal(pagination.getSnapshot().hasMore, false)
    const retry = pagination.replace()
    requests[1].resolve(page('recovered'))
    await retry
    assert.equal(pagination.getSnapshot().loadError, false)
})

test('unmount invalidation discards results and unsubscribed listeners are not notified', async () => {
    const { requests, pagination } = deferredLoader()
    let notifications = 0
    const unsubscribe = pagination.subscribe(() => { notifications += 1 })
    const first = pagination.replace()
    assert.equal(notifications, 1)
    unsubscribe()
    pagination.invalidate()
    requests[0].resolve(page('after-unmount'))
    await first
    assert.equal(notifications, 1)
    assert.deepEqual(pagination.getSnapshot().items, [])
    const remount = pagination.replace()
    requests[1].resolve(page('remount'))
    await remount
    assert.equal(pagination.getSnapshot().items[0].id, 'remount')
})

test('outgoing preview preserves two finite pages and no invented winner records', async () => {
    const [first, second, end, empty] = await Promise.all([
        loadCardPackPreviewPage(outgoing, 1),
        loadCardPackPreviewPage(outgoing, 2),
        loadCardPackPreviewPage(outgoing, 3),
        loadCardPackPreviewPage({ ...outgoing, status: 'won' }, 1),
    ])
    assert.deepEqual(first.items.map(({ principal }) => principal), ['100', '300', '1,000'])
    assert.equal(first.hasMore, true)
    assert.equal(second.hasMore, false)
    assert.equal(new Set([...first.items, ...second.items].map(({ id }) => id)).size, 6)
    assert.deepEqual(end, { items: [], hasMore: false })
    assert.deepEqual(empty, { items: [], hasMore: false })
})

test('incoming preview preserves source amounts and per-card labels, with two finite pages', async () => {
    const first = await loadCardPackPreviewPage(incoming, 1)
    const second = await loadCardPackPreviewPage(incoming, 2)
    const end = await loadCardPackPreviewPage(incoming, 3)
    assert.deepEqual(first.items.map(({ principal }) => principal), ['109+1', '309+3', '1030+10'])
    assert.deepEqual(first.items.map(({ principalLabel }) => principalLabel), ['本金(余额+宝气）', '本金(元气）', '本金(元气）'])
    assert.ok(first.items.every(({ principalAsset }) => principalAsset === 'usdt-baoqi'))
    assert.equal(first.hasMore, true)
    assert.equal(second.hasMore, false)
    assert.equal(new Set([...first.items, ...second.items].map(({ id }) => id)).size, 6)
    assert.deepEqual(end, { items: [], hasMore: false })
})

test('completed release and undocumented incoming statuses stay empty', async () => {
    for (const query of [
        { ...incoming, status: 'won' },
        { ...incoming, status: 'lost' },
        { orderType: 'released', status: 'completed' },
    ]) {
        assert.deepEqual(await loadCardPackPreviewPage(query, 1), { items: [], hasMore: false })
    }
})

test('ongoing releases preserve all source strings in two finite pages, without invented card fields', async () => {
    const query = { orderType: 'released', status: 'ongoing' }
    const first = await loadCardPackPreviewPage(query, 1)
    const second = await loadCardPackPreviewPage(query, 2)
    const end = await loadCardPackPreviewPage(query, 3)
    assert.equal(first.items.length, 3)
    assert.equal(first.hasMore, true)
    assert.equal(second.hasMore, false)
    assert.equal(new Set([...first.items, ...second.items].map(({ id }) => id)).size, 6)
    for (const item of first.items) {
        assert.equal(item.kind, 'release')
        assert.equal(item.principal, '109+1')
        assert.equal(item.createdAt, '2026.02.24 12:28')
        assert.deepEqual([item.totalUsdtIncome, item.totalBaoqiIncome, item.todayUsdtIncome, item.todayBaoqiIncome, item.period], ['286.00', '46.00', '6.124875', '1.293846', '20/180'])
        assert.ok(!('name' in item) && !('color' in item))
    }
    assert.deepEqual(end, { items: [], hasMore: false })
})

test('replacement and unmount abort actual loader signals and discard obsolete network results', async () => {
    const requests = []
    const pagination = createCardPackPagination((query, page, signal) => new Promise((resolve) => requests.push({ query, page, signal, resolve })))
    const first = pagination.replace()
    const second = pagination.replace(incoming)
    assert.equal(requests[0].signal.aborted, true)
    requests[0].resolve({ items: [], hasMore: true })
    await first
    assert.equal(pagination.getSnapshot().hasMore, false)
    pagination.invalidate()
    assert.equal(requests[1].signal.aborted, true)
    requests[1].resolve({ items: [], hasMore: true })
    await second
    assert.equal(pagination.getSnapshot().hasMore, false)
})
