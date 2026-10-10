import { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Empty } from '@/components/Empty'
import { Toast, useToast } from '@/components/Toast'
import { wasHttpErrorReported } from '@/services/http/index.ts'
import { useDappStore } from '@/stores/dapp/index.ts'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import titleDivider from '@/assets/common/title-divider.png'
import firstMedal from '@/assets/ranking/rank-first.png'
import secondMedal from '@/assets/ranking/rank-second.png'
import thirdMedal from '@/assets/ranking/rank-third.png'
import myRankIcon from '@/assets/ranking/my-rank-icon.png'

import './RankingPage.scss'
import { useRanking } from './useRanking.ts'

const medals = [firstMedal, secondMedal, thirdMedal]

function RankingContent({ onError }: { onError: (error?: unknown) => void }) {
    const { t } = useTranslation()
    const { data, loading, failed, reload } = useRanking(onError)
    const walletAddress = useDappStore((state) => state.walletAddress)
    return (
        <div className="ranking-page">
            <header className="ranking-page__hero flex flex-column items-center tc">
                <h1 className="ranking-page__title"><Trans i18nKey="元宝<0>排行榜</0>" components={[<span key="accent" />]} /></h1>
                <p className="ranking-page__subtitle">{t("按累计参与金额排名，看看谁位列榜首，脱颖而出")}</p>
                <img className="ranking-page__divider" src={titleDivider} alt="" />
            </header>

            <section className="ranking-page__results" aria-label={t("当日团队业绩排行榜")} aria-busy={loading}>
                {!loading && failed ? <div className="tc"><p>{t('排行榜加载失败，请重试')}</p><button className="auto-btn" type="button" onClick={() => void reload()}>{t('重新加载')}</button></div> : null}
                {!loading && data?.list.length === 0 ? <Empty /> : null}
                <ol className="ranking-page__list flex flex-column">
                    {data?.list.map(({ rank, address, teamKpi }) => (
                        <li key={rank} className={`ranking-page__row ranking-page__row--${rank <= 3 ? rank : 'regular'}`}>
                            {rank <= 3 ? (
                                <img className="ranking-page__medal" src={medals[rank - 1]} alt={t('第{{rank}}名', { rank })} />
                            ) : (
                                <span className="ranking-page__number tc" aria-label={t('第{{rank}}名', { rank })}>
                                    {String(rank).padStart(2, '0')}
                                </span>
                            )}
                            <span className="ranking-page__address">{address}</span>
                            <span className="ranking-page__amount tr">{teamKpi}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <aside className="ranking-page__mine" aria-label={t("我的排名")}>
                <div className="ranking-page__glow" aria-hidden="true" />
                <img className="ranking-page__my-icon" src={myRankIcon} alt="" />
                <div className="ranking-page__my-identity flex flex-column">
                    <p className="ranking-page__my-title">{t('我的排名：{{rank}}', { rank: data ? (data.me.rank === 0 ? t('未上榜') : data.me.rank) : '—' })}</p>
                    <p className="ranking-page__my-address">{maskWalletAddress(walletAddress)}</p>
                </div>
                <div className="ranking-page__my-total flex flex-column tr">
                    <p className="ranking-page__my-amount">{data?.me.teamKpi ?? '—'}</p>
                    <p className="ranking-page__my-label">{t("团队业绩")}</p>
                </div>
            </aside>
        </div>
    )
}

export function RankingPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => {
        if (!wasHttpErrorReported(error)) showToast(t('排行榜加载失败，请重试'), 'error')
    }, [showToast, t])
    return <><RankingContent onError={onError} /><Toast message={message} variant={variant} /></>
}
