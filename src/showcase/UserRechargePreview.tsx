import { useEffect } from 'react'

import { UserRechargePage } from '@/pages/main/user-recharge'

export function UserRechargePreview() {
    useEffect(() => {
        document.title = 'HU-CHAIN · 充值静态预览'
    }, [])

    return <UserRechargePage />
}
