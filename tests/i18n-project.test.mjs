import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import i18next from 'i18next'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, useTranslation, Trans } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import ts from 'typescript'
import { runtime } from './helpers/yuanbao-runtime.mjs'

const codes = ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ko']
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const project = Object.fromEntries(codes.map(code => [code, json(`src/i18n/locales/project/${code}.json`)]))
const messages = Object.fromEntries(codes.map(code => [code, {
    ...json(`src/i18n/locales/common/${code}.json`),
    ...json(`src/i18n/locales/common/dappH5/${code}.json`),
    ...project[code],
}]))
const parameters = value => Array.from(value.matchAll(/{{(\w+)}}/g), match => match[1]).sort()
const tags = value => Array.from(value.matchAll(/<\/?\d+>/g), match => match[0]).sort()

test('all five project locales have complete keys, interpolation parameters and rich-title tags', () => {
    const keys = Object.keys(project['zh-Hans']).sort()
    for (const code of codes) {
        assert.deepEqual(Object.keys(project[code]).sort(), keys, code)
        for (const key of keys) {
            assert.ok(project[code][key].trim(), `${code}: ${key}`)
            assert.ok(!project[code][key].includes('USDT'), `${code}: fixed copy follows the balance glossary`)
            assert.deepEqual(parameters(project[code][key]), parameters(key), `${code}: ${key}`)
            assert.deepEqual(tags(project[code][key]), tags(key), `${code}: ${key}`)
            if (code === 'en' || code === 'ko') assert.ok(!/\p{Script=Han}/u.test(project[code][key]), `${code}: untranslated Chinese in ${key}`)
        }
        assert.ok(project[code]['将扣除 {{amount}} 元气'].includes(project[code]['元气']), `${code}: purchase uses the Yuanqi asset name`)
        for (const key of ['{{amount}} 宝气', '手续费：{{amount}} 宝气', '将扣除 {{usdt}} 余额 + {{bao}} 宝气']) {
            assert.ok(project[code][key].includes(project[code]['宝气']), `${code}: ${key} uses the Baoqi asset name`)
        }
    }
})

function files(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
        ? files(join(dir, entry.name)) : [join(dir, entry.name)])
}

function literalTranslationKeys(node) {
    if (!node) return []
    if (ts.isStringLiteralLike(node)) return [node.text]
    if (ts.isParenthesizedExpression(node)) return literalTranslationKeys(node.expression)
    if (ts.isConditionalExpression(node)) return [...literalTranslationKeys(node.whenTrue), ...literalTranslationKeys(node.whenFalse)]
    return []
}

test('production pages have no untranslated JSX copy and all fixed translation keys resolve', () => {
    const paths = [...files('src/pages/main'), ...files('src/pages/auth'), ...files('src/features')]
        .filter(path => /\.tsx?$/.test(path))
    for (const path of paths) {
        const ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
        function visit(node) {
            if (ts.isJsxText(node)) {
                assert.ok(!/\p{Script=Han}/u.test(node.text), `${path}: ${node.text}`)
                assert.ok(!node.text.includes('USDT'), `${path}: fixed copy follows the balance glossary`)
            }
            if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
                const value = node.initializer.text
                if (node.name.getText(ast) !== 'i18nKey') assert.ok(!/\p{Script=Han}/u.test(value), `${path}: ${value}`)
                else for (const code of codes) assert.ok(Object.hasOwn(messages[code], value), `${code}: ${value}`)
            }
            if (ts.isCallExpression(node) && ['t', 'translate'].includes(node.expression.getText(ast))) {
                for (const key of literalTranslationKeys(node.arguments[0])) {
                    if (/\p{Script=Han}/u.test(key)) for (const code of codes) assert.ok(Object.hasOwn(messages[code], key), `${path} ${code}: ${key}`)
                }
            }
            ts.forEachChild(node, visit)
        }
        visit(ast)
    }
})

test('real React pages switch locale, preserve card names and amounts, and do not translate remote records', async () => {
    const i18n = i18next.createInstance()
    await i18n.init({ lng: 'en', fallbackLng: 'en', keySeparator: false, interpolation: { escapeValue: false },
        resources: Object.fromEntries(codes.map(code => [code, { translation: messages[code] }])) })
    const Empty = () => React.createElement('p', null, i18n.t('暂无数据'))
    let showTransfers = false
    const rechargeAddress = '0xfe2E1731CB06583E143bb64eA3636Ea8D64b748f'
    const mocks = {
        '@/features/auth/state.ts': { useSessionStore: selector => selector({ user: { address: rechargeAddress } }) },
        '@/features/deposits/flow.ts': { depositUsdt: async () => {}, getDepositPhase: () => 'idle', subscribeDeposit: () => () => {} },
        '@/services/contracts/usdt.ts': { normalizeRechargeAmount: value => value || null },
        '@/services/dapp/index.ts': { waitForDappContractDataSync: async () => {} },
        '@/features/auth/session.ts': { refreshCurrentUser: async () => {} },
        '@/components/ContractLoading': { ContractLoading: () => null },
        '@/components/Popup': { Popup: () => null },
        '@/components/Input': { Input: () => null },
        '@/components/ActionButton': { ActionButton: () => null },
        'qrcode.react': { QRCodeSVG },
        './useRechargeAddress.ts': { useRechargeAddress: () => ({ address: rechargeAddress, loading: false, failed: false }) },
        '@/components/SecondaryHeader': { SecondaryHeader: ({ title }) => React.createElement('h1', null, title) },
        '@/components/Picker': { Picker: () => null },
        '@/shared/clipboard/copyTextToClipboard.ts': { copyTextToClipboard: async () => true },
        '@/features/orders/useOrderConfig.ts': { useOrderConfig: () => ({ config: { enabled: true, phase: 'sell', sellStart: '10:00', sellEnd: '15:00', buyStart: '16:00', buyEnd: '17:00', serverTime: '2026-10-10 10:30:00' }, failed: false }) },
        '@/features/orders/api.ts': runtime({ '@/services/http/index.ts': {} })('src/features/orders/api.ts'),
        './useHomeCardOrders.ts': { useHomeCardOrders: () => ({ orders: [], loading: false, failed: false, retry: () => {} }) },
        '@/features/products/useProducts.ts': { useProducts: () => ({ products: [{ id: 1, name: '后端商品名称', image: '/products/1.png', price: '100.123456' }], loading: false, failed: false }) },
        '@/router': { ROUTE_PATH: { auction: '/auction', cardPack: '/card-pack', deposit: '/deposit', withdraw: '/withdraw' }, useAppNavigate: () => ({ pushRoute: () => {} }) },
        './TransferPopup': { TransferPopup: () => null },
        react: React, 'react/jsx-runtime': await import('react/jsx-runtime'), 'react-i18next': { useTranslation, Trans },
        'swiper/modules': { A11y: {}, FreeMode: {} }, 'swiper/css': {},
        'swiper/react': { Swiper: ({ children }) => React.createElement('div', null, children), SwiperSlide: ({ children }) => React.createElement('div', null, children) },
        '@/components/Empty': { Empty }, '@/components/Toast': { Toast: () => null, useToast: () => ({ showToast: () => {} }) },
        '@/components/DropletLoading': { DropletLoading: () => null },
        '@/components/PagePullRefresh': { PagePullRefresh: ({ children }) => children },
        '@/components/SegmentedTabs': { SegmentedTabs: ({ items }) => React.createElement('div', null, items.map(item => React.createElement('button', { key: item.value }, item.label))) },
        '../pagination/usePreviewList.ts': { usePreviewList: () => ({ state: { query: showTransfers ? 'transfers' : 'usdt', items: showTransfers ? [
            { id: 1, content: '转入', amount: '+1000.010000', tone: 'income', createdAt: '2026-10-10 13:45:19', transfer: { address: '0xf39...2266', fee: '0.010000' } },
            { id: 2, content: '转出', amount: '-2.123456', tone: 'expense', createdAt: '2026-10-10 12:45:19', transfer: { address: '0x529...9EE7', fee: '0' } },
        ] : [{ id: 1, content: '后端原文 messages.1', amount: '+1000.010000', tone: 'income', createdAt: '2026-09-29 12:00:00' }], overview: { usdt: '1006.010000', yuanqi: '100.000000', baoqi: '1.700000' } }, pagination: {} }) },
        './service.ts': {}, '@/services/http/index.ts': { wasHttpErrorReported: () => false },
    }
    for (const path of files('src/assets')) if (/\.(png|svg)$/.test(path)) mocks[`@/${path.slice(4)}`] = { default: path }
    const load = runtime(mocks)
    const Home = load('src/pages/main/home/HomePage.tsx').HomePage
    const Assets = load('src/pages/main/assets/AssetsPage.tsx').AssetsPage
    const Deposit = load('src/pages/main/deposit/DepositPage.tsx').DepositPage
    const render = Component => renderToStaticMarkup(React.createElement(I18nextProvider, { i18n }, React.createElement(Component)))
    const expected = { 'zh-Hans': '立即购买', 'zh-Hant': '立即購買', en: 'Buy now', ja: '今すぐ購入', ko: '지금 구매' }
    for (const code of codes) {
        await i18n.changeLanguage(code)
        showTransfers = false
        const home = render(Home), assets = render(Assets)
        assert.ok(home.includes(expected[code]), code)
        assert.ok(home.includes('后端商品名称'), code)
        assert.ok(home.includes('10:00–15:00'), code)
        assert.ok(home.includes('home-page__amount">100.123456'), code)
        assert.ok(assets.includes(messages[code]['余额明细']), code)
        assert.ok(assets.includes(messages[code]['余额']), code)
        assert.ok(!assets.includes('USDT'), code)
        assert.ok(assets.includes('后端原文 messages.1'), code)
        assert.ok(assets.includes('+1000.010000'), code)
        assert.ok(!home.includes('{{') && !assets.includes('{{'), code)
        showTransfers = true
        const transfers = render(Assets), deposit = render(Deposit)
        assert.ok(transfers.includes(i18n.t('由 {{address}} 转入', { address: '0xf39...2266' })), code)
        assert.ok(transfers.includes(i18n.t('转出给 {{address}}', { address: '0x529...9EE7' })), code)
        assert.ok(transfers.includes(i18n.t('手续费：{{amount}} 宝气', { amount: '0.010000' })), code)
        assert.ok(transfers.includes('+1000.010000') && transfers.includes('-2.123456'), code)
        assert.ok(deposit.includes(`<title>${messages[code]['充值二维码']}</title>`), code)
        assert.ok(deposit.includes(rechargeAddress) && deposit.includes('BSC20'), code)
        assert.ok(!transfers.includes('{{') && !deposit.includes('{{'), code)
    }
})
