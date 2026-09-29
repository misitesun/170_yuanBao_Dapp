export interface ListPage<Item, Overview> {
    items: readonly Item[]
    hasMore: boolean
    overview?: Overview
}

export interface ListSnapshot<Query, Item, Overview> {
    query: Query
    items: readonly Item[]
    overview: Overview | null
    page: number
    hasMore: boolean
    isFirstLoading: boolean
    isLoadingMore: boolean
    loadError: boolean
}

/** Asset/team page-local state. Replacement invalidates every older request synchronously. */
export function createListPagination<Query, Item, Overview>(
    loadPage: (query: Query, page: number) => Promise<ListPage<Item, Overview>>,
    initialQuery: Query,
) {
    let generation = 0
    let snapshot: ListSnapshot<Query, Item, Overview> = {
        query: initialQuery, items: [], overview: null, page: 0, hasMore: false,
        isFirstLoading: true, isLoadingMore: false, loadError: false,
    }
    const listeners = new Set<() => void>()

    function update(next: typeof snapshot) {
        snapshot = next
        listeners.forEach((listener) => listener())
    }

    async function replace(query: Query = snapshot.query): Promise<void> {
        const requestGeneration = ++generation
        update({ ...snapshot, query, items: [], page: 0, hasMore: false,
            isFirstLoading: true, isLoadingMore: false, loadError: false })
        try {
            const result = await loadPage(query, 1)
            if (requestGeneration !== generation) return
            update({ ...snapshot, items: result.items, overview: result.overview ?? snapshot.overview,
                page: 1, hasMore: result.hasMore, isFirstLoading: false })
        } catch (error) {
            if (requestGeneration !== generation) return
            update({ ...snapshot, isFirstLoading: false, loadError: true })
            throw error
        }
    }

    async function loadMore(): Promise<void> {
        if (snapshot.isFirstLoading || snapshot.isLoadingMore || !snapshot.hasMore) return
        const requestGeneration = generation
        const nextPage = snapshot.page + 1
        const query = snapshot.query
        update({ ...snapshot, isLoadingMore: true, loadError: false })
        try {
            const result = await loadPage(query, nextPage)
            if (requestGeneration !== generation) return
            update({ ...snapshot, items: [...snapshot.items, ...result.items], page: nextPage,
                hasMore: result.hasMore, isLoadingMore: false })
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
        invalidate() { generation += 1 },
    }
}
