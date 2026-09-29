import { create } from 'zustand'
import type { CurrentUser } from '../user/api.ts'

export interface SessionState {
    status: 'checking' | 'signedOut' | 'authenticated'
    user: CurrentUser | null
    error: string
}
export const useSessionStore = create<SessionState>(() => ({ status: 'checking', user: null, error: '' }))
