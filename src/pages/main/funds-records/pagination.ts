export interface RecordsSnapshot<Query, Item> {
    query: Query
    items: readonly Item[]
    page: number
    hasMore: boolean
    isFirstLoading: boolean
    isLoadingMore: boolean
    loadError: boolean
}

/** Page-local state; synchronous replacement guards also protect in-flight callbacks. */
export function createRecordsPagination<Query, Item>(
    loadPage: (query: Query, page: number, signal: AbortSignal) => Promise<{ items: readonly Item[]; hasMore: boolean }>,
    initialQuery: Query,
) {
    let generation = 0
    let controller: AbortController | undefined
    let snapshot: RecordsSnapshot<Query, Item> = {
        query: initialQuery,
        items: [],
        page: 0,
        hasMore: false,
        isFirstLoading: true,
        isLoadingMore: false,
        loadError: false,
    }
    const listeners = new Set<() => void>()

    function update(next: RecordsSnapshot<Query, Item>) {
        snapshot = next
        listeners.forEach((listener) => listener())
    }

    async function replace(query: Query = snapshot.query): Promise<void> {
        const requestGeneration = ++generation
        controller?.abort()
        const requestController = new AbortController()
        controller = requestController
        update({ query, items: [], page: 0, hasMore: false, isFirstLoading: true, isLoadingMore: false, loadError: false })

        try {
            const result = await loadPage(query, 1, requestController.signal)
            if (requestGeneration !== generation) return

            update({ ...snapshot, items: result.items, page: 1, hasMore: result.hasMore, isFirstLoading: false })
        } catch (error) {
            if (requestGeneration !== generation) return

            update({ ...snapshot, isFirstLoading: false, loadError: true })
            throw error
        }
    }

    async function loadMore(): Promise<void> {
        if (snapshot.isFirstLoading || snapshot.isLoadingMore || !snapshot.hasMore) return

        const requestGeneration = generation
        const requestController = new AbortController()
        controller = requestController
        const nextPage = snapshot.page + 1
        const query = snapshot.query
        update({ ...snapshot, isLoadingMore: true, loadError: false })

        try {
            const result = await loadPage(query, nextPage, requestController.signal)
            if (requestGeneration !== generation) return

            update({ ...snapshot, items: [...snapshot.items, ...result.items], page: nextPage, hasMore: result.hasMore, isLoadingMore: false })
        } catch (error) {
            if (requestGeneration !== generation) return

            update({ ...snapshot, isLoadingMore: false, loadError: true })
            throw error
        }
    }

    return {
        getSnapshot: () => snapshot,
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => { listeners.delete(listener) }
        },
        replace,
        loadMore,
        invalidate() { generation += 1; controller?.abort() },
    }
}
