import { APP_HOME_ROUTE_NAME } from './config.ts'

export const ROUTE_PATH = {
    root: '/',
    login: '/login',
    referral: '/ref/:ref',
    home: `/${APP_HOME_ROUTE_NAME}` as const,
    auction: '/auction',
    cardPack: '/card-pack',
    assets: '/assets',
    deposit: '/deposit',
    depositRecords: '/deposit/records',
    withdraw: '/withdraw',
    withdrawRecords: '/withdraw/records',
    team: '/team',
    ranking: '/ranking',
    announcements: '/announcements',
    announcementDetail: '/announcements/:id',
} as const

export type RoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH]
