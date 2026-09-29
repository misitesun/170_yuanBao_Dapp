import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const sidebarSource = await readFile(
    'src/pages/main/layout/SidebarMenu.tsx',
    'utf8',
)
const layoutSource = await readFile(
    'src/pages/main/layout/MainLayout.tsx',
    'utf8',
)

test('sidebar menu is a right popup controlled by the main layout', () => {
    assert.match(sidebarSource, /import \{ Popup \} from '@\/components\/Popup'/)
    assert.match(sidebarSource, /type SidebarMenuProps/)
    assert.match(sidebarSource, /show: boolean/)
    assert.match(sidebarSource, /onClose: \(\) => void/)
    assert.match(sidebarSource, /<Popup/)
    assert.match(sidebarSource, /show=\{show\}/)
    assert.match(sidebarSource, /onClose=\{onClose\}/)
    assert.match(sidebarSource, /position="right"/)
    assert.match(sidebarSource, /contentPreset=\{false\}/)

    assert.match(layoutSource, /useState/)
    assert.match(layoutSource, /const \[showSidebarMenu, setShowSidebarMenu\] = useState\(false\)/)
    assert.match(layoutSource, /function handleToggleSidebarMenu\(\)/)
    assert.match(layoutSource, /setShowSidebarMenu\(\(isOpen\) => !isOpen\)/)
    assert.match(layoutSource, /function handleCloseSidebarMenu\(\)/)
    assert.match(layoutSource, /setShowSidebarMenu\(false\)/)
    assert.match(layoutSource, /<SidebarMenu/)
    assert.match(layoutSource, /show=\{showSidebarMenu\}/)
    assert.match(layoutSource, /onClose=\{handleCloseSidebarMenu\}/)
})

test('sidebar menu reuses the shared first-level layout menu items', () => {
    assert.match(sidebarSource, /SIDEBAR_ITEMS\.map/)
    assert.match(sidebarSource, /key=\{item\.id\}/)
    assert.match(sidebarSource, /to=\{item\.path\}/)
    assert.match(sidebarSource, /\{t\(item\.title\)\}/)
    assert.match(sidebarSource, /handleMenuLinkClick\(event, item\)/)
    assert.match(sidebarSource, /function handleMenuLinkClick\(/)
    assert.match(sidebarSource, /handleMenuLinkClick[\s\S]*onClose\(\)/)
})

test('sidebar uses confirmed design artwork and isolates its visual theme', async () => {
    const styles = await readFile('src/pages/main/layout/MainLayout.scss', 'utf8')
    assert.match(sidebarSource, /src=\{active \? item\.activeImage : item\.image\}/)
    assert.match(sidebarSource, /app-menu__link--active/)
    assert.match(styles, /color: var\(--app-sidebar-accent\)/)
    assert.doesNotMatch(sidebarSource, /referral_code|features\/ai-claw|ROUTE_PATH/)
    assert.doesNotMatch(sidebarSource, /<AppBrand/)
})

test('sidebar leaves invitation link empty and uses the shared clipboard boundary only for available links', () => {
    assert.match(sidebarSource, /invitationLink = ''/)
    assert.match(sidebarSource, /if \(!invitationLink\) return/)
    assert.match(sidebarSource, /disabled=\{!invitationLink\}/)
    assert.match(sidebarSource, /copyTextToClipboard\(invitationLink\)/)
    assert.match(sidebarSource, /staticPreview \? previewWalletAddress : connectedWalletAddress/)
    assert.match(sidebarSource, /WalletOrbitBorder/)
    assert.doesNotMatch(sidebarSource, /navigator\.clipboard|localStorage|fetch\(/)
})


test('unfinished entries select locally instead of navigating to nonexistent pages', () => {
    assert.match(sidebarSource, /if \(item\.path && !staticPreview\)/)
    assert.match(sidebarSource, /aria-pressed=\{active\}/)
    assert.match(sidebarSource, /setSelectedItem\(item\.id\)/)
    assert.doesNotMatch(sidebarSource, /disconnect\(|退出/)
})
