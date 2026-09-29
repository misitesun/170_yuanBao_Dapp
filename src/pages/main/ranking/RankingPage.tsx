import { Trans, useTranslation } from 'react-i18next'
import titleDivider from '@/assets/common/title-divider.png'
import firstMedal from '@/assets/ranking/rank-first.png'
import secondMedal from '@/assets/ranking/rank-second.png'
import thirdMedal from '@/assets/ranking/rank-third.png'
import myRankIcon from '@/assets/ranking/my-rank-icon.png'

import './RankingPage.scss'

// Design fixtures only; replace with documented ranking data during API integration.
const ranks = Array.from({ length: 9 }, (_, index) => ({
    rank: index + 1,
    address: '0xec***36c3',
    amount: '$12,874.29',
}))
const medals = [firstMedal, secondMedal, thirdMedal]

export function RankingPage() {
    const { t } = useTranslation()
    return (
        <div className="ranking-page">
            <header className="ranking-page__hero flex flex-column items-center tc">
                <h1 className="ranking-page__title"><Trans i18nKey="元宝<0>排行榜</0>" components={[<span key="accent" />]} /></h1>
                <p className="ranking-page__subtitle">{t("按累计参与金额排名，看看谁位列榜首，脱颖而出")}</p>
                <img className="ranking-page__divider" src={titleDivider} alt="" />
            </header>

            <section className="ranking-page__results" aria-label={t("累计参与金额排行榜")}>
                <ol className="ranking-page__list flex flex-column">
                    {ranks.map(({ rank, address, amount }) => (
                        <li key={rank} className={`ranking-page__row ranking-page__row--${rank <= 3 ? rank : 'regular'}`}>
                            {rank <= 3 ? (
                                <img className="ranking-page__medal" src={medals[rank - 1]} alt={t('第{{rank}}名', { rank })} />
                            ) : (
                                <span className="ranking-page__number tc" aria-label={t('第{{rank}}名', { rank })}>
                                    {String(rank).padStart(2, '0')}
                                </span>
                            )}
                            <span className="ranking-page__address">{address}</span>
                            <span className="ranking-page__amount tr">{amount}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <aside className="ranking-page__mine" aria-label={t("我的排名")}>
                <div className="ranking-page__glow" aria-hidden="true" />
                <img className="ranking-page__my-icon" src={myRankIcon} alt="" />
                <div className="ranking-page__my-identity flex flex-column">
                    <p className="ranking-page__my-title">{t("我的排名：--")}</p>
                    <p className="ranking-page__my-address">0xec***36c3</p>
                </div>
                <div className="ranking-page__my-total flex flex-column tr">
                    <p className="ranking-page__my-amount">1,102.345298</p>
                    <p className="ranking-page__my-label">{t("参与金额(USDT)")}</p>
                </div>
            </aside>
        </div>
    )
}
