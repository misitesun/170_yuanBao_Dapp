import { useEffect } from 'react'

import { PagePullRefresh } from '@/components/PagePullRefresh'
import { MainLayout } from '@/pages/main/layout/MainLayout'
import { UserPage } from '@/pages/main/user/UserPage'

export function UserPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 我的静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PagePullRefresh bottomInset="tabbar"><MainLayout menuType="tabbar" staticPreview><UserPage /></MainLayout></PagePullRefresh>
}
