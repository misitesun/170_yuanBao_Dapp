import { useEffect, useState } from 'react'
import { getTransferConfig, type TransferConfig } from '@/features/transfers/api.ts'

export function useTransferConfig(show: boolean) {
    const [config, setConfig] = useState<TransferConfig | null>(null)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)
    useEffect(() => {
        setConfig(null)
        setFailed(false)
        if (!show) return undefined
        const controller = new AbortController()
        void getTransferConfig(controller.signal).then(value => {
            if (!controller.signal.aborted) setConfig(value)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        })
        return () => controller.abort()
    }, [show, version])
    return { config, failed, retry: () => setVersion(value => value + 1) }
}
