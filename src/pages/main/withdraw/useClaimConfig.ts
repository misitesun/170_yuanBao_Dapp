import { useEffect, useState } from 'react'
import { getClaimConfig, type ClaimConfig } from '@/features/claims/api.ts'

export function useClaimConfig() {
    const [config, setConfig] = useState<ClaimConfig | null>(null)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setConfig(null)
        setFailed(false)
        void getClaimConfig(controller.signal).then(value => {
            if (!controller.signal.aborted) setConfig(value)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        })
        return () => controller.abort()
    }, [version])
    return { config, failed, retry: () => setVersion(value => value + 1) }
}
