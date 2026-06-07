// Badge / XP / tier model — a faithful port of the web exchange's
// src/config/badges.ts + the badge-earning logic in src/services/badgeService.ts.
// The website computes a user's tier CLIENT-SIDE from raw activity feeds
// (orders, swaps, deposits, staking, KYC, referrals, volume); the backend
// /rewards endpoint does NOT return an authoritative tier. To keep the mobile
// app in sync with the website we run the SAME computation over the SAME feeds.
// Keep TIERS / BADGES / XP values identical to the website or the two drift.

export interface TierDefinition {
  id: string
  name: string
  minXP: number
  emoji: string
}

export const TIERS: TierDefinition[] = [
  { id: 'bronze',   name: 'Bronze',   minXP: 0,     emoji: '🥉' },
  { id: 'silver',   name: 'Silver',   minXP: 500,   emoji: '🥈' },
  { id: 'gold',     name: 'Gold',     minXP: 2000,  emoji: '🥇' },
  { id: 'platinum', name: 'Platinum', minXP: 5000,  emoji: '💎' },
  { id: 'diamond',  name: 'Diamond',  minXP: 12000, emoji: '👑' },
]

// ── Canonical VOLUME-based tier (the single source of truth) ──
// The backend (volume-aggregator → user_metrics) assigns each user a tier from
// lifetime trading volume, exposed via GET /api/referral/tier. This is the tier
// the website displays as the user's tier, so the app must show the SAME thing.
// Thresholds mirror the web exchange's rewardsService DEFAULT_TIERS minVolume.
export interface VolumeTier {
  id: string
  name: string
  minVolume: number
  emoji: string
}

export const VOLUME_TIERS: VolumeTier[] = [
  { id: 'bronze',   name: 'Bronze',   minVolume: 0,       emoji: '🥉' },
  { id: 'silver',   name: 'Silver',   minVolume: 10_000,  emoji: '🥈' },
  { id: 'gold',     name: 'Gold',     minVolume: 50_000,  emoji: '🥇' },
  { id: 'platinum', name: 'Platinum', minVolume: 200_000, emoji: '💎' },
  { id: 'diamond',  name: 'Diamond',  minVolume: 500_000, emoji: '👑' },
]

// Resolve a volume tier by the backend's canonical name (case-insensitive).
export function volumeTierByName(name: string | undefined): VolumeTier {
  const n = (name ?? 'bronze').toLowerCase()
  return VOLUME_TIERS.find(t => t.id === n) ?? VOLUME_TIERS[0]
}

export function nextVolumeTier(current: VolumeTier): VolumeTier | null {
  const idx = VOLUME_TIERS.findIndex(t => t.id === current.id)
  return idx < VOLUME_TIERS.length - 1 ? VOLUME_TIERS[idx + 1] : null
}

// Progress (0–100) within the current volume band.
export function volumeProgress(volume: number, current: VolumeTier, next: VolumeTier | null): number {
  if (!next) return 100
  const range = next.minVolume - current.minVolume
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, Math.round(((volume - current.minVolume) / range) * 100)))
}

export type BadgeCategory = 'trader' | 'volume' | 'depositor' | 'hodler' | 'explorer' | 'community'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  category: BadgeCategory
  target: number
  xpReward: number
  emoji: string
}

const CAT_EMOJI: Record<BadgeCategory, string> = {
  trader: '⚡', volume: '📈', depositor: '💰', hodler: '🔒', explorer: '🧭', community: '🤝',
}

// Same 24 badges / targets / xpReward as the website's BADGES array.
export const BADGES: BadgeDefinition[] = ([
  // Trader
  ['trader_first', 'First Trade', 'Complete your first trade', 'trader', 1, 25],
  ['trader_10', 'Active Trader', 'Complete 10 trades', 'trader', 10, 50],
  ['trader_50', 'Seasoned Trader', 'Complete 50 trades', 'trader', 50, 150],
  ['trader_100', 'Pro Trader', 'Complete 100 trades', 'trader', 100, 300],
  ['trader_500', 'Market Veteran', 'Complete 500 trades', 'trader', 500, 750],
  ['trader_1000', 'Trading Legend', 'Complete 1,000 trades', 'trader', 1000, 2000],
  // Volume
  ['volume_100', 'Getting Started', 'Reach $100 total trading volume', 'volume', 100, 25],
  ['volume_1k', 'Serious Trader', 'Reach $1,000 total trading volume', 'volume', 1000, 100],
  ['volume_10k', 'High Roller', 'Reach $10,000 total trading volume', 'volume', 10000, 300],
  ['volume_50k', 'Market Mover', 'Reach $50,000 total trading volume', 'volume', 50000, 750],
  ['volume_100k', 'Whale Watcher', 'Reach $100,000 total trading volume', 'volume', 100000, 1500],
  ['volume_500k', 'Crypto Whale', 'Reach $500,000 total trading volume', 'volume', 500000, 3000],
  // Depositor
  ['deposit_first', 'First Deposit', 'Make your first deposit', 'depositor', 1, 25],
  ['deposit_10', 'Regular Depositor', 'Make 10 deposits', 'depositor', 10, 100],
  ['deposit_50', 'Committed Investor', 'Make 50 deposits', 'depositor', 50, 300],
  ['deposit_100', 'Funding Machine', 'Make 100 deposits', 'depositor', 100, 750],
  // Hodler
  ['hodl_first_stake', 'Staking Starter', 'Create your first staking position', 'hodler', 1, 50],
  ['hodl_30d', '30-Day Diamond Hands', 'Hold a staking position for 30+ days', 'hodler', 30, 200],
  ['hodl_90d', '90-Day HODLer', 'Hold a staking position for 90+ days', 'hodler', 90, 500],
  // Explorer
  ['explorer_first_swap', 'First Swap', 'Complete your first token swap', 'explorer', 1, 25],
  ['explorer_multichain', 'Multi-Chain Explorer', 'Trade on 3 or more different chains', 'explorer', 3, 300],
  ['explorer_verified', 'Verified Trader', 'Complete KYC verification', 'explorer', 1, 100],
  // Community
  ['community_first_ref', 'First Referral', 'Refer your first friend', 'community', 1, 50],
  ['community_5_refs', 'Social Butterfly', 'Refer 5 friends', 'community', 5, 300],
  ['community_10_refs', 'Community Champion', 'Refer 10 friends', 'community', 10, 750],
] as const).map(([id, name, description, category, target, xpReward]) => ({
  id: id as string,
  name: name as string,
  description: description as string,
  category: category as BadgeCategory,
  target: target as number,
  xpReward: xpReward as number,
  emoji: CAT_EMOJI[category as BadgeCategory],
}))

// Raw activity the badges are computed from — mirrors the website's RawActivity.
export interface RawActivity {
  tradeCount: number
  tradingVolume: number
  depositCount: number
  stakingPositions: number
  longestStakeDays: number
  swapCount: number
  uniqueChains: number
  kycApproved: boolean
  referralCount: number
}

// Map a badge to its current progress value — identical switch to the website's
// getProgressValue().
export function getProgressValue(badge: BadgeDefinition, a: RawActivity): number {
  switch (badge.category) {
    case 'trader': return a.tradeCount
    case 'volume': return a.tradingVolume
    case 'depositor': return a.depositCount
    case 'hodler':
      return badge.id === 'hodl_first_stake' ? a.stakingPositions : a.longestStakeDays
    case 'explorer':
      if (badge.id === 'explorer_first_swap') return a.swapCount
      if (badge.id === 'explorer_multichain') return a.uniqueChains
      return a.kycApproved ? 1 : 0 // explorer_verified
    case 'community': return a.referralCount
    default: return 0
  }
}

export interface BadgeProgress {
  badge: BadgeDefinition
  current: number
  earned: boolean
  percentComplete: number
}

export interface RewardsSummary {
  totalXP: number
  badgesEarned: number
  totalBadges: number
  currentTier: TierDefinition
  nextTier: TierDefinition | null
  tierProgress: number   // 0–100 within the current tier band
  xpToNextTier: number
  progress: BadgeProgress[]
}

export function getCurrentTier(totalXP: number): TierDefinition {
  const sorted = [...TIERS].sort((a, b) => b.minXP - a.minXP)
  return sorted.find(t => totalXP >= t.minXP) || TIERS[0]
}

export function getNextTier(totalXP: number): TierDefinition | null {
  const current = getCurrentTier(totalXP)
  const idx = TIERS.findIndex(t => t.id === current.id)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

export function getTierProgress(totalXP: number): number {
  const current = getCurrentTier(totalXP)
  const next = getNextTier(totalXP)
  if (!next) return 100
  const range = next.minXP - current.minXP
  const progress = totalXP - current.minXP
  return Math.min(100, Math.round((progress / range) * 100))
}

// Compute the full summary from raw activity — mirrors badgeService.getSummary().
export function computeRewardsSummary(activity: RawActivity): RewardsSummary {
  const progress: BadgeProgress[] = BADGES.map(badge => {
    const current = getProgressValue(badge, activity)
    const earned = current >= badge.target
    return {
      badge,
      current: Math.min(current, badge.target),
      earned,
      percentComplete: Math.min(100, Math.round((current / badge.target) * 100)),
    }
  })
  const totalXP = progress.filter(p => p.earned).reduce((s, p) => s + p.badge.xpReward, 0)
  const currentTier = getCurrentTier(totalXP)
  const nextTier = getNextTier(totalXP)
  return {
    totalXP,
    badgesEarned: progress.filter(p => p.earned).length,
    totalBadges: BADGES.length,
    currentTier,
    nextTier,
    tierProgress: getTierProgress(totalXP),
    xpToNextTier: nextTier ? Math.max(0, nextTier.minXP - totalXP) : 0,
    progress,
  }
}
