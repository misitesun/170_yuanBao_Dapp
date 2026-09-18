import { useEffect } from 'react'

import { StakeOrdersPageWithRefresh } from '@/pages/main/stake-orders'

export function StakeOrdersPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 质押订单静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <StakeOrdersPageWithRefresh />
}
