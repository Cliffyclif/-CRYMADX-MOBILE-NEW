import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { useRewardsSummary } from '../../lib/useRewardsSummary'

const TABS = ['badges', 'tiers', 'activity'] as const

export function Rewards() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('badges')
  // Tier/XP are derived client-side from the same activity feeds the website
  // uses (see useRewardsSummary) so app and web stay in sync.
  const { data: summary, isLoading } = useRewardsSummary()
  const claim = useEndpointMutation('api.rewards.claim-daily', { invalidates: ['api.tx.list'] })

  if (isLoading) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">Loading…</div></div></PhoneShell>

  // Tier headline + progress come from the CANONICAL volume tier (single source
  // of truth, shared with the website). XP + badges stay the gamification layer.
  const c = summary.canonical
  const tierName = c.tier.name
  const nextName = c.nextTier?.name ?? null
  const xp = summary.totalXP
  const badgesEarned = summary.badgesEarned
  const badgesTotal = summary.totalBadges
  const pct = c.progress
  const fmtUsd = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${Math.round(n)}`

  return (
    <PhoneShell noTabs>
      <h2>🎖 {t('rewards.title')}</h2>
      <div className="t2">{t('rewards.subtitle')}</div>

      <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(212,165,60,.08), rgba(0,200,83,.04))' }}>
        <div className="stats" style={{ margin: 0 }}>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v gld" style={{ fontSize: 18 }}>{xp.toLocaleString()}</div><div className="stat-l">{t('rewards.totalXp')} ✨</div></div>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v" style={{ fontSize: 14 }}>{badgesEarned} / {badgesTotal}</div><div className="stat-l">{t('rewards.badges')} 🎖</div></div>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v gld" style={{ fontSize: 14 }}>{c.tier.emoji} {tierName}</div><div className="stat-l">{t('rewards.tier')}</div></div>
        </div>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 6 }}>
        {nextName ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div className="t3">Next: <span className="gld">{c.nextTier!.emoji} {nextName}</span></div>
              <div className="grn" style={{ fontSize: 14, fontWeight: 700 }}>{fmtUsd(c.volumeToNext)} away ↑</div>
            </div>
            <div className="bar"><div className="fl" style={{ width: `${pct}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', marginTop: 2 }}>
              <span>{tierName} · {fmtUsd(c.totalVolumeUsd)} vol</span>
              <span>{nextName} · {fmtUsd(c.nextTier!.minVolume)} vol</span>
            </div>
          </>
        ) : (
          <div className="t3" style={{ textAlign: 'center' }}>👑 {tierName} — top tier reached</div>
        )}
      </div>

      <h3 style={{ marginTop: 8 }}>{t('rewards.dailyQuests')}</h3>
      {[
        ['Make a trade',          '+15 XP', '75% complete · 1 of 4', 'g' ],
        ['Refer a friend',        '+50 XP', '0 of 1',                '-' ],
        ['Stake 24 hours',        '+25 XP', 'Done ✓',                'g' ],
        ['Open the app',          '+5 XP',  'Done ✓',                'g' ],
      ].map(([t, xp, p, c], i) => (
        <button key={i} onClick={() => claim.mutate({})} className="li" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <div className="li-i" style={{ background: c === 'g' ? 'rgba(0,200,83,.06)' : 'var(--surface-soft)' }}>
            <Icon name={c === 'g' ? 'check' : 'target'} size={14} />
          </div>
          <div className="li-c">
            <div className="li-n">{t}</div>
            <div className="li-s">{p}</div>
          </div>
          <div className="li-r"><div className="grn" style={{ fontSize: 14, fontWeight: 700 }}>{xp}</div></div>
        </button>
      ))}

      <div className="tabs" style={{ marginTop: 8 }}>
        <button className={`tab ${tab === 'badges' ? 'a' : ''}`} onClick={() => setTab('badges')}>🎖 Badges</button>
        <button className={`tab ${tab === 'tiers' ? 'a' : ''}`}  onClick={() => nav(ROUTES['route.engage.tier'].path)}>🏆 Tier Status</button>
        <button className={`tab ${tab === 'activity' ? 'a' : ''}`} onClick={() => setTab('activity')}>📋 Activity Log</button>
      </div>

      {tab === 'badges' && summary.progress.map(p => {
        const done = p.earned
        return (
          <div key={p.badge.id} className="li">
            <div className="li-i" style={{ background: done ? 'rgba(0,200,83,.1)' : 'var(--surface-soft)' }}>
              <span style={{ fontSize: 16, filter: done ? 'none' : 'grayscale(1)', opacity: done ? 1 : 0.45 }}>{p.badge.emoji}</span>
            </div>
            <div className="li-c">
              <div className="li-n">{p.badge.name}</div>
              <div className="li-s">{done ? 'Earned ✓' : `${p.current.toLocaleString()} / ${p.badge.target.toLocaleString()} · ${p.percentComplete}%`}</div>
            </div>
            <div className="li-r"><span className="grn" style={{ fontSize: 13, fontWeight: 700 }}>+{p.badge.xpReward} XP</span></div>
          </div>
        )
      })}
    </PhoneShell>
  )
}
