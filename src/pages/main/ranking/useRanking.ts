import { useCallback, useEffect, useRef, useState } from 'react'
import { getTeamRanking, type TeamRanking } from '@/features/rankings/api.ts'

export function useRanking(onError: (error?: unknown) => void) {
    const [data, setData] = useState<TeamRanking | null>(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const active = useRef<AbortController | null>(null)

    const reload = useCallback(async () => {
        active.current?.abort()
        const controller = new AbortController()
        active.current = controller
        setLoading(true)
        setFailed(false)
        setData(null)
        try {
            const result = await getTeamRanking(controller.signal)
            if (!controller.signal.aborted) setData(result)
        } catch (error) {
            if (!controller.signal.aborted) {
                setFailed(true)
                onError(error)
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false)
        }
    }, [onError])

    useEffect(() => {
        void reload()
        return () => active.current?.abort()
    }, [reload])
    return { data, loading, failed, reload }
}
