import { DAPP_CURRENT_CHAIN, DAPP_MAX_AMOUNT_DECIMALS, getAuthorizedDappAddress, getDappChainId,
    parseDappAmountUnits, readErc20Decimals } from '../dapp/index.ts'
import { getUsdtAddress } from './config.ts'

export function normalizeRechargeAmount(value: string): string | null {
    const text = value.trim()
    return text.length <= 100 && /^\d+(?:\.\d+)?$/.test(text) && /[1-9]/.test(text) ? text : null
}

export async function assertUsdtRechargeContext(account: string): Promise<void> {
    if (!account || (await getAuthorizedDappAddress())?.toLowerCase() !== account.toLowerCase()) {
        throw new Error('钱包账户已变化，请重新登录')
    }
    if (await getDappChainId() !== DAPP_CURRENT_CHAIN.id) throw new Error('请切换到充值网络')
}

/** Public token metadata is account-free; display amounts are converted exactly once. */
export async function prepareUsdtRecharge(account: string, recipient: string, input: string) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient) || /^0x0{40}$/.test(recipient)) throw new Error('充值地址无效')
    const normalized = normalizeRechargeAmount(input)
    if (!normalized) throw new Error('请输入有效充值数量')
    const token = getUsdtAddress()
    await assertUsdtRechargeContext(account)
    const decimals = await readErc20Decimals(token)
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > DAPP_MAX_AMOUNT_DECIMALS) throw new Error('充值合约精度无效')
    if ((normalized.split('.')[1]?.length ?? 0) > decimals) throw new Error('充值数量超出币种精度')
    const amount = parseDappAmountUnits(normalized, { decimals })
    if (amount <= 0n || amount >= 2n ** 256n) throw new Error('请输入有效充值数量')
    await assertUsdtRechargeContext(account)
    return { token, recipient: recipient as `0x${string}`, amount }
}
