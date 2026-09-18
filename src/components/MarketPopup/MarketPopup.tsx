import marketAssetRing from '@/assets/common/market-asset-ring.png'
import marketIcon from '@/assets/user/market.png'
import { ActionButton } from '@/components/ActionButton'
import { Icon } from '@/components/Icon'
import { Popup } from '@/components/Popup'

import { MARKET_ASSET_PREVIEWS, type MarketAssetType } from './marketAssets.ts'
import './MarketPopup.scss'

export interface MarketPopupProps {
    show: boolean
    assetType: MarketAssetType
    onClose: () => void
    onConvertPower?: () => void
}

export function MarketPopup({
    show,
    assetType,
    onClose,
    onConvertPower,
}: MarketPopupProps) {
    const asset = MARKET_ASSET_PREVIEWS[assetType]
    const titleId = `market-popup-title-${assetType}`

    return <Popup
        show={show}
        position="bottom"
        contentPreset={false}
        contentClassName="market-popup__panel"
        onClose={onClose}
    >
        <section className="market-popup__content flex flex-column" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="market-popup__header flex items-center justify-between">
                <div className="market-popup__title flex items-center">
                    <img src={marketIcon} alt="" />
                    <h2 id={titleId} className="size-32 bold-5">行情</h2>
                </div>
                <button type="button" className="market-popup__close flex-center" aria-label="关闭行情弹窗" onClick={onClose}>
                    <Icon name="cross" size={32} />
                </button>
            </header>

            <div className="market-popup__summary flex flex-column items-center">
                <span className="market-popup__asset-badge grid">
                    <img className="market-popup__asset-ring" src={marketAssetRing} alt="" />
                    <img className="market-popup__asset-icon" src={asset.icon} alt="" />
                </span>
                <p className="market-popup__asset-label size-24">{asset.label}</p>
                <p className="market-popup__price size-56 bold-5">{asset.price}</p>
                <p className={`market-popup__change market-popup__change--${asset.positive ? 'up' : 'down'} size-24`}>
                    {asset.change}
                </p>
            </div>

            <div
                className="market-popup__chart-placeholder"
                role="img"
                aria-label={`${asset.name}行情蜡烛图，当前暂无数据`}
            />

            {assetType === 'points' ? <ActionButton className="market-popup__convert" onClick={onConvertPower}>
                积分兑换算力
            </ActionButton> : null}
        </section>
    </Popup>
}
