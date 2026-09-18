import { useEffect } from 'react'

import { UserWithdrawRecordsPageWithRefresh } from '@/pages/main/user-withdraw-records'

export function UserWithdrawRecordsPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 提取记录静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <UserWithdrawRecordsPageWithRefresh />
}
