import { useEffect, useState, useSyncExternalStore } from 'react'

import { usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'

import { createListPagination, type ListPage } from './pagination.ts'

/** Mount under PagePullRefresh. The loader must finish the actual page/overview loading work. */
export function usePreviewList<Query, Item, Overview>(
    loadPage: (query: Query, page: number) => Promise<ListPage<Item, Overview>>,
    initialQuery: Query,
    onError: (error?: unknown) => void,
) {
    const [pagination] = useState(() => createListPagination(loadPage, initialQuery))
    const state = useSyncExternalStore(pagination.subscribe, pagination.getSnapshot, pagination.getSnapshot)

    useEffect(() => {
        void pagination.replace().catch(onError)
        return pagination.invalidate
    }, [onError, pagination])

    usePageRefresh(pagination.replace, !state.isFirstLoading && !state.isLoadingMore)
    usePageLoadMore(pagination.loadMore, {
        enabled: !state.isFirstLoading && !state.isLoadingMore,
        hasMore: state.hasMore,
        loadingIndicator: 'droplet',
        showNoMore: state.items.length > 0,
    })

    return { state, pagination }
}
