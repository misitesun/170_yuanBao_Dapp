import { useState } from 'react'

import { HeaderBar } from '@/pages/main/layout/HeaderBar/HeaderBar'
import { SidebarMenu } from '@/pages/main/layout/SidebarMenu'
import '@/pages/main/layout/MainLayout.scss'

// Isolated presentation data; never writes a wallet or authentication store.
const PREVIEW_WALLET = '0xC1a12345678901234567890123456789012345839d'

export function SidebarShowcasePage() {
    const [open, setOpen] = useState(true)
    return <>
        <HeaderBar staticPreview showSidebarMenu sidebarOpen={open}
            onSidebarMenuClick={() => setOpen((value) => !value)} />
        <SidebarMenu show={open} onClose={() => setOpen(false)} staticPreview
            previewWalletAddress={PREVIEW_WALLET} />
    </>
}
