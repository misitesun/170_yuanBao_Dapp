import { useCallback, useState } from 'react'

import copyActionIcon from '@/assets/user-team/copy-action.png'
import teamValueCoins from '@/assets/user-team/team-value-coins.png'
import avatarIcon from '@/assets/user/avatar.png'
import levelNewcomerIcon from '@/assets/user/level-newcomer.png'
import { usePageLoadMore, usePageRefresh } from '@/components/PagePullRefresh'
import { Input } from '@/components/Input'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'
import { copyTextToClipboard } from '@/shared/clipboard/copyTextToClipboard.ts'

import { getMockTeamMemberPage } from './pagination.ts'

import './UserTeamPage.scss'

const MOCK_DELAY_MS = 420
const INVITE_CODE = '7C2EX8GN'
const INVITE_ADDRESS = '0xalifuiewhgouerg564vbfd8sv69a45s4s0xc'

function waitForMockData(): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, MOCK_DELAY_MS)
    })
}

/** First-phase team overview with local search, copy feedback and mock pagination. */
export function UserTeamPage() {
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const { message, showToast } = useToast()
    const currentPage = getMockTeamMemberPage(query, page)

    const refreshPage = useCallback(async () => {
        await waitForMockData()
        setPage(1)
    }, [])

    const loadNextPage = useCallback(async () => {
        await waitForMockData()
        setPage((current) => current + 1)
    }, [])

    async function handleCopy(value: string, label: string) {
        const copied = await copyTextToClipboard(value)
        showToast(copied ? `${label}已复制` : `${label}：${value}`)
    }

    function handleQueryChange(nextQuery: string) {
        setQuery(nextQuery)
        setPage(1)
    }

    usePageRefresh(refreshPage)
    usePageLoadMore(loadNextPage, { hasMore: currentPage.hasMore })

    return (
        <div className="user-team-page" data-page="user-team">
            <SecondaryHeader title="我的团队" />

            <main className="user-team-page__main">
                <section className="user-team-page__identity flex items-center" aria-label="当前账户">
                    <img className="user-team-page__avatar" src={avatarIcon} alt="HU-CHAIN" />
                    <div className="flex-1">
                        <p className="size-24">地址账户</p>
                        <strong className="size-28 bold-5">sbds****dsel</strong>
                    </div>
                    <span className="user-team-page__level flex items-center size-20 bold-6">
                        <img src={levelNewcomerIcon} alt="" />新手
                    </span>
                </section>

                <section className="user-team-page__invite tc" aria-labelledby="team-invite-heading">
                    <h2 id="team-invite-heading" className="size-24 bold-4">我的邀请码</h2>
                    <div className="user-team-page__invite-code flex-center">
                        <strong className="size-46 bold-7">{INVITE_CODE}</strong>
                        <button type="button" aria-label="复制邀请码"
                            onClick={() => { void handleCopy(INVITE_CODE, '邀请码') }}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v10H9zM5 15H4V4h11v1" /></svg>
                        </button>
                    </div>
                    <div className="user-team-page__invite-address flex items-center">
                        <p className="size-24 tl flex-1">{INVITE_ADDRESS}</p>
                        <button type="button" aria-label="复制邀请地址"
                            onClick={() => { void handleCopy(INVITE_ADDRESS, '邀请地址') }}>
                            <img src={copyActionIcon} alt="" />
                        </button>
                    </div>
                </section>

                <section className="user-team-page__summary" aria-label="团队汇总">
                    <div className="user-team-page__summary-overview grid">
                        <div>
                            <strong className="user-team-page__total-value size-40 bold-6">2,340.638694</strong>
                            <p className="size-24">团队质押总价值(USDT)</p>
                            <dl className="user-team-page__summary-details grid">
                                <div>
                                    <dd className="user-team-page__miner-count size-32 bold-6">32</dd>
                                    <dt className="size-24">团队矿机数</dt>
                                </div>
                                <div>
                                    <dd className="user-team-page__checkin-count size-32 bold-6">2,000</dd>
                                    <dt className="size-24">团队签到有效人数</dt>
                                </div>
                            </dl>
                        </div>
                        <img src={teamValueCoins} alt="" />
                    </div>
                    <dl className="user-team-page__counters grid">
                        <div className="flex items-center justify-between">
                            <dt className="size-24">团队人数</dt>
                            <dd className="size-28 bold-5">2,024</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="size-24">直推人数</dt>
                            <dd className="size-28 bold-5">2,024</dd>
                        </div>
                    </dl>
                </section>

                <section className="user-team-page__members" aria-labelledby="team-members-heading">
                    <header className="user-team-page__members-toolbar flex items-center justify-between">
                        <h2 id="team-members-heading" className="user-team-page__section-title flex items-center size-32 bold-6">团队成员</h2>
                        <div className="user-team-page__search">
                            <Input
                                type="search"
                                value={query}
                                placeholder="查询成员业绩"
                                aria-label="查询成员业绩"
                                prefix={<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>}
                                onChange={(event) => handleQueryChange(event.target.value)}
                            />
                        </div>
                    </header>

                    <div className="user-team-page__member-list flex flex-column">
                        {currentPage.items.map((member) => (
                            <article key={member.id} className="user-team-page__member-card">
                                <header className="flex items-start justify-between">
                                    <div>
                                        <h3 className="size-28 bold-5">{member.address}</h3>
                                        <time className="size-24" dateTime={member.joinedAt.replaceAll('.', '-').replace(' ', 'T')}>{member.joinedAt}</time>
                                    </div>
                                    <span className="user-team-page__member-level flex items-center size-20 bold-6">
                                        <img src={levelNewcomerIcon} alt="" />{member.level}
                                    </span>
                                </header>
                                <dl className="user-team-page__member-data flex flex-column size-24">
                                    <div className="flex items-center justify-between"><dt>个人质押</dt><dd>{member.personalStake}</dd></div>
                                    <div className="flex items-center justify-between"><dt>团队质押</dt><dd>{member.teamStake}</dd></div>
                                </dl>
                            </article>
                        ))}
                        {currentPage.items.length === 0 ? <p className="user-team-page__empty tc size-22">未查询到团队成员</p> : null}
                    </div>
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}
