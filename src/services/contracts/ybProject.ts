import { getDappChainId, readDappContract, writeDappContract } from '../dapp/index.ts'
import { getYbProjectConfig } from './config.ts'
import { YB_PROJECT_ABI } from './ybProjectAbi.ts'

export interface YbProjectWithdrawParams {
    id: bigint
    token: `0x${string}`
    amount: bigint
    deadline: bigint
    signature: `0x${string}`
}

export async function assertYbProjectNetwork() {
    const config = getYbProjectConfig()
    if (await getDappChainId() !== config.chainId) {
        throw new Error(`请将钱包切换到提现合约网络（链 ID：${config.chainId}）`)
    }
    return config
}

/** Global mapping indexed by withdrawal ID; no caller-context read. */
export async function isYbProjectWithdrawalUsed(id: bigint): Promise<boolean> {
    if (id < 0n || id >= 2n ** 256n) throw new Error('提现合约整数参数无效')
    const { address } = await assertYbProjectNetwork()
    const used = await readDappContract<unknown>({
        address, abi: YB_PROJECT_ABI, functionName: 'usedWithdrawIds', args: [id],
    })
    if (typeof used !== 'boolean') throw new Error('提现合约状态格式错误')
    return used
}

/** Amount is already in raw contract units. Never apply decimals to signed values. */
export async function withdrawYbProject(params: YbProjectWithdrawParams) {
    const { address } = await assertYbProjectNetwork()
    const { id, token, amount, deadline, signature } = params
    for (const value of [id, amount, deadline]) {
        if (typeof value !== 'bigint' || value < 0n || value >= 2n ** 256n) {
            throw new Error('提现合约整数参数无效')
        }
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(token) || !/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)) {
        throw new Error('提现合约地址或签名无效')
    }
    return writeDappContract({
        address, abi: YB_PROJECT_ABI, functionName: 'withdraw',
        args: [id, token, amount, deadline, signature],
    })
}
