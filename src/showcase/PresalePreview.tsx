import { useEffect } from 'react'
import { PresalePage } from '@/pages/main/presale/PresalePage'
import { MainLayout } from '@/pages/main/layout/MainLayout'

export function PresalePreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 预售静态预览'
        return () => { document.title = previousTitle }
    }, [])
    return <MainLayout menuType="tabbar" staticPreview><PresalePage /></MainLayout>
}
