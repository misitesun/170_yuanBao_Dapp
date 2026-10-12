import { connectDappWallet, getAuthorizedDappAddress, initializeDappWallet, signDappMessage, startDappWalletListeners, stopDappWalletListeners } from '../../services/dapp/wallet.ts'
import { detectDappProvider } from '../../services/dapp/provider.ts'
import { registerHttpUnauthorizedHandler, registerHttpWalletAddressProvider } from '../../services/http/index.ts'
import { getToken, removeToken, setToken } from '../../services/storage/token.ts'
import { getReferralCode, setReferralCode } from '../../services/storage/referral.ts'
import { useDappStore } from '../../stores/dapp/index.ts'
import { getCurrentUser, type CurrentUser } from '../user/api.ts'
import { requestWalletLogin } from './api.ts'
import { useSessionStore } from './state.ts'

let generation = 0
let verifiedAddress = ''
let currentWalletAddress: string | undefined
let authorizing: Promise<void> | undefined
const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function clearSession(error = ''): void {
    generation += 1
    verifiedAddress = ''
    removeToken()
    useSessionStore.setState({ status: 'signedOut', user: null, error })
}
function checkAttempt(attempt: number): void {
    if (attempt !== generation) throw new Error('钱包账号或登录状态已变化，请重新授权')
}
function watchWallet(): void {
    startDappWalletListeners({
        onAccountsChanged: (address) => {
            const previousAddress = currentWalletAddress
            currentWalletAddress = address
            // Mobile wallets can announce the initial/same account while connect or signing is pending.
            if (previousAddress === address || (previousAddress && address && sameAddress(previousAddress, address))) return
            if (!previousAddress && address && !verifiedAddress && !getToken()) return
            clearSession('钱包账号已变化，请重新授权')
        },
        onChainChanged: () => clearSession('钱包网络已变化，请重新授权'),
    })
}
async function prepareWallet(): Promise<void> {
    if (!await detectDappProvider({ waitForDelayedProvider: true }) || !await initializeDappWallet()) {
        throw new Error('请使用钱包浏览器打开，或启用浏览器钱包扩展')
    }
}
function completeSession(user: CurrentUser, address: string): void {
    if (!sameAddress(user.address, address)) {
        clearSession('登录账号与当前钱包不一致，请重新授权')
        throw new Error('登录账号与当前钱包不一致，请重新授权')
    }
    verifiedAddress = address
    useDappStore.getState().setWalletAddress(address)
    useSessionStore.setState({ status: 'authenticated', user, error: '' })
}
async function restoreSession(attempt: number): Promise<void> {
    const token = getToken()
    if (!token) return
    await prepareWallet()
    checkAttempt(attempt)
    const address = await getAuthorizedDappAddress()
    checkAttempt(attempt)
    if (!address) {
        currentWalletAddress = undefined
        clearSession('钱包尚未连接，请重新授权')
        throw new Error('钱包尚未连接，请重新授权')
    }
    currentWalletAddress = address
    useDappStore.getState().setWalletAddress(address)
    watchWallet()
    const user = await getCurrentUser('bearer')
    checkAttempt(attempt)
    if (token !== getToken()) throw new Error('登录状态已变化，请重新授权')
    completeSession(user, address)
}
export async function refreshCurrentUser(): Promise<CurrentUser> {
    const attempt = generation
    const address = verifiedAddress
    const user = await getCurrentUser()
    checkAttempt(attempt)
    completeSession(user, address)
    return user
}
export function mountAuthSession(): () => void {
    currentWalletAddress = undefined
    const unregisterAddress = registerHttpWalletAddressProvider(() => currentWalletAddress)
    const unregisterUnauthorized = registerHttpUnauthorizedHandler(() => clearSession('登录已失效，请重新授权'))
    const attempt = ++generation
    if (getToken()) {
        useSessionStore.setState({ status: 'checking', user: null, error: '' })
        void restoreSession(attempt).catch((error: unknown) => {
            if (attempt !== generation) return
            verifiedAddress = ''
            useSessionStore.setState({ status: 'signedOut', user: null,
                error: error instanceof Error ? error.message : '登录验证失败，请重试' })
        })
    } else {
        useSessionStore.setState({ status: 'signedOut', user: null, error: '' })
        // Public pages also receive the live account; never trust a cached wallet address.
        void (async () => {
            if (!await detectDappProvider({ waitForDelayedProvider: true })) return
            const address = await getAuthorizedDappAddress()
            if (attempt !== generation) return
            currentWalletAddress = address
            watchWallet()
        })().catch(() => undefined)
    }
    return () => {
        generation += 1
        verifiedAddress = ''
        currentWalletAddress = undefined
        stopDappWalletListeners()
        unregisterAddress()
        unregisterUnauthorized()
    }
}
async function performAuthorization(ref: string): Promise<void> {
    const attempt = ++generation
    useSessionStore.setState({ error: '' })
    setReferralCode(ref)
    // A completed login with a failed profile read is retried through GET, not another login POST.
    if (getToken()) {
        await restoreSession(attempt)
        return
    }
    await prepareWallet()
    checkAttempt(attempt)
    const { address } = await connectDappWallet()
    checkAttempt(attempt)
    currentWalletAddress = address
    watchWallet()
    const timestamp = Math.floor(Date.now() / 1000)
    const { signature } = await signDappMessage(`Login-${timestamp}`)
    checkAttempt(attempt)
    const currentAddress = await getAuthorizedDappAddress()
    checkAttempt(attempt)
    if (!currentAddress || !sameAddress(currentAddress, address)) throw new Error('签名钱包已变化，请重新授权')
    const token = await requestWalletLogin({ address, signature, timestamp, ...(ref.trim() ? { ref: ref.trim() } : {}) })
    checkAttempt(attempt)
    setToken(token)
    let user: CurrentUser
    try {
        user = await getCurrentUser('bearer')
    } catch (error) {
        checkAttempt(attempt)
        // The login POST already succeeded; retain its token for a read-only verification retry.
        throw new Error('登录已完成，用户资料验证失败，请重试验证', { cause: error })
    }
    checkAttempt(attempt)
    completeSession(user, address)
}
export function authorizeWallet(ref = getReferralCode()): Promise<void> {
    if (authorizing) return authorizing
    authorizing = performAuthorization(ref).finally(() => { authorizing = undefined })
    return authorizing
}
