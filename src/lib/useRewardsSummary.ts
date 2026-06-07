// Rewards summary — now rendered straight from the BACKEND single source of
// truth (rewards-service /api/rewards/summary, which computes XP + badges + the
// canonical volume tier from authoritative data). The web app reads the same
// endpoint, so the two can never disagree. We only shape the response into the
// RewardsData the screens already consume.
import { useMemo } from 'react'
import { useEndpoint } from '../api/hooks'
import {
  getCurrentTier, getNextTier, getTierProgress,
  volumeTierByName, nextVolumeTier, type BadgeCategory,
  type RewardsSummary, type VolumeTier,
} from './badges'

const CAT_EMOJI: Record<BadgeCategory, string> = {
  trader: '⚡', volume: '📈', depositor: '💰', hodler: '🔒', explorer: '🧭', community: '🤝',
}

export interface CanonicalTier {
  tier: VolumeTier
  nextTier: VolumeTier | null
  totalVolumeUsd: number
  progress: number
  volumeToNext: number
}

export interface RewardsData extends RewardsSummary {
  canonical: CanonicalTier
}

interface BackendBadge {
  id: string; name: string; description: string; category: BadgeCategory
  target: number; current: number; earned: boolean; xpReward: number; percentComplete: number
}

export function useRewardsSummary(): { data: RewardsData; isLoading: boolean } {
  const { data: r, isLoading } = useEndpoint<any>('api.rewards.summary')

  const data = useMemo<RewardsData>(() => {
    const backendBadges: BackendBadge[] = Array.isArray(r?.badges) ? r.badges : []
    const progress = backendBadges.map(b => ({
      badge: {
        id: b.id, name: b.name, description: b.description, category: b.category,
        target: b.target, xpReward: b.xpReward, emoji: CAT_EMOJI[b.category] || '🏅',
      },
      current: b.current,
      earned: b.earned,
      percentComplete: b.percentComplete,
    }))

    const totalXP = Number(r?.totalXP ?? 0) || 0
    const badgesEarned = Number(r?.badgesEarned ?? progress.filter(p => p.earned).length) || 0
    const totalBadges = Number(r?.totalBadges ?? progress.length) || progress.length || 25

    // Badge-XP tier fields (kept for the RewardsSummary shape; screens display the
    // canonical volume tier below, not these).
    const xpCur = getCurrentTier(totalXP)
    const xpNext = getNextTier(totalXP)

    // Canonical VOLUME tier — straight from the backend.
    const cTier = volumeTierByName(r?.currentTier)
    const cNext = nextVolumeTier(cTier)
    const totalVolumeUsd = Number(r?.totalVolumeUsd ?? 0) || 0

    return {
      totalXP,
      badgesEarned,
      totalBadges,
      currentTier: xpCur,
      nextTier: xpNext,
      tierProgress: getTierProgress(totalXP),
      xpToNextTier: xpNext ? Math.max(0, xpNext.minXP - totalXP) : 0,
      progress,
      canonical: {
        tier: cTier,
        nextTier: cNext,
        totalVolumeUsd,
        progress: Number(r?.tierProgress ?? 0) || 0,
        volumeToNext: Number(r?.volumeToNext ?? (cNext ? Math.max(0, cNext.minVolume - totalVolumeUsd) : 0)) || 0,
      },
    }
  }, [r])

  return { data, isLoading }
}
