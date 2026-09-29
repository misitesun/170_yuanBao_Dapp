import { i18nRuntime } from './helpers/i18n-runtime.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { maskWalletAddress } from '../src/shared/formatters/maskWalletAddress.ts'

// Run the actual page handlers; mock only the wallet, clipboard and feedback boundaries.
function renderTeam(walletAddress = '', copied = true, data = {}) {
    const copies = [], feedback = []
    const element = (type, props) => ({ type, props })
    const modules = {
        'react-i18next': i18nRuntime,
        '@/services/http/index.ts': { wasHttpErrorReported: () => false },
        react: { useCallback: (callback) => callback },
        '../pagination/usePreviewList.ts': { usePreviewList: () => ({ state: { items: data.items ?? [], overview: data.overview ?? null, isFirstLoading: true, isLoadingMore: false }, pagination: {} }) },
        './service.ts': { TEAM_EMPTY_OVERVIEW: { invitationCode: '7C2EX8GN', invitationContent: 'https://example.test/ref/7C2EX8GN', level: null, statistics: [] } },
        '@/components/PagePullRefresh': { PagePullRefresh: 'refresh' },
        '@/components/DropletLoading': { DropletLoading: 'loading' },
        '@/components/Empty': { Empty: 'empty' },
        'react/jsx-runtime': { jsx: element, jsxs: element },
        '@/components/Input': { Input: 'input' },
        '@/components/Toast': {
            Toast: 'toast',
            useToast: () => ({ showToast: (...args) => feedback.push(args) }),
        },
        '@/stores/dapp/index.ts': { useDappStore: (selector) => selector({ walletAddress }) },
        '@/shared/formatters/maskWalletAddress.ts': { maskWalletAddress },
        '@/shared/clipboard/copyTextToClipboard.ts': {
            copyTextToClipboard: async (value) => { copies.push(value); return copied },
        },
    }
    const source = readFileSync('src/pages/main/team/TeamPage.tsx', 'utf8')
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    const exports = {}
    runInNewContext(outputText, {
        exports,
        require: (name) => {
            if (name.startsWith('@/assets/')) return { default: name }
            if (name.endsWith('.scss')) return {}
            assert.ok(name in modules, `unexpected boundary: ${name}`)
            return modules[name]
        },
    })
    const nodes = []
    function walk(node) {
        if (Array.isArray(node)) { node.forEach(walk); return }
        if (!node || typeof node !== 'object') return
        if (typeof node.type === 'function') { walk(node.type(node.props)); return }
        nodes.push(node)
        walk(node.props?.children)
    }
    walk(exports.TeamPage())
    return {
        copies, feedback, nodes,
        button: (name) => nodes.find((node) => node.type === 'button' && node.props['aria-label'] === name),
        input: nodes.find((node) => node.type === 'input'),
        address: nodes.find((node) => node.props.className === 'team-page__wallet-address'),
    }
}

test('team wallet copy is disabled without an address and copies the full connected address', async () => {
    const empty = renderTeam()
    assert.equal(empty.button('复制钱包地址').props.disabled, true)
    empty.button('复制钱包地址').props.onClick()
    await new Promise(setImmediate)
    assert.equal(empty.copies.length, 0)
    assert.equal(empty.feedback.length, 0)

    const address = '0x1234567890123456789012345678901234567890'
    const page = renderTeam(address)
    assert.equal(page.address.props.children, '0x123...7890')
    assert.equal(page.button('复制钱包地址').props.disabled, false)
    page.button('复制钱包地址').props.onClick()
    await new Promise(setImmediate)
    assert.deepEqual(page.copies, [address])
    assert.deepEqual(page.feedback, [['复制成功', 'success']])
})

test('team invitation copies the full readonly content and reports clipboard failure', async () => {
    const page = renderTeam('', false)
    assert.equal(page.input.props.readOnly, true)
    page.button('复制邀请内容').props.onClick()
    await new Promise(setImmediate)
    assert.deepEqual(page.copies, [page.input.props.value])
    assert.deepEqual(page.feedback, [['复制失败', 'error']])
})


test('team level icons use the level id, hiding level one for both the current user and members', () => {
    const firstLevel = { id: 1, name: 'V0', icon: 'https://example.test/v0.png' }
    const page = renderTeam('', true, { overview: { level: firstLevel, statistics: [] },
        items: [{ id: 2, name: 'member', joinedAt: '2026-09-29 00:00:00', level: firstLevel, kpi: '0', teamKpi: '0' }] })
    assert.equal(page.nodes.some((node) => node.props.className === 'team-page__level-emblem'), false)
    assert.equal(page.nodes.some((node) => node.props.className === 'team-page__member-level'), false)
})

test('other level ids render only the supplied icon, including member id one; null levels add no member badge', () => {
    const level = { id: 2, name: 'V1', icon: 'https://example.test/v1.png' }
    const member = { id: 1, name: 'member', joinedAt: '2026-09-29 00:00:00', kpi: '0', teamKpi: '0' }
    const page = renderTeam('', true, { overview: { level, statistics: [] }, items: [{ ...member, level }, { ...member, id: 3, level: null }] })
    const badges = page.nodes.filter((node) => node.props.className === 'team-page__member-level')
    assert.equal(badges.length, 1)
    assert.equal(badges[0].type, 'img')
    assert.equal(badges[0].props.src, level.icon)
    assert.equal(badges[0].props.children, undefined)
    assert.equal(page.nodes.find((node) => node.props.className === 'team-page__level-emblem').props.src, level.icon)
    assert.equal(page.nodes.some((node) => node.type === 'span' && ['V1', '暂无等级'].includes(node.props.children)), false)
})
