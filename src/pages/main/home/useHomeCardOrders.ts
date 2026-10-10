import { useEffect, useState } from 'react'
import { getHomeCardOrders, type CardOrder } from '@/features/orders/api.ts'

export function useHomeCardOrders() {
    const [orders, setOrders] = useState<CardOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setOrders([])
        setLoading(true)
        setFailed(false)
        void getHomeCardOrders(1, controller.signal).then((items) => {
            if (!controller.signal.aborted) setOrders(items)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [version])
    return { orders, loading, failed, retry: () => setVersion(value => value + 1) }
}
