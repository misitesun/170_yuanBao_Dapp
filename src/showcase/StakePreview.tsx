import { useEffect } from 'react'
import { StakePage } from '@/pages/main/stake/StakePage'
import { MainLayout } from '@/pages/main/layout/MainLayout'

export function StakePreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 质押静态预览'
        return () => { document.title = previousTitle }
    }, [])
    return <MainLayout menuType="tabbar" staticPreview><StakePage /></MainLayout>
}
