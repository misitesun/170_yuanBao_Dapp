import { ROUTE_PATH } from '../../router/routes.ts'

export function buildInvitationLink(code: string): string {
    if (!code || typeof window === 'undefined') return ''
    // Shared invitation URLs use the server's root /ref entry, independently of the app's /h5 base.
    return `${window.location.origin}${ROUTE_PATH.referral.replace(':ref', encodeURIComponent(code))}`
}
