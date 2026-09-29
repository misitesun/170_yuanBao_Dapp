import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import logo from '@/assets/common/yuanbao-logo.png'
import { Icon } from '@/components/Icon'
import { authorizeWallet } from '@/features/auth/session.ts'
import { useSessionStore } from '@/features/auth/state.ts'
import { getDappUserRejectionMessage } from '@/services/dapp/error.ts'
import { getReferralCode, setReferralCode } from '@/services/storage/referral.ts'
import { ROUTE_PATH } from '@/router'
import './LoginPage.scss'

type GalaxyComponent = (typeof import('./Galaxy.tsx'))['default']

export function LoginPage() {
    const { t } = useTranslation()
    const { ref: routeReferral } = useParams<{ ref: string }>()
    const location = useLocation()
    const { status, error } = useSessionStore()
    const started = useRef(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [GalaxyBackground, setGalaxyBackground] = useState<GalaxyComponent | null>(null)

    useEffect(() => {
        const value = routeReferral ?? new URLSearchParams(location.search).get('ref')
        if (value !== null && value !== undefined) setReferralCode(value)
    }, [routeReferral, location.search])

    async function authorize() {
        setMessage('')
        setSubmitting(true)
        try {
            await authorizeWallet(getReferralCode())
        } catch (failure) {
            setMessage(getDappUserRejectionMessage(failure) !== undefined
                ? '已取消钱包授权，可再次尝试'
                : failure instanceof Error ? failure.message : '授权失败，请重试')
        } finally { setSubmitting(false) }
    }

    useEffect(() => {
        if (status !== 'signedOut' || started.current) return
        // Match HU's opening delay. Cleanup cancels StrictMode's first scheduled attempt.
        const timer = window.setTimeout(() => {
            started.current = true
            void authorize()
        }, 1000)
        return () => window.clearTimeout(timer)
    }, [status])

    useEffect(() => {
        let active = true
        void import('./Galaxy.tsx').then((module) => {
            if (active) setGalaxyBackground(() => module.default)
        }).catch(() => undefined)
        return () => { active = false }
    }, [])

    if (status === 'authenticated') {
        const state: unknown = location.state
        const destination = state && typeof state === 'object' && 'from' in state && typeof state.from === 'string'
            && state.from !== '/' && state.from.startsWith('/') && !state.from.startsWith('//')
            && !/^\/(?:login|ref)(?:\/|\?|$)/.test(state.from) ? state.from : ROUTE_PATH.home
        return <Navigate to={destination} replace />
    }
    const failure = message || error
    const loading = status === 'checking' || submitting || !started.current
    return (
        <main className="splash-page" data-page="splash">
            {GalaxyBackground ? <div className="splash-page__galaxy" aria-hidden="true"><GalaxyBackground /></div> : null}
            <div className="splash-page__brand animate__animated animate__zoomIn">
                <img className="splash-page__logo" src={logo} alt={t("元宝拍卖")} />
                <h1>{t("元宝拍卖")}</h1>
            </div>
            <div className="splash-page__tips animate__animated animate__slideInUp" aria-live="polite">
                <div className="splash-page__status">
                    <span role={failure ? 'alert' : undefined}>{failure ? t(failure) : t("欢迎来到元宝拍卖")}</span>
                    {loading ? <Icon name="loading" size={15} ariaLabel={t("正在授权")} /> : null}
                </div>
                {failure && !loading ? <button type="button" onClick={() => void authorize()}>{t("重新授权")}</button> : null}
            </div>
        </main>
    )
}
