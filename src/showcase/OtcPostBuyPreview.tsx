import { useEffect } from 'react'

import { OtcPostBuyPage } from '@/pages/main/otc-post-buy'

export function OtcPostBuyPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 发布挂买静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <OtcPostBuyPage />
}
