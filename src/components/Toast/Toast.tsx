import { createPortal } from 'react-dom'
import './Toast.scss'

export function Toast({ message }: { message: string | null }) {
    if (!message || typeof document === 'undefined') return null
    return createPortal(<div className="app-toast flex items-center justify-center">
        <div className="app-toast__message size-26 tc" role="status" aria-live="polite">{message}</div>
    </div>, document.body)
}
