import test from 'node:test'
import assert from 'node:assert/strict'
import { parseUnits } from 'viem'
import { runtime, deferred, ADDRESS } from './helpers/yuanbao-runtime.mjs'
import { parseUsdtAddress } from '../src/services/contracts/config.ts'

const TOKEN = '0x55d398326f99059fF775485246999027B3197955'
const RECIPIENT = '0xfe2E1731CB06583E143bb64eA3636Ea8D64b748f'
const messages = { contractReverted: '交易执行失败', erc20BalanceInsufficient: '余额不足', gasBalanceInsufficient: 'Gas费用不足' }

function setup() {
    let chain = 56, account = ADDRESS, decimals = 18, metadata
    const writes = [], reads = []
    const dapp = {
        DAPP_CURRENT_CHAIN: { id: 56 }, DAPP_MAX_AMOUNT_DECIMALS: 36,
        DAPP_ERROR_MESSAGE: messages,
        getAuthorizedDappAddress: async () => account,
        getDappChainId: async () => chain,
        readErc20Decimals: async token => { reads.push(token); return metadata ? metadata.promise : decimals },
        parseDappAmountUnits: (value, options) => parseUnits(value, options.decimals),
        getDappUserRejectionMessage: error => error.code === 4001 ? 'rejected' : undefined,
        writeErc20Transfer: (recipient, amount, token) => {
            const wait = deferred(); writes.push({ recipient, amount, token, ...wait }); return wait.promise
        },
    }
    const load = runtime({ '@/services/dapp/index.ts': dapp, '../dapp/index.ts': dapp,
        './config.ts': { getUsdtAddress: () => TOKEN } }, { Error })
    return { api: load('src/services/contracts/usdt.ts'), flow: load('src/features/deposits/flow.ts'), reads, writes,
        setAccount: value => { account = value }, setChain: value => { chain = value },
        setDecimals: value => { decimals = value }, setMetadata: value => { metadata = value } }
}
const flush = () => new Promise(setImmediate)

test('USDT token configuration rejects missing and zero addresses without fallback', () => {
    assert.equal(parseUsdtAddress(TOKEN), TOKEN)
    for (const value of ['', 'USDT', `0x${'0'.repeat(40)}`]) assert.throws(() => parseUsdtAddress(value))
})

test('existing ERC20 transfer calls transfer only, forwards bigint and waits for the receipt; decimals stays public', async () => {
    const reads = [], writes = [], receipt = deferred()
    const api = runtime({ '../storage/common.ts': { getWalletAddress: () => ADDRESS },
        './config.ts': { DAPP_ERROR_MESSAGE: messages }, './wallet.ts': {},
        './contract.ts': {
            readDappContract: async params => { reads.push(params); return params.functionName === 'decimals' ? 18 : 10n },
            createDappContractActions: (token, abi) => ({ writeWithGas: (method, args) => {
                writes.push({ token, abi, method, args }); return receipt.promise
            } }),
        },
    })('src/services/dapp/erc20.ts')
    assert.equal(await api.readErc20Decimals(TOKEN), 18)
    assert.ok(!Object.hasOwn(reads[0], 'account'))
    const request = api.writeErc20Transfer(RECIPIENT, 2n, TOKEN)
    await flush()
    assert.equal(writes.length, 1)
    assert.equal(writes[0].token, TOKEN)
    assert.equal(writes[0].method, 'transfer')
    assert.deepEqual(Array.from(writes[0].args), [RECIPIENT, 2n])
    assert.equal(reads[1].functionName, 'balanceOf')
    assert.deepEqual(Array.from(reads[1].args), [ADDRESS])
    const result = { status: 'success' }
    receipt.resolve(result)
    assert.equal(await request, result)
})

test('USDT recharge preserves recipient and large amounts, reads actual decimals and rejects precision overflow', async () => {
    const { api, setDecimals, reads } = setup()
    const result = await api.prepareUsdtRecharge(ADDRESS, RECIPIENT, '9007199254740993.123456')
    assert.equal(result.recipient, RECIPIENT)
    assert.equal(result.token, TOKEN)
    assert.equal(result.amount, 9007199254740993123456000000000000n)
    assert.deepEqual(reads, [TOKEN])
    setDecimals(6)
    assert.equal((await api.prepareUsdtRecharge(ADDRESS, RECIPIENT, '0.000001')).amount, 1n)
    await assert.rejects(api.prepareUsdtRecharge(ADDRESS, RECIPIENT, '0.0000001'), /超出币种精度/)
    for (const value of ['', '0', '0.000', '-1', '1e3', '1.', '.1', 'abc']) assert.equal(api.normalizeRechargeAmount(value), null)
    await assert.rejects(api.prepareUsdtRecharge(ADDRESS, `0x${'0'.repeat(40)}`, '1'), /充值地址无效/)
    await assert.rejects(api.prepareUsdtRecharge(ADDRESS, RECIPIENT, (2n ** 256n).toString()), /有效充值数量/)
    setDecimals(255)
    await assert.rejects(api.prepareUsdtRecharge(ADDRESS, RECIPIENT, '1'), /精度无效/)
})

test('wrong network and account changes during token metadata loading block transfer', async () => {
    const page = setup()
    page.setChain(1)
    await assert.rejects(page.flow.depositUsdt(ADDRESS, RECIPIENT, '1'), /切换到充值网络/)
    assert.equal(page.writes.length, 0)
    assert.equal(page.flow.getDepositPhase(ADDRESS), 'idle')
    page.setChain(56)
    const metadata = deferred()
    page.setMetadata(metadata)
    const request = page.flow.depositUsdt(ADDRESS, RECIPIENT, '1')
    await flush()
    page.setAccount(RECIPIENT)
    metadata.resolve(18)
    await assert.rejects(request, /账户已变化/)
    assert.equal(page.writes.length, 0)
})

test('USDT recharge waits for the ERC20 receipt and prevents concurrent writes across callers', async () => {
    const page = setup()
    const first = page.flow.depositUsdt(ADDRESS, RECIPIENT, '2.5')
    await assert.rejects(page.flow.depositUsdt(ADDRESS, RECIPIENT, '3'), /勿重复转账/)
    await flush()
    assert.equal(page.writes.length, 1)
    assert.equal(page.writes[0].amount, 2500000000000000000n)
    assert.equal(page.flow.getDepositPhase(ADDRESS), 'sending')
    page.writes[0].resolve({ status: 'success' })
    await first
    assert.equal(page.flow.getDepositPhase(ADDRESS), 'idle')
})

test('rejection and reverted receipts permit manual retry; unknown receipt errors never resend', async () => {
    const page = setup()
    for (const error of [Object.assign(new Error('denied'), { code: 4001 }), new Error('交易执行失败'), new Error('余额不足')]) {
        const next = page.flow.depositUsdt(ADDRESS, RECIPIENT, '1')
        await flush()
        page.writes.at(-1).reject(error)
        await assert.rejects(next)
        assert.equal(page.flow.getDepositPhase(ADDRESS), 'idle')
    }
    const uncertain = page.flow.depositUsdt(ADDRESS, RECIPIENT, '1')
    await flush()
    page.writes.at(-1).reject(new Error('receipt timeout'))
    await assert.rejects(uncertain, /勿重复转账/)
    assert.equal(page.flow.getDepositPhase(ADDRESS), 'uncertain')
    const count = page.writes.length
    await assert.rejects(page.flow.depositUsdt(ADDRESS, RECIPIENT, '2'), /勿重复转账/)
    assert.equal(page.writes.length, count)
    assert.equal(page.flow.getDepositPhase(RECIPIENT), 'idle')
})
