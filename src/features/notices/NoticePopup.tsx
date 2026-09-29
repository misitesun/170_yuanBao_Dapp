import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '@/components/ActionButton'
import { Popup } from '@/components/Popup'
import { useSessionStore } from '../auth/state.ts'
import { getPopupNotice, markNoticeRead, type Notice } from './api.ts'
import { NoticeContent } from './content.tsx'
import './NoticePopup.scss'

export function NoticePopup() {
    const userId = useSessionStore((state) => state.user?.id)
    const { t, i18n } = useTranslation()
    const [notice, setNotice] = useState<Notice | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    useEffect(() => {
        setNotice(null)
        setError('')
        const controller = new AbortController()
        if (userId) void getPopupNotice(controller.signal).then((result) => {
            if (!controller.signal.aborted && result.isShow) setNotice(result.notice)
        }).catch((failure: unknown) => {
            if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : '公告加载失败')
        })
        return () => controller.abort()
    }, [userId, i18n.language])
    async function read() {
        if (!notice || submitting) return
        setSubmitting(true)
        try {
            await markNoticeRead(notice.id)
            setNotice(null)
        } catch (failure) { setError(failure instanceof Error ? failure.message : '已读操作失败，请重试') }
        finally { setSubmitting(false) }
    }
    return <Popup show={Boolean(notice)} title={notice?.title} onClose={() => { if (!submitting) setNotice(null) }} closeOnOverlayClick={!submitting}>
        <div className="notice-popup">
            {notice ? <><time>{notice.updatedAt.replaceAll('-', '.')}</time><NoticeContent html={notice.content} /></> : null}
            {error ? <p role="alert">{t(error)}</p> : null}
            <ActionButton loading={submitting} onClick={() => void read()}>{t("我已阅读")}</ActionButton>
        </div>
    </Popup>
}
