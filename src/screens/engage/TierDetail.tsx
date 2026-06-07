import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint } from '../../api/hooks'
import { useRewardsSummary } from '../../lib/useRewardsSummary'
import { VOLUME_TIERS } from '../../lib/badges'

export function TierDetail() {
  const { t } = useTranslation()
  const { data: summary } = useRewardsSummary()
  const { data: tiers } = useEndpoint<{ items: Array<{ name: string; emoji: string; range: string; perks: string }> }>('api.rewards.tiers')

  // Canonical (volume-based) tier — same source the website uses.
  const c = summary.canonical
  const cur = c.tier.id
  const fmtUsd = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${Math.round(n)}`

  // Prefer the backend tier catalog (perks/range copy); fall back to the volume
  // tiers so the list + current-tier highlight always render correctly.
  const tierList = (tiers?.items && tiers.items.length)
    ? tiers.items
    : VOLUME_TIERS.map(ti => ({
        name: ti.name,
        emoji: ti.emoji,
        range: ti.minVolume === 0 ? '$0+ volume' : `${fmtUsd(ti.minVolume)}+ volume`,
        perks: '',
      }))

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('rewards.tiersTitle')} />

      <div className="g" style={{ padding: 14, textAlign: 'center', background: 'linear-gradient(135deg, rgba(212,165,60,.1), rgba(0,200,83,.04))' }}>
        <div style={{ fontSize: 42 }}>{c.tier.emoji}</div>
        <h2 style={{ marginTop: 4 }}>{c.tier.name}</h2>
        <div className="t2">{fmtUsd(c.totalVolumeUsd)} total volume</div>
        <div className="bar" style={{ marginTop: 8 }}><div className="fl" style={{ width: `${c.progress}%` }} /></div>
        {c.nextTier && (
          <div className="grn" style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{fmtUsd(c.volumeToNext)} more to {c.nextTier.name}</div>
        )}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('rewards.allTiers')}</h3>
      {tierList.map(tier => {
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
