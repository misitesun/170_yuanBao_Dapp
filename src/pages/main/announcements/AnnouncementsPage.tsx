import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Empty } from '@/components/Empty'
import { Icon } from '@/components/Icon'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { PagePullRefresh } from '@/components/PagePullRefresh'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'
import { getNotices } from '@/features/notices/api.ts'
import { noticeSummary } from '@/features/notices/html.ts'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { usePreviewList } from '../pagination/usePreviewList.ts'
import './AnnouncementsPage.scss'

function AnnouncementList({ onError }: { onError: (error?: unknown) => void }) {
    const { pushRoute } = useAppNavigate()
    const { t, i18n } = useTranslation()
    const { state, pagination } = usePreviewList(getNotices, i18n.language, onError)
    useEffect(() => {
        if (pagination.getSnapshot().query !== i18n.language) void pagination.replace(i18n.language).catch(onError)
    }, [i18n.language, pagination, onError])
    return <div className="announcements-page min-vh-100">
        <SecondaryHeader title={t("公告列表")} />
        <main className="announcements-page__main" aria-busy={state.isFirstLoading}>
            {state.items.length ? <ul className="announcements-page__list flex flex-column" aria-label={t("公告列表")}>
                {state.items.map((notice) => <li key={notice.id}>
                    <button type="button" className="announcements-page__card flex items-center tl" onClick={() => pushRoute(`${ROUTE_PATH.announcements}/${notice.id}`)}>
                        <div className="announcements-page__content flex-1">
                            <h2 className="announcements-page__title size-28 bold-5 word-ellipsis-2">{notice.title}</h2>
                            <p className="announcements-page__summary size-26 word-ellipsis-2">{noticeSummary(notice.content)}</p>
                            <time className="announcements-page__time size-24" dateTime={notice.updatedAt.replace(' ', 'T')}>{notice.updatedAt.replaceAll('-', '.')}</time>
                        </div><Icon name="arrow" className="announcements-page__arrow size-32" />
                    </button>
                </li>)}
            </ul> : !state.isFirstLoading ? state.loadError ? <div className="tc"><p>{t("公告加载失败")}</p><button type="button" className="auto-btn" onClick={() => void pagination.replace().catch(onError)}>{t("重新加载")}</button></div> : <Empty text={t("暂无公告")} /> : null}
        </main>
    </div>
}
export function AnnouncementsPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => { if (!wasHttpErrorReported(error)) showToast(t("公告加载失败，请重试"), 'error') }, [showToast, t])
    return <PagePullRefresh onError={onError}><AnnouncementList onError={onError} /><Toast message={message} variant={variant} /></PagePullRefresh>
}
