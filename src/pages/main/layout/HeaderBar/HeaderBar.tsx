import notificationUrl from '@/assets/layout/headbar/notification.png'
import languageUrl from '@/assets/layout/headbar/language.png'

import headerMenuUrl from '@/assets/layout/headbar/menu.png'

import { LanguageSwitch } from '@/components/LanguageSwitch'
import { APP_CONFIG, APP_LOGIN_MODE } from '@/config/index.ts'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { useDappStore } from '@/stores/dapp/index.ts'
import { useUserStore } from '@/stores/user/index.ts'

import { AppBrand } from '../AppBrand/AppBrand.tsx'

import './HeaderBar.scss'

type HeaderBarProps = {
    staticPreview?: boolean
    showGap?: boolean
    showSidebarMenu?: boolean
    onSidebarMenuClick?: () => void
}

export function HeaderBar({
    staticPreview = false,
    showGap = true,
    showSidebarMenu = false,
    onSidebarMenuClick,
}: HeaderBarProps) {
    const walletAddress = useDappStore((state) => state.walletAddress)
    const isAuthenticated = useUserStore((state) => state.isAuthenticated)
    const showWalletAddress =
        !staticPreview && APP_CONFIG.loginMode !== APP_LOGIN_MODE.account &&
        isAuthenticated &&
        walletAddress

    return (
        <header>
            <div className="app-header-bar vw-100">

                {/* 导航栏 */}
                <div className="flex justify-between items-center header">
                    {/* 左侧 */}
                    <AppBrand appearance="hu-chain" staticPreview={staticPreview} />
                    {/* 右侧 */}
                    <div className="app-header-bar__actions flex items-center">
                        <button type="button" className="app-header-bar__control flex items-center justify-center" aria-label="通知" title="静态展示">
                            <img src={notificationUrl} alt="" /><span className="app-header-bar__unread" />
                        </button>
                        {staticPreview ? (
                            <button type="button" className="app-header-bar__control flex items-center justify-center" aria-label="语言" title="静态展示"><img src={languageUrl} alt="" /></button>
                        ) : <LanguageSwitch className="app-header-bar__control flex items-center justify-center"><img src={languageUrl} className="app-header-bar__language" alt="语言" /></LanguageSwitch>}
                        {showWalletAddress ? (
                            <div className="auto-btn size-24 bold-6 ml-20">
                                {maskWalletAddress(walletAddress)}
                            </div>
                        ) : null}
                        {showSidebarMenu ? (
                            <img
                                src={headerMenuUrl}
                                className="img-52 ml-20"
                                alt="Menu"
                                onClick={onSidebarMenuClick}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            {showGap ? <div className="gap-100" /> : null}
        </header>
    )
}
