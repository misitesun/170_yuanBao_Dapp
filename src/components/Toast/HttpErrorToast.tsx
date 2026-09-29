import {
    useEffect,
    useSyncExternalStore,
} from 'react'
import { useTranslation } from 'react-i18next'
import { HTTP_ERROR_MESSAGE } from '../../services/http/config.ts'

import {
    clearHttpErrorNotification,
    getHttpErrorNotification,
    subscribeHttpErrorNotifications,
} from '../../services/http/feedback.ts'
import { Toast } from './Toast.tsx'
import { TOAST_DURATION_MS } from './useToast.ts'

function getServerHttpErrorNotification(): null {
    return null
}

export function HttpErrorToast() {
    const { t } = useTranslation()
    const notification = useSyncExternalStore(
        subscribeHttpErrorNotifications,
        getHttpErrorNotification,
        getServerHttpErrorNotification,
    )

    useEffect(() => {
        if (!notification) return

        const timer = setTimeout(() => {
            clearHttpErrorNotification(notification.id)
        }, TOAST_DURATION_MS)

        return () => clearTimeout(timer)
    }, [notification])

    const message = notification?.message ?? null
    const displayMessage = message && Object.values(HTTP_ERROR_MESSAGE).some((value) => value === message)
        ? t(message) : message
    return <Toast message={displayMessage} variant="error" />
}
