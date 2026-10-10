import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Empty } from '@/components/Empty'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { ROUTE_PATH, useAppNavigate } from '@/router'
import { getNotice, type Notice } from '@/features/notices/api.ts'
import { NoticeContent } from '@/features/notices/content.tsx'
import './AnnouncementDetailPage.scss'

export function AnnouncementDetailPage() {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const { replaceRoute } = useAppNavigate()
    const [state, setState] = useState<{ id?: string; notice: Notice | null; loading: boolean; error: string }>({ notice: null, loading: true, error: '' })
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setState({ id, notice: null, loading: true, error: '' })
        const value = Number(id)
        if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(value) || value < 1) {
            setState({ id, notice: null, loading: false, error: '公告不存在或已移除' })
        } else void getNotice(value, controller.signal).then((notice) => {
            if (!controller.signal.aborted) setState({ id, notice, loading: false, error: '' })
        }).catch((failure: unknown) => {
            if (!controller.signal.aborted) setState({ id, notice: null, loading: false, error: failure instanceof Error ? failure.message : '公告加载失败' })
        })
        return () => controller.abort()
    }, [id, retry])
    const loading = state.id !== id || state.loading
    const notice = state.id === id ? state.notice : null
    return <div className="announcement-detail-page min-vh-100">
        <SecondaryHeader title={t("公告详情")} />
        <main className="announcement-detail-page__main" aria-busy={loading}>
            {loading ? null : notice ? (
                <article className="announcement-detail-page__article">
                    <header className="announcement-detail-page__heading">
                        <h1 className="announcement-detail-page__title size-36 bold-6">{notice.title}</h1>
                        <time className="announcement-detail-page__time size-24" dateTime={notice.updatedAt.replace(' ', 'T')}>{notice.updatedAt.replaceAll('-', '.')}</time>
                    </header>
                    <div className="announcement-detail-page__body"><NoticeContent html={notice.content} /></div>
                </article>
            ) : <div className="flex flex-column items-center gap-20">
                <Empty text={t(state.error || '公告不存在或已移除')} />
                <button type="button" className="auto-btn" onClick={() => setRetry((value) => value + 1)}>{t("重新加载")}</button>
                <button type="button" className="announcement-detail-page__back auto-btn size-26" onClick={() => replaceRoute(ROUTE_PATH.announcements)}>{t("返回公告列表")}</button>
            </div>}
        </main>
    </div>
}
