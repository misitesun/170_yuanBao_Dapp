import { useEffect, useState } from 'react'
import { getOrderConfig, type OrderConfig } from './api.ts'

export function useOrderConfig() {
    const [config, setConfig] = useState<OrderConfig | null>(null)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setConfig(null)
        setFailed(false)
        void getOrderConfig(controller.signal).then((value) => {
            if (!controller.signal.aborted) setConfig(value)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        })
        return () => controller.abort()
    }, [version])
    return { config, failed, retry: () => setVersion((value) => value + 1) }
}
