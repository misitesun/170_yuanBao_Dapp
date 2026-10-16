import axios from 'axios'

import { APP_CONFIG } from '../../config/index.ts'
import { getRequestLanguage } from '../../i18n/getRequestLanguage.ts'
import { getToken, removeToken } from '../storage/token.ts'
import { isFormDataBody } from './body.ts'
import {
    HTTP_AUTH,
    HTTP_CONFIG,
    HTTP_CONTENT_TYPE,
    HTTP_HEADER,
    HTTP_STATUS,
} from './config.ts'
import { toHttpError } from './error.ts'
import { reportHttpError } from './feedback.ts'

declare module 'axios' {
    interface AxiosRequestConfig {
        /** Controls Bearer credentials independently of the current wallet address header. */
        authentication?: 'none' | 'bearer'
        /** Pins an account-bound request to the wallet used by its operation. */
        walletAddress?: string
        /** Explicitly removes the address header for endpoints that must not receive it. */
        walletAddressHeader?: 'omit'
    }
}

export const httpClient = axios.create({
    baseURL: import.meta.env?.VITE_BASE_URL,
    timeout: HTTP_CONFIG.timeout,
})

export type HttpUnauthorizedHandler = () => void
export type HttpWalletAddressProvider = () => string | undefined

let unauthorizedHandler: HttpUnauthorizedHandler | undefined
let walletAddressProvider: HttpWalletAddressProvider | undefined

/** Registers the project-owned reaction to a 401 response. */
export function registerHttpUnauthorizedHandler(
    handler: HttpUnauthorizedHandler,
): () => void {
    unauthorizedHandler = handler

    return () => {
        if (unauthorizedHandler === handler) unauthorizedHandler = undefined
    }
}

/** Registers the live wallet address, independently of login status. */
export function registerHttpWalletAddressProvider(
    provider: HttpWalletAddressProvider,
): () => void {
    walletAddressProvider = provider

    return () => {
        if (walletAddressProvider === provider) walletAddressProvider = undefined
    }
}

httpClient.interceptors.request.use((config) => {
    const token = getToken()
    const liveWalletAddress = walletAddressProvider?.()?.trim()
    const walletAddress = config.walletAddress?.trim() ?? liveWalletAddress

    if (config.walletAddress !== undefined && (!walletAddress || (walletAddressProvider
        && liveWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()))) {
        throw new axios.CanceledError('钱包账号已变化，已取消旧请求', config)
    }

    if (config.authentication !== 'none' && token && (config.authentication === 'bearer' || !walletAddressProvider || walletAddress)) {
        config.headers.set(
            HTTP_HEADER.authorization,
            `${HTTP_AUTH.scheme} ${token}`,
        )
    } else {
        config.headers.delete(HTTP_HEADER.authorization)
    }

    if (walletAddress && config.walletAddressHeader !== 'omit') {
        config.headers.set(HTTP_HEADER.walletAddress, walletAddress)
    } else {
        config.headers.delete(HTTP_HEADER.walletAddress)
    }

    if (APP_CONFIG.enableI18n) {
        config.headers.set(HTTP_HEADER.language, getRequestLanguage())
    } else {
        config.headers.delete(HTTP_HEADER.language)
    }

    if (isFormDataBody(config.data)) {
        config.headers.delete(HTTP_HEADER.contentType)
    } else if (config.data !== undefined) {
        config.headers.setContentType(HTTP_CONTENT_TYPE.json)
    }

    return config
})

httpClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const httpError = toHttpError(error)

        reportHttpError(httpError)

        const sentAuthorization = axios.isAxiosError(error) ? error.config?.headers?.get(HTTP_HEADER.authorization) : undefined
        const currentToken = getToken()
        if (httpError.status === HTTP_STATUS.unauthorized && currentToken
            && sentAuthorization === `${HTTP_AUTH.scheme} ${currentToken}`) {
            removeToken()
            unauthorizedHandler?.()
        }

        return Promise.reject(httpError)
    },
)
