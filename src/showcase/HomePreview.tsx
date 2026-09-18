import { useEffect } from 'react'

import { HomePage } from '@/pages/main/home/HomePage'
import { MainLayout } from '@/pages/main/layout/MainLayout'

export function HomePreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 首页静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <MainLayout menuType="tabbar" staticPreview><HomePage /></MainLayout>
}
