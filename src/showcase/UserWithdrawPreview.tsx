import { useEffect } from 'react'

import { UserWithdrawPage } from '@/pages/main/user-withdraw'

export function UserWithdrawPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 提取静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <UserWithdrawPage />
}
