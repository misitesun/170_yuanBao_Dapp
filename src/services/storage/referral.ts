import { readLocalStorage, writeLocalStorage } from './localStorage.ts'

// Project-owned referral survives token invalidation and wallet account changes, as in HU_CHAIN.
const REFERRAL_KEY = 'YUANBAO_REFERRAL_CODE'
export function getReferralCode(): string { return readLocalStorage(REFERRAL_KEY) }
export function setReferralCode(value: string): void { writeLocalStorage(REFERRAL_KEY, value.trim()) }
