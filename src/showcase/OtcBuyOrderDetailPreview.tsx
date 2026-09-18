import { useEffect } from 'react'

import { OtcBuyOrderDetailPageWithRefresh } from '@/pages/main/otc-orders'

export function OtcBuyOrderDetailPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 挂买订单详情静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <OtcBuyOrderDetailPageWithRefresh />
}
