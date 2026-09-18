import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './ActionButton.scss'

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'soft' | 'secondary'
    size?: 'regular' | 'small'
    icon?: ReactNode
    loading?: boolean
}

export function ActionButton({ variant = 'primary', size = 'regular', icon, loading = false, disabled, className = '', children, type = 'button', ...props }: ActionButtonProps) {
    return (
        <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
            className={`action-button action-button--${variant} action-button--${size} flex items-center justify-center ${className}`}>
            {icon ? <span className="action-button__icon">{icon}</span> : null}
            {children}
        </button>
    )
}
