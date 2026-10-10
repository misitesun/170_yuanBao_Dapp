import { useTranslation } from 'react-i18next'
import { wasHttpErrorReported } from '@/services/http/index.ts'

import { useCallback } from 'react'

import invitationCopy from '@/assets/team/invitation-copy.png'
import walletCopy from '@/assets/team/wallet-copy.svg'
import codeCopy from '@/assets/team/code-copy.svg'
import { Empty } from '@/components/Empty'
import { PagePullRefresh } from '@/components/PagePullRefresh'
import { Toast, useToast } from '@/components/Toast'
import { Input } from '@/components/Input'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'
import { maskWalletAddress } from '@/shared/formatters/maskWalletAddress.ts'
import { useDappStore } from '@/stores/dapp/index.ts'

import { usePreviewList } from '../pagination/usePreviewList.ts'
import { loadTeamPage, TEAM_EMPTY_OVERVIEW } from './service.ts'
import './TeamPage.scss'

function TeamContent({ onError, showToast }: { onError: (error?: unknown) => void; showToast: ReturnType<typeof useToast>['showToast'] }) {
    const { t } = useTranslation()
    const walletAddress = useDappStore((state) => state.walletAddress)
    const { state, pagination } = usePreviewList(loadTeamPage, 'all', onError)
    const overview = state.overview ?? TEAM_EMPTY_OVERVIEW

    async function handleCopy(value: string) {
        if (!value) return
        const copied = await copyTextToClipboard(value)
        showToast(copied ? t("复制成功") : t("复制失败"), copied ? 'success' : 'error')
    }

    return (
        <div className="team-page">
            <section className="team-page__identity" aria-label={t("钱包与等级")}>
                <div className="team-page__wallet">
                    <div className="team-page__wallet-heading flex items-center">
                        <span>{t("钱包地址")}</span>
                        <button type="button" className="team-page__wallet-copy flex-center" aria-label={t("复制钱包地址")} disabled={!walletAddress} onClick={() => void handleCopy(walletAddress)}>
                            <img src={walletCopy} alt="" />
                        </button>
                    </div>
                    <p className="team-page__wallet-address">{maskWalletAddress(walletAddress).replace('****', '...')}</p>
                    <p className="team-page__level flex-center">{t('当前等级 {{level}}', { level: overview.level?.name ?? t('暂无等级') })}</p>
                </div>
                {overview.level && overview.level.id !== 1 && overview.level.icon ? <img className="team-page__level-emblem" src={overview.level.icon} alt={t("用户等级图标")} /> : null}
            </section>

            <section className="team-page__invitation flex flex-column items-center" aria-labelledby="team-invitation-title">
                <h1 id="team-invitation-title" className="team-page__invitation-title tc">{t("我的邀请码")}</h1>
                <div className="team-page__code-row">
                    <span className="team-page__code tc">{overview.invitationCode || '—'}</span>
                    <button type="button" className="team-page__code-copy flex-center" aria-label={t("复制邀请码")} disabled={!overview.invitationCode} onClick={() => void handleCopy(overview.invitationCode)}>
                        <img src={codeCopy} alt="" />
                    </button>
                </div>
                <div className="team-page__invitation-row">
                    <Input aria-label={t("邀请链接")} value={overview.invitationContent || '—'} readOnly />
                    <button type="button" className="team-page__invitation-copy flex-center" aria-label={t("复制邀请内容")} disabled={!overview.invitationContent} onClick={() => void handleCopy(overview.invitationContent)}>
                        <img src={invitationCopy} alt="" />
                    </button>
                </div>
            </section>

            <dl className="team-page__statistics" aria-label={t("团队统计")}>
                {overview.statistics.map((item) => (
                    <div className="team-page__statistic flex flex-column" key={item.label}>
                        <dt>{t(item.label)}</dt>
                        <dd className={item.accent ? 'team-page__statistic-value--accent' : undefined}>{item.value}</dd>
                    </div>
                ))}
            </dl>

            <section className="team-page__members" aria-labelledby="team-members-title">
                <h2 id="team-members-title" className="team-page__members-title">{t("直推成员")}</h2>
                <div aria-busy={state.isFirstLoading || state.isLoadingMore}>
                    <ul className="team-page__member-list flex flex-column">
                        {state.items.map((member) => (
                            <li className="team-page__member" key={member.id}>
                                <div className="team-page__member-heading flex justify-between">
                                    <div>
                                        <h3 className="team-page__member-name">{member.name}</h3>
                                        <time className="team-page__member-time" dateTime={member.joinedAt.replace(' ', 'T')}>{member.joinedAt.replaceAll('-', '.')}</time>
                                    </div>
                                    {member.level && member.level.id !== 1 && member.level.icon ? <img className="team-page__member-level" src={member.level.icon} alt={t("成员等级图标")} /> : null}
                                </div>
                                <div className="team-page__member-divider" aria-hidden="true" />
                                <dl className="team-page__member-performance flex flex-column">
                                    <div className="flex justify-between"><dt>{t("个人业绩")}</dt><dd>{member.kpi}</dd></div>
                                    <div className="flex justify-between"><dt>{t("团队业绩")}</dt><dd>{member.teamKpi}</dd></div>
                                </dl>
                            </li>
                        ))}
                    </ul>
                    {!state.isFirstLoading && state.items.length === 0 ? (
                        state.loadError ? (
                            <div className="team-page__empty tc">
                                <p>{t("团队加载失败")}</p>
                                <button className="auto-btn" type="button" onClick={() => void pagination.replace().catch(onError)}>{t("重新加载")}</button>
                            </div>
                        ) : <Empty />
                    ) : null}
                </div>
            </section>
        </div>
    )
}

export function TeamPage() {
    const { t } = useTranslation()
    const { message, variant, showToast } = useToast()
    const onError = useCallback((error?: unknown) => { if (!wasHttpErrorReported(error)) showToast(t("团队加载失败，请重试"), 'error') }, [showToast, t])
    return (
        <PagePullRefresh onError={onError}>
            <TeamContent onError={onError} showToast={showToast} />
            <Toast message={message} variant={variant} />
        </PagePullRefresh>
    )
}
