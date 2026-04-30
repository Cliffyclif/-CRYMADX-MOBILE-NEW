import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint } from '../../api/hooks'
import type { RewardsSummary } from '../../mock/db'

export function TierDetail() {
  const { t } = useTranslation()
  const { data: rewards } = useEndpoint<RewardsSummary>('api.rewards.summary')
  const { data: tiers } = useEndpoint<{ items: Array<{ name: string; emoji: string; range: string; perks: string }> }>('api.rewards.tiers')

  const cur = rewards?.tier ?? 'bronze'
  const xp = Number(rewards?.xp ?? 0) || 0
  const nextXp = Number(rewards?.nextTierXp ?? 500) || 500
  const nextTier = (rewards as any)?.nextTier ?? 'Silver'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('rewards.tiersTitle')} />

      <div className="g" style={{ padding: 14, textAlign: 'center', background: 'linear-gradient(135deg, rgba(212,165,60,.1), rgba(0,200,83,.04))' }}>
        <div style={{ fontSize: 42 }}>🥉</div>
        <h2 style={{ marginTop: 4 }}>{t('rewards.tierBronze')}</h2>
        <div className="t2">{t('rewards.xpProgress', { current: xp, total: nextXp })}</div>
        <div className="bar" style={{ marginTop: 8 }}><div className="fl" style={{ width: `${nextXp > 0 ? (xp / nextXp) * 100 : 0}%` }} /></div>
        <div className="grn" style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{t('rewards.xpToNext', { xp: Math.max(0, nextXp - xp), tier: nextTier })}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('rewards.allTiers')}</h3>
      {tiers?.items?.map(tier => {
        const isCurrent = tier.name.toLowerCase() === cur
        return (
          <div key={tier.name} className="g" style={{ padding: 12, margin: '4px 0', borderLeft: isCurrent ? '3px solid var(--gd)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 24 }}>{tier.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, color: 'var(--text-strong)', fontWeight: 800 }}>
                  {tier.name} {isCurrent && <span className="badge badge-gd" style={{ fontSize: 8, marginLeft: 4 }}>{t('rewards.current')}</span>}
                </div>
                <div className="t3">{tier.range}</div>
              </div>
            </div>
            <div className="t3" style={{ marginTop: 6, lineHeight: 1.4 }}>{tier.perks}</div>
          </div>
        )
      })}

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">💡</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="grn">{t('rewards.earnXpFaster')}</span> {t('rewards.earnXpHow')}
        </div>
      </div>
    </PhoneShell>
  )
}
