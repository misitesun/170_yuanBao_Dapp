import { useEffect } from 'react'

import { PagePullRefresh } from '@/components/PagePullRefresh'
import { UserTeamPage } from '@/pages/main/user-team'

export function UserTeamPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 我的团队静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PagePullRefresh><UserTeamPage /></PagePullRefresh>
}
