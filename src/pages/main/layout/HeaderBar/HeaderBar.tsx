import { Icon } from '@/components/Icon'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { useDappStore } from '@/stores/dapp/index.ts'

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
    const showWalletAddress = !staticPreview && walletAddress

    return (
        <header>
            <div className="app-header-bar vw-100">

                {/* 导航栏 */}
                <div className="flex justify-between items-center header">
                    {/* 左侧 */}
                    <AppBrand staticPreview={staticPreview} />
                    {/* 右侧 */}
                    <div className="app-header-bar__actions flex items-center">
                        {staticPreview ? (
                            <button type="button" className="app-header-bar__control flex items-center justify-center" aria-label="语言" title="静态展示"><Icon name="language" className="size-38" /></button>
                        ) : <LanguageSwitch className="app-header-bar__control flex items-center justify-center"><Icon name="language" className="size-38" /></LanguageSwitch>}
                        {showWalletAddress ? (
                            <div className="auto-btn size-24 bold-6 ml-20">
                                {maskWalletAddress(walletAddress)}
                            </div>
                        ) : null}
                        {showSidebarMenu ? (
                            <button
                                type="button"
                                className="app-header-bar__menu flex items-center justify-center ml-20"
                                aria-label="Menu"
                                onClick={onSidebarMenuClick}
                            ><Icon name="menu" className="size-42" /></button>
                        ) : null}
                    </div>
                </div>
            </div>
            {showGap ? <div className="gap-100" /> : null}
        </header>
    )
}
