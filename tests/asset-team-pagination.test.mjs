import assert from 'node:assert/strict'
import test from 'node:test'
import { createListPagination } from '../src/pages/main/pagination/pagination.ts'

function deferredLoader() {
    const requests = []
    const load = (query, page) => new Promise((resolve, reject) => requests.push({ query, page, resolve, reject }))
    return { load, requests }
}
const result = (id, hasMore = true, overview = { total: id }) => ({ items: [{ id }], hasMore, overview })

test('asset Tab replacement disables pagination synchronously and discards older first/append responses', async () => {
    const { load, requests } = deferredLoader()
    const list = createListPagination(load, 'usdt')
    const oldFirst = list.replace()
    await list.loadMore()
    assert.equal(requests.length, 1)
    const nextFirst = list.replace('yuanqi')
    assert.deepEqual({ ...list.getSnapshot(), overview: null }, {
        query: 'yuanqi', items: [], overview: null, page: 0, hasMore: false,
        isFirstLoading: true, isLoadingMore: false, loadError: false,
    })
    requests[1].resolve(result('new-first'))
    await nextFirst
    requests[0].resolve(result('stale-first'))
    await oldFirst
    assert.equal(list.getSnapshot().items[0].id, 'new-first')

    const oldMore = list.loadMore()
    const refresh = list.replace('baoqi')
    await list.loadMore()
    assert.equal(requests.length, 4)
    requests[2].resolve(result('stale-append'))
    await oldMore
    assert.equal(list.getSnapshot().items.length, 0)
    assert.equal(list.getSnapshot().hasMore, false)
    requests[3].resolve({ items: [], hasMore: false, overview: { total: 'empty' } })
    await refresh
    assert.equal(list.getSnapshot().page, 1)
    assert.equal(list.getSnapshot().items.length, 0)
    await list.loadMore()
    assert.equal(requests.length, 4)
})

test('team refresh awaits overview and first page; duplicate loads and append overview cannot change it', async () => {
    const { load, requests } = deferredLoader()
    const list = createListPagination(load, 'all')
    let completed = false
    const first = list.replace().then(() => { completed = true })
    await Promise.resolve()
    assert.equal(completed, false)
    requests[0].resolve(result('first', true, { total: 'old' }))
    await first
    const more = list.loadMore()
    await list.loadMore()
    assert.equal(requests.length, 2)
    requests[1].resolve(result('second', false, { total: 'not-a-summary' }))
    await more
    assert.deepEqual(list.getSnapshot().overview, { total: 'old' })
    assert.deepEqual(list.getSnapshot().items.map((item) => item.id), ['first', 'second'])
    await list.loadMore()
    assert.equal(requests.length, 2)

    const refresh = list.replace()
    assert.deepEqual(list.getSnapshot().overview, { total: 'old' })
    assert.equal(list.getSnapshot().items.length, 0)
    requests[2].resolve(result('refreshed', false, { total: 'new' }))
    await refresh
    assert.deepEqual(list.getSnapshot().overview, { total: 'new' })
    assert.deepEqual(list.getSnapshot().items.map((item) => item.id), ['refreshed'])
})

test('failed append retains cursor and list for retry; failed/stale first page remains isolated', async () => {
    const { load, requests } = deferredLoader()
    const list = createListPagination(load, 'all')
    const first = list.replace()
    requests[0].resolve(result('first'))
    await first
    const more = list.loadMore()
    requests[1].reject(new Error('network'))
    await assert.rejects(more, /network/)
    assert.equal(list.getSnapshot().page, 1)
    assert.equal(list.getSnapshot().loadError, true)
    assert.equal(list.getSnapshot().items.length, 1)
    const retry = list.loadMore()
    assert.equal(requests[2].page, 2)
    requests[2].resolve(result('second', false))
    await retry
    assert.equal(list.getSnapshot().loadError, false)

    const old = list.replace('old')
    const current = list.replace('new')
    requests[3].reject(new Error('obsolete'))
    await old
    assert.equal(list.getSnapshot().loadError, false)
    requests[4].reject(new Error('first page failure'))
    await assert.rejects(current, /first page failure/)
    assert.equal(list.getSnapshot().hasMore, false)
    assert.equal(list.getSnapshot().isFirstLoading, false)
    assert.equal(list.getSnapshot().loadError, true)
})

test('unmount invalidation prevents later updates and subscriptions unsubscribe', async () => {
    const { load, requests } = deferredLoader()
    const list = createListPagination(load, 'all')
    let changes = 0
    const unsubscribe = list.subscribe(() => changes++)
    const first = list.replace()
    assert.equal(changes, 1)
    const before = list.getSnapshot()
    list.invalidate()
    unsubscribe()
    requests[0].resolve(result('unmounted'))
    await first
    assert.equal(list.getSnapshot(), before)
    assert.equal(changes, 1)
})

