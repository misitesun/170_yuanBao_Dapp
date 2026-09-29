import { useEffect, useState, type MouseEvent } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'

import walletLinkIcon from '@/assets/common/wallet-link.png'
import walletCopyIcon from '@/assets/common/wallet-copy.png'
import yuanbaoLogo from '@/assets/common/yuanbao-logo.png'
import chevron from '@/assets/common/menu-chevron.svg'
import activeChevron from '@/assets/common/menu-chevron-active.svg'
import { Popup } from '@/components/Popup'
import { Toast, useToast } from '@/components/Toast'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { useDappStore } from '@/stores/dapp/index.ts'

import { SIDEBAR_ITEMS, type SidebarItem } from '../sidebar-config'
import { WalletOrbitBorder } from './WalletOrbitBorder.tsx'

type SidebarMenuProps = {
    show: boolean
    onClose: () => void
    staticPreview?: boolean
    previewWalletAddress?: string
    invitationLink?: string
}

export function SidebarMenu({ show, onClose, staticPreview = false, previewWalletAddress, invitationLink = '' }: SidebarMenuProps) {
    const { t } = useTranslation()
    const connectedWalletAddress = useDappStore((state) => state.walletAddress)
    const walletAddress = staticPreview ? previewWalletAddress : connectedWalletAddress
    const [selectedItem, setSelectedItem] = useState<string | null>(null)
    const { message, variant, showToast } = useToast()

    useEffect(() => {
        if (!show) return
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [show, onClose])

    function handleMenuLinkClick(event: MouseEvent<HTMLAnchorElement>, item: SidebarItem) {
        if (item.unavailable) {
            event.preventDefault()
            showToast(t('暂未开放'))
            return
        }
        setSelectedItem(null)
        onClose()
    }

    async function handleCopyInvitationLink() {
        if (!invitationLink) return
        const copied = await copyTextToClipboard(invitationLink)
        showToast(copied ? t('复制成功') : t('复制失败'), copied ? 'success' : 'error')
    }

    return (
        <Popup
            show={show}
            onClose={onClose}
            position="right"
            contentPreset={false}
            className="app-sidebar-popup"
        >
            <aside id="app-sidebar-menu" className="app-sidebar-menu" aria-label={t('导航菜单')}>
                <nav className="app-menu">
                    {SIDEBAR_ITEMS.map((item) => {
                        const content = (active: boolean) => <>
                            <img className="app-menu__icon-box" src={active ? item.activeImage : item.image} alt="" />
                            <span className="app-menu__label">{t(item.title)}</span>
                            <img src={active ? activeChevron : chevron} className="app-menu__chevron" alt="" />
                        </>
                        if (item.path && !staticPreview) return (
                            <NavLink key={item.id} to={item.path}
                                className={({ isActive }) => `app-menu__link${isActive && !selectedItem ? ' app-menu__link--active' : ''}`}
                                onClick={(event) => handleMenuLinkClick(event, item)}>
                                {({ isActive }) => content(isActive && !selectedItem)}
                            </NavLink>
                        )
                        const active = selectedItem ? selectedItem === item.id : item.id === SIDEBAR_ITEMS[0]?.id
                        return <button key={item.id} type="button" aria-pressed={active}
                            className={`app-menu__link${active ? ' app-menu__link--active' : ''}`}
                            onClick={() => {
                                if (item.unavailable) {
                                    showToast(t('暂未开放'))
                                    return
                                }
                                setSelectedItem(item.id)
                            }}>{content(active)}</button>
                    })}
                </nav>
                    <section className="app-sidebar-wallet" aria-label={t('钱包信息')}>
                        <div className="app-sidebar-wallet__badge flex-center">
                            <img src={yuanbaoLogo} alt="" />
                        </div>
                        <div className="app-sidebar-wallet__card">
                            <WalletOrbitBorder />
                            <div className="app-sidebar-wallet__identity">
                                <span className="app-sidebar-wallet__name">{maskWalletAddress(walletAddress)}</span>
                                <span className={`app-sidebar-wallet__status${walletAddress ? '' : ' app-sidebar-wallet__status--disconnected'}`}>
                                    <span className="app-sidebar-wallet__status-dot" aria-hidden="true" />
                                    {t(walletAddress ? '已连接钱包' : '未连接钱包')}
                                </span>
                            </div>
                            <div className="app-sidebar-wallet__address">
                                <img className="app-sidebar-wallet__link-icon" src={walletLinkIcon} alt="" />
                                <span className="app-sidebar-wallet__address-text" title={invitationLink}>{invitationLink}</span>
                                <span className="app-sidebar-wallet__address-divider" aria-hidden="true" />
                                <button
                                    type="button"
                                    className="app-sidebar-wallet__copy"
                                    aria-label={t('复制邀请链接')}
                                    disabled={!invitationLink}
                                    onClick={() => void handleCopyInvitationLink()}
                                >
                                    <img src={walletCopyIcon} alt="" />
                                </button>
                            </div>
                        </div>
                    </section>
            </aside>
            <Toast message={message} variant={variant} />
        </Popup>
    )
}
