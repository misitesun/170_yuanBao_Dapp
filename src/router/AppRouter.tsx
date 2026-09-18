import { useEffect } from 'react'
import {
    Navigate,
    Route,
    Routes,
    useNavigate,
} from 'react-router'

import { HomePage, MainLayout } from '@/pages/main'
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

export function AppRouter() {
    return (
        <AppBrowserRouter>
            <RouterNavigationBridge />
            <Routes>
                <Route path={ROUTE_PATH.root} element={<Navigate to={ROUTE_PATH.home} replace />} />
                <Route element={<MainLayout />}>
                    <Route path={ROUTE_PATH.home.slice(1)} element={<HomePage />} />
                </Route>

                {SHOWCASE_ROUTE_ELEMENTS}

                <Route path="*" element={<Navigate to={ROUTE_PATH.home} replace />} />
            </Routes>
        </AppBrowserRouter>
    )
}
