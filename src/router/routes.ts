import { APP_HOME_ROUTE_NAME } from './config.ts'

export const ROUTE_PATH = {
    root: '/',
    referral: '/ref/:ref',
    login: '/login',
    home: `/${APP_HOME_ROUTE_NAME}` as const,
    user: '/user',
    userRecharge: '/user/recharge',
    userWithdraw: '/user/withdraw',
    userWithdrawRecords: '/user/withdraw/records',
    userPartner: '/user/partner',
    userTeam: '/user/team',
    stake: '/stake',
    stakeOrders: '/stake/orders',
    presale: '/presale',
    presaleOrders: '/presale/orders',
    otc: '/otc',
    otcOrders: '/otc/orders',
    otcBuyOrderDetail: '/otc/orders/buy/detail',
    otcPostBuy: '/otc/post-buy',
    pointsConvert: '/points/convert-power',
} as const

export type RoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH]
