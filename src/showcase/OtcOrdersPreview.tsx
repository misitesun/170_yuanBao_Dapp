import { useEffect } from 'react'

import { OtcOrdersPageWithRefresh } from '@/pages/main/otc-orders'

export function OtcOrdersPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · OTC订单静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <OtcOrdersPageWithRefresh />
}
