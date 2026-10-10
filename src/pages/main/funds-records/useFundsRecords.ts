import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { createRecordsPagination } from './pagination.ts'

export function useFundsRecords<Query, Item>(
    loadPage: (query: Query, page: number, signal: AbortSignal) => Promise<{ items: readonly Item[]; hasMore: boolean }>,
    initialQuery: Query,
    onError: (error?: unknown) => void,
) {
    const [pagination] = useState(() => createRecordsPagination(loadPage, initialQuery))
    const state = useSyncExternalStore(pagination.subscribe, pagination.getSnapshot, pagination.getSnapshot)
    useEffect(() => {
        void pagination.replace().catch(onError)
        return pagination.invalidate
    }, [pagination, onError])
    usePageRefresh(pagination.replace, !state.isFirstLoading && !state.isLoadingMore)
    usePageLoadMore(pagination.loadMore, {
        enabled: !state.isFirstLoading && !state.isLoadingMore,
        hasMore: state.hasMore,
        loadingIndicator: 'droplet',
        showNoMore: state.items.length > 0,
    })
    return { state, pagination }
}
