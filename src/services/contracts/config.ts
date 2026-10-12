function isContractAddress(value: string): value is `0x${string}` {
    return /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/.test(value)
}

export function parseUsdtAddress(value: string): `0x${string}` {
    if (!isContractAddress(value)) throw new Error('充值合约未配置')
    return value
}

export function getUsdtAddress(): `0x${string}` {
    return parseUsdtAddress(import.meta.env.VITE_USDT)
}

export function parseYbProjectConfig(address: string, chainId: string) {
    if (!isContractAddress(address)) throw new Error('请配置有效的 YBProject 合约地址')
    const parsedChainId = Number(chainId)
    if (!/^[1-9]\d*$/.test(chainId) || !Number.isSafeInteger(parsedChainId)) {
        throw new Error('请配置有效的 YBProject 链 ID')
    }
    return { address, chainId: parsedChainId }
}

export function getYbProjectConfig() {
    return parseYbProjectConfig(
        import.meta.env.VITE_YB_PROJECT_ADDRESS,
        import.meta.env.VITE_YB_PROJECT_CHAIN_ID,
    )
}
