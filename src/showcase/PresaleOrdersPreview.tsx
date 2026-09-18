import { useEffect } from 'react'

import { PresaleOrdersPageWithRefresh } from '@/pages/main/presale-orders'

export function PresaleOrdersPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 预售订单静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PresaleOrdersPageWithRefresh />
}
