import { useLocation } from 'react-router'

import { APP_CONFIG } from '@/config'
import { ROUTE_PATH, useAppNavigate } from '@/router'

import huBrandUrl from '@/assets/layout/headbar/hu-chain-brand.png'
import './AppBrand.scss'

type AppBrandProps = {
    staticPreview?: boolean
    appearance?: 'default' | 'hu-chain'
    className?: string
    onClick?: () => void
}

export function AppBrand({
    staticPreview = false,
    appearance = 'default',
    className = '',
    onClick,
}: AppBrandProps) {
    const location = useLocation()
    const { pushRoute } = useAppNavigate()
    const brandClassName = [
        'app-brand',
        'flex',
        'items-center',
        className,
    ].filter(Boolean).join(' ')

    function handleBrandClick() {
        if (staticPreview) return
        if (location.pathname !== ROUTE_PATH.home) {
            pushRoute(ROUTE_PATH.home)
        }

        onClick?.()
    }

    if (appearance === 'hu-chain') {
        return <button type="button" className={brandClassName} onClick={handleBrandClick} aria-label="HU-CHAIN 首页"><img src={huBrandUrl} className="app-brand__wordmark" alt="HU-CHAIN" /></button>
    }

    return (
        <div className={brandClassName} onClick={handleBrandClick}>
            <img
                src={`${APP_CONFIG.routeBase}brand/app-logo.png`}
                className="app-brand__logo"
                alt={APP_CONFIG.name}
            />
            <div className="ml-10 size-24 bold-6">
                {APP_CONFIG.name}
            </div>
        </div>
    )
}
