import { useTranslation } from 'react-i18next'
import yuanbaoLogo from '@/assets/common/yuanbao-logo.png'
import notificationIcon from '@/assets/common/header-notification.png'
import languageIcon from '@/assets/common/header-language.png'

import { LanguageSwitch } from '@/components/LanguageSwitch'
import { ROUTE_PATH, useAppNavigate } from '@/router'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { useDappStore } from '@/stores/dapp/index.ts'

import { AppBrand } from '../AppBrand/AppBrand.tsx'
import { MenuToggleIcon } from '../MenuToggleIcon.tsx'

import './HeaderBar.scss'

type HeaderBarProps = {
    staticPreview?: boolean
    showGap?: boolean
    showSidebarMenu?: boolean
    sidebarOpen?: boolean
    onSidebarMenuClick?: () => void
}

export function HeaderBar({
    staticPreview = false,
    showGap = true,
    showSidebarMenu = false,
    sidebarOpen = false,
    onSidebarMenuClick,
}: HeaderBarProps) {
    const { t } = useTranslation()
    const walletAddress = useDappStore((state) => state.walletAddress)
    const showWalletAddress = !staticPreview && walletAddress
    const { pushRoute } = useAppNavigate()

    return (
        <header>
            <div className={`app-header-bar${sidebarOpen ? ' app-header-bar--sidebar-open' : ''}`}>

                {/* 导航栏 */}
                <div className="flex justify-between items-center header">
                    {/* 左侧 */}
                    <AppBrand staticPreview={staticPreview} logoSrc={yuanbaoLogo} showName={false} onClick={sidebarOpen ? onSidebarMenuClick : undefined} />
                    {/* 右侧 */}
                    <div className="app-header-bar__actions flex items-center">
                        {showWalletAddress ? (
                            <div className="app-header-bar__wallet size-24">
                                {maskWalletAddress(walletAddress)}
                            </div>
                        ) : null}
                        <button type="button" className="app-header-bar__notification" aria-label={t('通知')} title={t('查看公告')} onClick={() => { if (!staticPreview) pushRoute(ROUTE_PATH.announcements) }}>
                            <img src={notificationIcon} alt="" width={52} height={52} />
                        </button>
                        {staticPreview ? (
                            <button type="button" className="app-header-bar__control flex items-center justify-center" aria-label={t('语言')} title={t('静态展示')}><img src={languageIcon} alt="" width={52} height={52} /></button>
                        ) : <LanguageSwitch className="app-header-bar__control flex items-center justify-center"><img src={languageIcon} alt="" width={52} height={52} /></LanguageSwitch>}
                        {showSidebarMenu ? (
                            <button
                                type="button"
                                className="app-header-bar__menu flex items-center justify-center"
                                aria-label={t(sidebarOpen ? '关闭侧边栏' : '打开侧边栏')}
                                aria-expanded={sidebarOpen}
                                aria-controls="app-sidebar-menu"
                                onClick={onSidebarMenuClick}
                            ><MenuToggleIcon open={sidebarOpen} /></button>
                        ) : null}
                    </div>
                </div>
                <div className="app-header-bar__divider" aria-hidden="true" />
            </div>
            {showGap ? <div className="gap-100" /> : null}
        </header>
    )
}
