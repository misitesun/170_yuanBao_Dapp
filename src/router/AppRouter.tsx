import { useTranslation } from 'react-i18next'
import {
    useEffect,
    useLayoutEffect,
} from 'react'
import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router'

import { LoginPage } from '@/pages/auth/login/LoginPage'
import { mountAuthSession } from '@/features/auth/session.ts'
import { useSessionStore } from '@/features/auth/state.ts'
import { DropletLoading } from '@/components/DropletLoading'
import { NoticePopup } from '@/features/notices/NoticePopup'

import { HomePage, MainLayout } from '@/pages/main'
import { AuctionPage } from '@/pages/main/auction'
import { CardPackPage } from '@/pages/main/card-pack'
import { AssetsPage } from '@/pages/main/assets'
import { DepositPage } from '@/pages/main/deposit'
import { WithdrawPage } from '@/pages/main/withdraw'
import { DepositRecordsPage } from '@/pages/main/deposit-records'
import { WithdrawRecordsPage } from '@/pages/main/withdraw-records'
import { TeamPage } from '@/pages/main/team'
import { RankingPage } from '@/pages/main/ranking'
import { AnnouncementsPage } from '@/pages/main/announcements'
import { AnnouncementDetailPage } from '@/pages/main/announcement-detail'
import { SHOWCASE_ROUTE_ELEMENTS } from '@/showcase/router/index.ts'

import { AppBrowserRouter } from './AppBrowserRouter.tsx'
import { registerAppRouteReplacer } from './bridge.ts'
import { ROUTE_PATH } from './routes.ts'

function RouterNavigationBridge() {
    const navigate = useNavigate()

    useEffect(() => registerAppRouteReplacer((path) => {
        void navigate(path, { replace: true })
    }), [navigate])

    return null
}

function RouteScrollReset() {
    const { pathname } = useLocation()

    useEffect(() => {
        if (!('scrollRestoration' in window.history)) return

        const previousScrollRestoration = window.history.scrollRestoration

        window.history.scrollRestoration = 'manual'

        return () => {
            window.history.scrollRestoration = previousScrollRestoration
        }
    }, [])

    useLayoutEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

function AuthSessionRuntime() {
    useEffect(mountAuthSession, [])
    return null
}

function RequireAuthentication() {
    const { t } = useTranslation()
    const status = useSessionStore((state) => state.status)
    const location = useLocation()
    if (status === 'checking') return <div className="min-vh-100 flex-center"><DropletLoading ariaLabel={t('正在验证登录')} /></div>
    if (status !== 'authenticated') return <Navigate to={ROUTE_PATH.login} state={{ from: `${location.pathname}${location.search}` }} replace />
    return <><Outlet /><NoticePopup /></>
}

export function AppRouter() {
    return (
        <AppBrowserRouter>
            <RouterNavigationBridge />
            <AuthSessionRuntime />
            <RouteScrollReset />
            <Routes>
                <Route path={ROUTE_PATH.root} element={<LoginPage />} />
                <Route path={ROUTE_PATH.login} element={<LoginPage />} />
                <Route path={ROUTE_PATH.referral} element={<LoginPage />} />
                <Route element={<RequireAuthentication />}>
                    <Route element={<MainLayout />}>
                        <Route path={ROUTE_PATH.home.slice(1)} element={<HomePage />} />
                        <Route path={ROUTE_PATH.auction.slice(1)} element={<AuctionPage />} />
                        <Route path={ROUTE_PATH.cardPack.slice(1)} element={<CardPackPage />} />
                        <Route path={ROUTE_PATH.assets.slice(1)} element={<AssetsPage />} />
                        <Route path={ROUTE_PATH.team.slice(1)} element={<TeamPage />} />
                        <Route path={ROUTE_PATH.ranking.slice(1)} element={<RankingPage />} />
                    </Route>

                    <Route path={ROUTE_PATH.deposit} element={<DepositPage />} />
                    <Route path={ROUTE_PATH.withdraw} element={<WithdrawPage />} />
                    <Route path={ROUTE_PATH.depositRecords} element={<DepositRecordsPage />} />
                    <Route path={ROUTE_PATH.withdrawRecords} element={<WithdrawRecordsPage />} />
                </Route>
                <Route path={ROUTE_PATH.announcements} element={<AnnouncementsPage />} />
                <Route path={ROUTE_PATH.announcementDetail} element={<AnnouncementDetailPage />} />

                {SHOWCASE_ROUTE_ELEMENTS}

                <Route path="*" element={<Navigate to={ROUTE_PATH.root} replace />} />
            </Routes>
        </AppBrowserRouter>
    )
}
