import {
    createContext,
    useContext,
    useLayoutEffect,
} from 'react'

export type PageRefreshHandler = () => Promise<void> | void
export type PageLoadMoreHandler = () => Promise<void> | void

export interface PageLoadMoreOptions {
    enabled?: boolean
    hasMore?: boolean
}

export interface PageLoadMoreRegistration {
    handler: PageLoadMoreHandler
    enabled: boolean
    hasMore: boolean
}

export interface PageRefreshContextValue {
    registerPageRefresh: (handler: PageRefreshHandler) => () => void
    registerPageLoadMore: (
        handler: PageLoadMoreHandler,
        options: Required<PageLoadMoreOptions>,
    ) => () => void
}

export const PageRefreshContext = createContext<PageRefreshContextValue | null>(null)

export function usePageRefresh(
    onRefresh: PageRefreshHandler,
    enabled = true,
): void {
    const context = useContext(PageRefreshContext)

    useLayoutEffect(() => {
        if (!context || !enabled) return undefined

        return context.registerPageRefresh(onRefresh)
    }, [context, enabled, onRefresh])
}

export function usePageLoadMore(
    onLoadMore: PageLoadMoreHandler,
    options: PageLoadMoreOptions = {},
): void {
    const context = useContext(PageRefreshContext)
    const {
        enabled = true,
        hasMore = true,
    } = options

    useLayoutEffect(() => {
        if (!context) return undefined

        return context.registerPageLoadMore(onLoadMore, { enabled, hasMore })
    }, [context, enabled, hasMore, onLoadMore])
}
