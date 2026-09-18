import { useEffect } from 'react'

import { PagePullRefresh } from '@/components/PagePullRefresh'
import { MainLayout } from '@/pages/main/layout/MainLayout'
import { OtcPage } from '@/pages/main/otc/OtcPage'

export function OtcPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · OTC静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PagePullRefresh bottomInset="tabbar"><MainLayout menuType="tabbar" staticPreview><OtcPage /></MainLayout></PagePullRefresh>
}
