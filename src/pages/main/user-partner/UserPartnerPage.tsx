import { type CSSProperties } from 'react'

import dividendBenefitIcon from '@/assets/user-partner/dividend-benefit.png'
import membershipCardBackground from '@/assets/user-partner/membership-card-bg.png'
import partnerHero from '@/assets/user-partner/partner-hero.png'
import referralBenefitIcon from '@/assets/user-partner/referral-benefit.png'
import titleDividerLeft from '@/assets/user-partner/title-divider-left.png'
import titleDividerRight from '@/assets/user-partner/title-divider-right.png'
import usdtIcon from '@/assets/stake/usdt.svg'
import { ActionButton } from '@/components/ActionButton'
import { SecondaryHeader } from '@/components/SecondaryHeader'
import { Toast, useToast } from '@/components/Toast'

import './UserPartnerPage.scss'

/** First-phase partner introduction; joining remains a local static demo. */
export function UserPartnerPage() {
    const { message, showToast } = useToast()

    return (
        <div
            className="user-partner-page"
            data-page="user-partner"
            style={{
                '--user-partner-hero': `url(${partnerHero})`,
                '--user-partner-card': `url(${membershipCardBackground})`,
            } as CSSProperties}
        >
            <SecondaryHeader title="成为合伙人" showGap={false} />

            <main className="user-partner-page__main">
                <section className="user-partner-page__hero tc" aria-labelledby="user-partner-heading">
                    <h1 id="user-partner-heading" className="size-56 bold-6">成为 HU CHAIN 合伙人</h1>
                    <div className="user-partner-page__subtitle flex items-center justify-center">
                        <img src={titleDividerLeft} alt="" />
                        <p>携手共建生态，共享平台成长</p>
                        <img src={titleDividerRight} alt="" />
                    </div>
                </section>

                <section className="user-partner-page__membership tc" aria-label="合伙人金额">
                    <p className="user-partner-page__membership-label">合伙人金额</p>
                    <p className="user-partner-page__amount flex items-center justify-center bold-6">
                        <img src={usdtIcon} alt="USDT" />
                        <span>500 USDT</span>
                    </p>
                    <ActionButton
                        size="small"
                        onClick={() => showToast('加入合伙人当前为静态演示，未提交交易')}
                    >
                        确认加入
                    </ActionButton>
                </section>

                <section className="user-partner-page__benefits" aria-labelledby="partner-benefits-heading">
                    <div className="user-partner-page__section-title flex items-center justify-center">
                        <img src={titleDividerLeft} alt="" />
                        <h2 id="partner-benefits-heading" className="size-32 bold-5">合伙人专属权益</h2>
                        <img src={titleDividerRight} alt="" />
                    </div>

                    <div className="user-partner-page__benefit-list flex flex-column">
                        <article className="user-partner-page__benefit flex items-center">
                            <img src={dividendBenefitIcon} alt="" />
                            <div>
                                <h3 className="size-28 bold-4">分红收益</h3>
                                <p className="size-24">瓜分平台全部用户提取手续费总额的<strong>80%</strong></p>
                            </div>
                        </article>
                        <article className="user-partner-page__benefit flex items-center">
                            <img src={referralBenefitIcon} alt="" />
                            <div>
                                <h3 className="size-28 bold-4">推广奖励</h3>
                                <p className="size-24">成功推荐一名合伙人，直接奖励<strong>50USDT</strong></p>
                            </div>
                        </article>
                    </div>
                </section>
            </main>

            <Toast message={message} />
        </div>
    )
}
