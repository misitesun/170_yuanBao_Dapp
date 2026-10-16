import { request } from '../../services/http/index.ts'
import { object, string } from '../api-fields.ts'

export interface WalletLoginBody { address: string; signature: string; timestamp: number; ref?: string }
export async function requestWalletLogin(body: WalletLoginBody, signal?: AbortSignal): Promise<string> {
    const row = object(await request<unknown, WalletLoginBody>({
        url: '/api/auth/login', method: 'POST', data: body, authentication: 'none',
        walletAddress: body.address, walletAddressHeader: 'omit', signal,
    }))
    const token = string(row.token).trim()
    if (!token) throw new Error('登录令牌为空')
    return token
}
