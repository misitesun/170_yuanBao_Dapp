import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router'

import { Icon } from '@/components/Icon'
import {
    APP_CONFIG,
    APP_LOGIN_MODE,
} from '@/config/index.ts'
import {
    AUTH_STARTUP_RESULT,
    startAuthFlow,
} from '@/features/auth/startup.ts'
import { ROUTE_PATH } from '@/router/routes.ts'

import { waitForSplashAnimation } from './animation.ts'
import { saveSplashReferralCode } from './referral.ts'
import './SplashPage.scss'

type SplashRouteParams = {
    ref?: string
}

const appLogoUrl = `${APP_CONFIG.routeBase}brand/app-logo.png`

export function SplashPage() {
    const { ref } = useParams<SplashRouteParams>()
    const navigate = useNavigate()
    const hasStartedRef = useRef(false)
    const [walletRequired, setWalletRequired] = useState(false)
    const loading = APP_CONFIG.loginMode !== APP_LOGIN_MODE.account && !walletRequired

    useEffect(() => {
        if (saveSplashReferralCode(ref)) {
            void navigate(ROUTE_PATH.root, { replace: true })
            return
        }

    }, [navigate, ref])

    useEffect(() => {
        if (ref || hasStartedRef.current) return

        hasStartedRef.current = true

        async function startSplashAuthFlow(): Promise<void> {
            await waitForSplashAnimation()
            const result = await startAuthFlow()

            if (result === AUTH_STARTUP_RESULT.walletRequired) {
                setWalletRequired(true)
            }
        }

        void startSplashAuthFlow()
    }, [ref])

    return (
        <section className="splash-page" data-page="splash">
            <div className="splash-page__brand flex flex-column items-center justify-center animate__animated animate__zoomIn">
                <img
                    src={appLogoUrl}
                    className="splash-page__logo"
                    alt={APP_CONFIG.name}
                />

                <div className="mt-28 size-36 bold-6">
                    {APP_CONFIG.name}
                </div>
            </div>

            <div className="splash-page__tips vw-100 flex-center gap-10 size-20 tc animate__animated animate__slideInUp">
                <span>
                    {walletRequired
                        ? '请使用钱包环境打开！'
                        : `Welcome to ${APP_CONFIG.name}`}
                </span>

                {loading ? (
                    <Icon
                        name="loading"
                        size={15}
                        ariaLabel="Loading"
                    />
                ) : null}
            </div>
        </section>
    )
}
