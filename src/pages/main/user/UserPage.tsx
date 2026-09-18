import { useCallback, useState } from 'react'

import assetSwitchIcon from '@/assets/user/asset-switch.png'
import avatarIcon from '@/assets/user/avatar.png'
import balanceEyeIcon from '@/assets/user/balance-eye.png'
import chevronRightIcon from '@/assets/user/chevron-right.png'
import huCardBackground from '@/assets/user/hu-card-bg.png'
import huTokenIcon from '@/assets/user/hu-token.png'
import levelNewcomerIcon from '@/assets/user/level-newcomer.png'
import levelPartnerIcon from '@/assets/user/level-partner.png'
import marketIcon from '@/assets/user/market.png'
import ordersIcon from '@/assets/user/orders.png'
import partnerBanner from '@/assets/user/partner-banner.png'
import pointsCardBackground from '@/assets/user/points-card-bg.png'
import pointsTokenIcon from '@/assets/user/points-token.png'
import powerIcon from '@/assets/user/power.png'
import rechargeIcon from '@/assets/user/recharge.png'
import teamIcon from '@/assets/user/team.png'
import withdrawIcon from '@/assets/user/withdraw.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import { ActionButton } from '@/components/ActionButton'
import { MarketPopup, type MarketAssetType } from '@/components/MarketPopup'
import { usePageRefresh } from '@/components/PagePullRefresh'
import { Toast, useToast } from '@/components/Toast'
import { ROUTE_PATH, useAppNavigate } from '@/router'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'

import './UserPage.scss'

const MOCK_DELAY_MS = 320

const PROFILE_FIXTURE = {
    address: 'sbds****dsel',
    inviteCode: 'HB76S6D',
    usdtBalance: '44,234.30',
    huBalance: '44,234.30',
    pointsBalance: '44,234.30',
    powerBalance: '1,000 万',
} as const

const ASSET_CARDS = [
    {
        name: 'HU资产',
        marketType: 'hu',
        value: PROFILE_FIXTURE.huBalance,
        icon: huTokenIcon,
        background: huCardBackground,
    },
    {
        name: '积分资产',
        marketType: 'points',
        value: PROFILE_FIXTURE.pointsBalance,
        icon: pointsTokenIcon,
        background: pointsCardBackground,
    },
] as const

function loadMockProfile(): Promise<typeof PROFILE_FIXTURE> {
    return new Promise((resolve) => {
        window.setTimeout(() => resolve({ ...PROFILE_FIXTURE }), MOCK_DELAY_MS)
    })
}

export function UserPage() {
    const [profile, setProfile] = useState(PROFILE_FIXTURE)
    const [showBalance, setShowBalance] = useState(true)
    const [marketAssetType, setMarketAssetType] = useState<MarketAssetType>('hu')
    const [showMarketPopup, setShowMarketPopup] = useState(false)
    const { message, showToast } = useToast()
    const { pushRoute } = useAppNavigate()

    const refreshPage = useCallback(async () => {
        const nextProfile = await loadMockProfile()
        setProfile(nextProfile)
    }, [])

    usePageRefresh(refreshPage)

    async function handleCopyInviteCode() {
        const copied = await copyTextToClipboard(profile.inviteCode)
        showToast(copied ? '邀请码已复制' : `邀请码：${profile.inviteCode}`)
    }

    function showStaticFeedback(action: string) {
        showToast(`${action}功能当前为静态演示`)
    }

    function handleOpenMarket(assetType: MarketAssetType) {
        setMarketAssetType(assetType)
        setShowMarketPopup(true)
    }

    function handleConvertPower() {
        setShowMarketPopup(false)
        pushRoute(ROUTE_PATH.pointsConvert)
    }

    const visibleBalance = (value: string) => showBalance ? value : '••••••'

    return <main className="user-page" data-page="user">
        <section className="user-page__profile" aria-labelledby="user-page-account">
            <div className="user-page__identity flex items-center">
                <img className="user-page__avatar" src={avatarIcon} alt="HU-CHAIN" />
                <div className="user-page__identity-copy flex-1">
                    <h1 id="user-page-account" className="size-32 bold-5">{profile.address}</h1>
                    <button type="button" className="user-page__invite flex items-center size-24"
                        onClick={() => { void handleCopyInviteCode() }} aria-label={`复制邀请码 ${profile.inviteCode}`}>
                        邀请码 {profile.inviteCode}
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h10v10H8zM5 15H4V4h11v1" /></svg>
                    </button>
                </div>
                <div className="user-page__levels flex items-center">
                    <span className="user-page__level flex items-center size-20 bold-6"><img src={levelNewcomerIcon} alt="" />新手</span>
                    <span className="user-page__level user-page__level--partner flex items-center size-20 bold-6"><img src={levelPartnerIcon} alt="" />合伙人</span>
                </div>
            </div>

            <div className="user-page__balance-row flex items-end justify-between">
                <div>
                    <p className="user-page__balance-label size-24">USDT资产预览</p>
                    <p className="user-page__balance flex items-center size-56 bold-4">
                        <img src={usdtIcon} alt="USDT" />
                        <span>{visibleBalance(profile.usdtBalance)}</span>
                    </p>
                </div>
                <button type="button" className="user-page__balance-toggle flex-center"
                    aria-label={showBalance ? '隐藏资产余额' : '显示资产余额'}
                    aria-pressed={!showBalance} onClick={() => setShowBalance((visible) => !visible)}>
                    <img src={balanceEyeIcon} alt="" />
                </button>
            </div>

            <div className="user-page__quick-actions grid">
                <ActionButton className="user-page__quick-action" icon={<img src={rechargeIcon} alt="" />}
                    onClick={() => pushRoute(ROUTE_PATH.userRecharge)}>充值</ActionButton>
                <ActionButton className="user-page__quick-action" variant="secondary" icon={<img src={withdrawIcon} alt="" />}
                    onClick={() => pushRoute(ROUTE_PATH.userWithdraw)}>提取</ActionButton>
                <button type="button" className="user-page__orders flex-center" aria-label="查看订单"
                    onClick={() => showStaticFeedback('订单')}><img src={ordersIcon} alt="" /></button>
            </div>
        </section>

        <section className="user-page__asset-grid grid" aria-label="个人资产">
            {ASSET_CARDS.map((asset) => <article key={asset.name} className="user-page__asset-card flex flex-column justify-between"
                style={{ backgroundImage: `url(${asset.background})` }}>
                <header className="user-page__asset-heading flex items-center justify-between">
                    <div className="flex items-center"><img src={asset.icon} alt="" /><span className="size-24">{asset.name}</span></div>
                    {asset.name === '积分资产' ? <img className="user-page__asset-switch" src={assetSwitchIcon} alt="" /> : null}
                </header>
                <p className="user-page__asset-value size-40 bold-5">{visibleBalance(asset.value)}</p>
                <button type="button" className="user-page__market-link flex items-center size-24"
                    onClick={() => handleOpenMarket(asset.marketType)}><img src={marketIcon} alt="" />行情</button>
            </article>)}
        </section>

        <section className="user-page__power flex items-center justify-between" aria-label="算力资产">
            <div className="flex items-center"><img src={powerIcon} alt="" /><span className="size-28">算力资产</span></div>
            <strong className="size-28 bold-5">{visibleBalance(profile.powerBalance)}</strong>
        </section>

        <section className="user-page__partner flex flex-column justify-center" style={{ backgroundImage: `url(${partnerBanner})` }}>
            <h2 className="size-48 bold-6">成为合伙人</h2>
            <p className="size-24">携手HU CHAIN,共建生态未来</p>
            <ActionButton size="small" className="user-page__partner-action size-24"
                onClick={() => pushRoute(ROUTE_PATH.userPartner)}>查看详情</ActionButton>
        </section>

        <button type="button" className="user-page__team flex items-center justify-between"
            onClick={() => pushRoute(ROUTE_PATH.userTeam)}>
            <span className="flex items-center size-28"><img src={teamIcon} alt="" />我的团队</span>
            <img src={chevronRightIcon} alt="" />
        </button>

        <MarketPopup
            show={showMarketPopup}
            assetType={marketAssetType}
            onClose={() => setShowMarketPopup(false)}
            onConvertPower={handleConvertPower}
        />

        <Toast message={message} />
    </main>
}
