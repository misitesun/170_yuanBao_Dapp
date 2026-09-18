import { useEffect } from 'react'

import { PagePullRefresh } from '@/components/PagePullRefresh'
import { UserPartnerPage } from '@/pages/main/user-partner'

export function UserPartnerPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 成为合伙人静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PagePullRefresh><UserPartnerPage /></PagePullRefresh>
}
