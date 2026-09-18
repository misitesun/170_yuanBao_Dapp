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

export const httpClient = axios.create({
    baseURL: import.meta.env?.VITE_BASE_URL,
    timeout: HTTP_CONFIG.timeout,
})

export type HttpUnauthorizedHandler = () => void

let unauthorizedHandler: HttpUnauthorizedHandler | undefined

/** Registers the project-owned reaction to a 401 response. */
export function registerHttpUnauthorizedHandler(
    handler: HttpUnauthorizedHandler,
): () => void {
    unauthorizedHandler = handler

    return () => {
        if (unauthorizedHandler === handler) unauthorizedHandler = undefined
    }
}

httpClient.interceptors.request.use((config) => {
    const token = getToken()

    if (token) {
        config.headers.set(
            HTTP_HEADER.authorization,
            `${HTTP_AUTH.scheme} ${token}`,
        )
    } else {
        config.headers.delete(HTTP_HEADER.authorization)
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

        if (httpError.status === HTTP_STATUS.unauthorized) {
            removeToken()
            unauthorizedHandler?.()
        }

        // TODO(http): Show request errors through the shared message module after it is ready.
        // TODO(http): 全局消息系统完成后，在统一错误策略中展示请求错误。
        return Promise.reject(httpError)
    },
)
