import { useEffect, useState } from 'react'
import { getRechargeAddress } from '@/features/user/api.ts'

export function useRechargeAddress() {
    const [address, setAddress] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setAddress(null)
        setLoading(true)
        setFailed(false)
        void getRechargeAddress(controller.signal).then((value) => {
            if (!controller.signal.aborted) setAddress(value)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [version])
    return { address, loading, failed, retry: () => setVersion((value) => value + 1) }
}
