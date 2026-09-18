import {
    useEffect,
    useRef,
} from 'react'

import { initializeAuthenticatedDappSession } from '../features/auth/startup.ts'
import {
    isSplashRoutePath,
    waitForSplashAnimation,
} from '../pages/splash/animation.ts'
import { AppRouter } from '../router/index.ts'

async function initializeAuthenticatedDappSessionAfterOpening(): Promise<void> {
    if (isSplashRoutePath()) {
        await waitForSplashAnimation()
    }

    await initializeAuthenticatedDappSession()
}

function AuthenticatedDappSessionBootstrap() {
    const hasStartedRef = useRef(false)

    useEffect(() => {
        if (hasStartedRef.current) return

        hasStartedRef.current = true
        void initializeAuthenticatedDappSessionAfterOpening()
    }, [])

    return null
}

function App() {
    return (
        <>
            {import.meta.env.DEV && /\/preview\/(home|stake|presale|otc|user)\/?$/.test(window.location.pathname) ? null : <AuthenticatedDappSessionBootstrap />}
            <AppRouter />
        </>
    )
}

export default App
