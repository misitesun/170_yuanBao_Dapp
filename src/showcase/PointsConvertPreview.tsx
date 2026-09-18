import { useEffect } from 'react'

import { PointsConvertPage } from '@/pages/main/points-convert'

export function PointsConvertPreview() {
    useEffect(() => {
        const previousTitle = document.title
        document.title = 'HU-CHAIN · 积分兑换算力静态预览'
        return () => { document.title = previousTitle }
    }, [])

    return <PointsConvertPage />
}
