import { lazy, Suspense, useEffect } from 'react'
import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useNavigate,
} from 'react-router'

import { PagePullRefresh } from '@/components/PagePullRefresh'
import { LoginPage } from '@/pages/auth/index.ts'
import { HomePage, MainLayout, UserPage } from '@/pages/main'
import { OtcPage } from '@/pages/main/otc/OtcPage'
import { OtcBuyOrderDetailPage, OtcOrdersPage } from '@/pages/main/otc-orders'
import { OtcPostBuyPage } from '@/pages/main/otc-post-buy'
import { PointsConvertPage } from '@/pages/main/points-convert'
import { PresalePage } from '@/pages/main/presale/PresalePage'
import { PresaleOrdersPage } from '@/pages/main/presale-orders'
import { StakePage } from '@/pages/main/stake/StakePage'
import { StakeOrdersPage } from '@/pages/main/stake-orders'
import { UserPartnerPage } from '@/pages/main/user-partner'
import { UserRechargePage } from '@/pages/main/user-recharge'
import { UserTeamPage } from '@/pages/main/user-team'
import { UserWithdrawPage } from '@/pages/main/user-withdraw'
import { UserWithdrawRecordsPage } from '@/pages/main/user-withdraw-records'
import { SplashPage } from '@/pages/splash/SplashPage.tsx'
import { SHOWCASE_ROUTE_ELEMENTS } from '@/showcase/router/index.ts'
import { useUserStore } from '@/stores/user/store.ts'

import { AppBrowserRouter } from './AppBrowserRouter.tsx'
import { registerAppRouteReplacer } from './bridge.ts'
import { DEFAULT_LAYOUT_MENU_TYPE, LAYOUT_MENU_TYPE } from './config.ts'
import { ROUTE_PATH } from './routes.ts'

const HomePreview = import.meta.env.DEV ? lazy(() => import('@/showcase/HomePreview').then((page) => ({ default: page.HomePreview }))) : null

const StakePreview = import.meta.env.DEV ? lazy(() => import('@/showcase/StakePreview').then((page) => ({ default: page.StakePreview }))) : null

const StakeOrdersPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/StakeOrdersPreview').then((page) => ({ default: page.StakeOrdersPreview }))) : null

const PresalePreview = import.meta.env.DEV ? lazy(() => import('@/showcase/PresalePreview').then((page) => ({ default: page.PresalePreview }))) : null

const PresaleOrdersPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/PresaleOrdersPreview').then((page) => ({ default: page.PresaleOrdersPreview }))) : null

const OtcPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/OtcPreview').then((page) => ({ default: page.OtcPreview }))) : null

const OtcOrdersPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/OtcOrdersPreview').then((page) => ({ default: page.OtcOrdersPreview }))) : null

const OtcBuyOrderDetailPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/OtcBuyOrderDetailPreview').then((page) => ({ default: page.OtcBuyOrderDetailPreview }))) : null

const OtcPostBuyPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/OtcPostBuyPreview').then((page) => ({ default: page.OtcPostBuyPreview }))) : null

const PointsConvertPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/PointsConvertPreview').then((page) => ({ default: page.PointsConvertPreview }))) : null

const UserPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserPreview').then((page) => ({ default: page.UserPreview }))) : null

const UserPartnerPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserPartnerPreview').then((page) => ({ default: page.UserPartnerPreview }))) : null

const UserTeamPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserTeamPreview').then((page) => ({ default: page.UserTeamPreview }))) : null

const UserWithdrawPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserWithdrawPreview').then((page) => ({ default: page.UserWithdrawPreview }))) : null

const UserWithdrawRecordsPreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserWithdrawRecordsPreview').then((page) => ({ default: page.UserWithdrawRecordsPreview }))) : null

const UserRechargePreview = import.meta.env.DEV ? lazy(() => import('@/showcase/UserRechargePreview').then((page) => ({ default: page.UserRechargePreview }))) : null

function RouterNavigationBridge() {
    const navigate = useNavigate()

    useEffect(() => registerAppRouteReplacer((path) => {
        void navigate(path, { replace: true })
    }), [navigate])

    return null
}

function RequireAuthentication() {
    const isAuthenticated = useUserStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to={ROUTE_PATH.root} replace />
    }

    return <Outlet />
}

function PullRefreshRouteOutlet() {
    return (
        <PagePullRefresh bottomInset={DEFAULT_LAYOUT_MENU_TYPE === LAYOUT_MENU_TYPE.tabbar ? 'tabbar' : 'none'}>
            <Outlet />
        </PagePullRefresh>
    )
}

function SecondaryPullRefreshRouteOutlet() {
    return (
        <PagePullRefresh>
            <Outlet />
        </PagePullRefresh>
    )
}

export function AppRouter() {
    return (
        <AppBrowserRouter>
            <RouterNavigationBridge />
            <Routes>
                <Route path={ROUTE_PATH.root} element={<SplashPage />} />
                <Route path={ROUTE_PATH.referral} element={<SplashPage />} />
                <Route path={ROUTE_PATH.login} element={<LoginPage />} />

                <Route element={<RequireAuthentication />}>
                    <Route path={ROUTE_PATH.otcPostBuy.slice(1)} element={<OtcPostBuyPage />} />
                    <Route path={ROUTE_PATH.pointsConvert.slice(1)} element={<PointsConvertPage />} />
                    <Route path={ROUTE_PATH.userRecharge.slice(1)} element={<UserRechargePage />} />
                    <Route path={ROUTE_PATH.userWithdraw.slice(1)} element={<UserWithdrawPage />} />
                    <Route element={<SecondaryPullRefreshRouteOutlet />}>
                        <Route path={ROUTE_PATH.stakeOrders.slice(1)} element={<StakeOrdersPage />} />
                        <Route path={ROUTE_PATH.presaleOrders.slice(1)} element={<PresaleOrdersPage />} />
                        <Route path={ROUTE_PATH.otcOrders.slice(1)} element={<OtcOrdersPage />} />
                        <Route path={ROUTE_PATH.otcBuyOrderDetail.slice(1)} element={<OtcBuyOrderDetailPage />} />
                        <Route path={ROUTE_PATH.userPartner.slice(1)} element={<UserPartnerPage />} />
                        <Route path={ROUTE_PATH.userTeam.slice(1)} element={<UserTeamPage />} />
                        <Route path={ROUTE_PATH.userWithdrawRecords.slice(1)} element={<UserWithdrawRecordsPage />} />
                    </Route>
                    <Route element={<PullRefreshRouteOutlet />}>
                        <Route element={<MainLayout />}>
                            <Route path={ROUTE_PATH.home.slice(1)} element={<HomePage />} />
                            <Route path={ROUTE_PATH.stake.slice(1)} element={<StakePage />} />
                            <Route path={ROUTE_PATH.presale.slice(1)} element={<PresalePage />} />
                            <Route path={ROUTE_PATH.otc.slice(1)} element={<OtcPage />} />
                            <Route path={ROUTE_PATH.user.slice(1)} element={<UserPage />} />
                        </Route>
                    </Route>
                </Route>

                {HomePreview ? <Route path="/preview/home" element={<Suspense fallback={null}><HomePreview /></Suspense>} /> : null}
                {StakePreview ? <Route path="/preview/stake" element={<Suspense fallback={null}><StakePreview /></Suspense>} /> : null}
                {StakeOrdersPreview ? <Route path="/preview/stake-orders" element={<Suspense fallback={null}><StakeOrdersPreview /></Suspense>} /> : null}
                {PresalePreview ? <Route path="/preview/presale" element={<Suspense fallback={null}><PresalePreview /></Suspense>} /> : null}
                {PresaleOrdersPreview ? <Route path="/preview/presale-orders" element={<Suspense fallback={null}><PresaleOrdersPreview /></Suspense>} /> : null}
                {OtcPreview ? <Route path="/preview/otc" element={<Suspense fallback={null}><OtcPreview /></Suspense>} /> : null}
                {OtcOrdersPreview ? <Route path="/preview/otc-orders" element={<Suspense fallback={null}><OtcOrdersPreview /></Suspense>} /> : null}
                {OtcBuyOrderDetailPreview ? <Route path="/preview/otc-buy-order-detail" element={<Suspense fallback={null}><OtcBuyOrderDetailPreview /></Suspense>} /> : null}
                {OtcPostBuyPreview ? <Route path="/preview/otc-post-buy" element={<Suspense fallback={null}><OtcPostBuyPreview /></Suspense>} /> : null}
                {PointsConvertPreview ? <Route path="/preview/points-convert" element={<Suspense fallback={null}><PointsConvertPreview /></Suspense>} /> : null}
                {UserPreview ? <Route path="/preview/user" element={<Suspense fallback={null}><UserPreview /></Suspense>} /> : null}
                {UserPartnerPreview ? <Route path="/preview/user-partner" element={<Suspense fallback={null}><UserPartnerPreview /></Suspense>} /> : null}
                {UserTeamPreview ? <Route path="/preview/user-team" element={<Suspense fallback={null}><UserTeamPreview /></Suspense>} /> : null}
                {UserWithdrawPreview ? <Route path="/preview/user-withdraw" element={<Suspense fallback={null}><UserWithdrawPreview /></Suspense>} /> : null}
                {UserWithdrawRecordsPreview ? <Route path="/preview/user-withdraw-records" element={<Suspense fallback={null}><UserWithdrawRecordsPreview /></Suspense>} /> : null}
                {UserRechargePreview ? <Route path="/preview/user-recharge" element={<Suspense fallback={null}><UserRechargePreview /></Suspense>} /> : null}
                {SHOWCASE_ROUTE_ELEMENTS}

                <Route path="*" element={<Navigate to={ROUTE_PATH.root} replace />} />
            </Routes>
        </AppBrowserRouter>
    )
}
