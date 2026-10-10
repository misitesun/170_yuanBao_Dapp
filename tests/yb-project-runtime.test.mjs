import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { runtime } from './helpers/yuanbao-runtime.mjs'

const address = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
const params = { id: 12n, token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    amount: 99000000000000000000n, deadline: 1710000300n, signature: '0xaabb' }
function setup(chainId = 31337, failure) {
    const calls = []
    const receipt = { status: 'success', transactionHash: '0x1234' }
    const load = runtime({
        './config.ts': { getYbProjectConfig: () => ({ address, chainId: 31337 }) },
        '../dapp/index.ts': { getDappChainId: async () => chainId,
            writeDappContract: async (call) => { calls.push(call); if (failure) throw failure; return receipt } },
    })
    return { calls, receipt, ...load('src/services/contracts/ybProject.ts') }
}
test('YBProject passes raw signed values in ABI order and awaits shared receipt', async () => {
    const api = setup()
    assert.equal(await api.withdrawYbProject(params), api.receipt)
    const call = api.calls[0]
    assert.equal(call.address, address)
    assert.equal(call.functionName, 'withdraw')
    assert.deepEqual(Array.from(call.args), [params.id, params.token, params.amount, params.deadline, params.signature])
    assert.equal(call.value, undefined)
    const method = call.abi.find((entry) => entry.type === 'function' && entry.name === 'withdraw')
    assert.deepEqual(Array.from(method.inputs, (input) => input.type), ['uint256', 'address', 'uint256', 'uint256', 'bytes'])
    assert.equal(method.stateMutability, 'nonpayable')
})
test('wrong or unknown wallet chain blocks transaction', async () => {
    for (const chain of [56, null]) {
        const api = setup(chain)
        await assert.rejects(api.withdrawYbProject(params), /31337/)
        assert.equal(api.calls.length, 0)
    }
})
test('malformed contract parameters never reach wallet write', async () => {
    for (const change of [{ amount: -1n }, { id: 2n ** 256n }, { deadline: 1 }, { token: 'bad' }, { signature: '0x' }, { signature: '0xabc' }]) {
        const api = setup()
        await assert.rejects(api.withdrawYbProject({ ...params, ...change }))
        assert.equal(api.calls.length, 0)
    }
})
test('wallet rejection and contract errors retain their original error', async () => {
    for (const error of [Object.assign(new Error('rejected'), { code: 4001 }), new Error('reverted')]) {
        const api = setup(31337, error)
        await assert.rejects(api.withdrawYbProject(params), (caught) => caught === error)
    }
})
test('env config validates addresses and chain IDs without deployment fallback', () => {
    const source = readFileSync('src/services/contracts/config.ts', 'utf8').replaceAll('import.meta.env', 'testEnv')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
    const exports = {}
    runInNewContext(outputText, { exports, testEnv: { VITE_YB_PROJECT_ADDRESS: address, VITE_YB_PROJECT_CHAIN_ID: '31337' } })
    assert.equal(exports.getYbProjectConfig().address, address)
    assert.equal(exports.getYbProjectConfig().chainId, 31337)
    for (const [contractAddress, chainId] of [['', '31337'], ['0x' + '0'.repeat(40), '31337'], [address, ''], [address, '0'], [address, '1.2'], [address, '9007199254740993']]) {
        assert.throws(() => exports.parseYbProjectConfig(contractAddress, chainId))
    }
})
test('withdrawal used-ID read is public, verifies network and validates the returned boolean', async () => {
    const reads = []
    let result = false
    let chainId = 31337
    const api = runtime({
        './config.ts': { getYbProjectConfig: () => ({ address, chainId: 31337 }) },
        '../dapp/index.ts': { getDappChainId: async () => chainId,
            readDappContract: async call => { reads.push(call); return result } },
    })('src/services/contracts/ybProject.ts')
    assert.equal(await api.isYbProjectWithdrawalUsed(12n), false)
    assert.equal(reads[0].functionName, 'usedWithdrawIds')
    assert.equal(reads[0].args[0], 12n)
    assert.equal(reads[0].account, undefined)
    result = true
    assert.equal(await api.isYbProjectWithdrawalUsed(12n), true)
    result = 'true'
    await assert.rejects(api.isYbProjectWithdrawalUsed(12n), /状态格式错误/)
    chainId = 56
    const count = reads.length
    await assert.rejects(api.isYbProjectWithdrawalUsed(12n), /31337/)
    assert.equal(reads.length, count)
})

test('BSC deployment ABI supports withdrawal with signed values and blocks the local chain', async () => {
    const deployment = JSON.parse(readFileSync('docs/bsc.json', 'utf8'))
    const project = deployment.contracts.find(contract => contract.name === 'YBProject')
    const token = deployment.contracts.find(contract => contract.name === 'USDT')
    const { YB_PROJECT_ABI } = runtime()('src/services/contracts/ybProjectAbi.ts')
    assert.deepEqual(JSON.parse(JSON.stringify(YB_PROJECT_ABI)), project.abi)
    const { ERC20_ABI } = runtime({
        '../storage/common.ts': {}, './config.ts': {}, './contract.ts': {}, './wallet.ts': {},
    })('src/services/dapp/erc20.ts')
    for (const method of token.abi.filter(entry => entry.type === 'function')) {
        const standard = ERC20_ABI.find(entry => entry.name === method.name)
        assert.equal(standard.stateMutability, method.stateMutability)
        assert.deepEqual(Array.from(standard.inputs, input => input.type), method.inputs.map(input => input.type))
        assert.deepEqual(Array.from(standard.outputs, output => output.type), method.outputs.map(output => output.type))
    }
    let walletChain = 56
    const calls = []
    const api = runtime({
        './config.ts': { getYbProjectConfig: () => ({ address: project.address, chainId: Number(deployment.chainId) }) },
        '../dapp/index.ts': {
            getDappChainId: async () => walletChain,
            writeDappContract: async call => { calls.push(call); return { status: 'success' } },
        },
    })('src/services/contracts/ybProject.ts')
    const signed = { ...params, token: token.address }
    await api.withdrawYbProject(signed)
    assert.equal(calls[0].address, project.address)
    assert.deepEqual(Array.from(calls[0].args), [signed.id, signed.token, signed.amount, signed.deadline, signed.signature])
    walletChain = 31337
    await assert.rejects(api.withdrawYbProject(signed), /56/)
    assert.equal(calls.length, 1)
})
