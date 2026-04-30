import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { Badge, RewardsSummary } from '../../mock/db'

const TABS = ['badges', 'tiers', 'activity'] as const

export function Rewards() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('badges')
  const { data: rewards } = useEndpoint<RewardsSummary>('api.rewards.summary')
  const { data: badges } = useEndpoint<{ items: Badge[] }>('api.rewards.badges')
  const claim = useEndpointMutation('api.rewards.claim-daily', { invalidates: ['api.rewards.summary'] })

  if (!rewards) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">Loading…</div></div></PhoneShell>

  // Defensive defaults — production rewards summary may omit fields.
  const tier = rewards.tier || 'bronze'
  const nextTier = (rewards as any).nextTier || 'silver'
  const xp = Number(rewards.xp ?? 0) || 0
  const nextTierXp = Number(rewards.nextTierXp ?? 0) || 500
  const badgesEarned = Number(rewards.badges ?? 0) || 0
  const badgesTotal = Number(rewards.badgesTotal ?? 0) || 0
  const pct = nextTierXp > 0 ? Math.min(100, (xp / nextTierXp) * 100) : 0
  const xpToNext = Math.max(0, nextTierXp - xp)

  return (
    <PhoneShell noTabs>
      <h2>🎖 {t('rewards.title')}</h2>
      <div className="t2">{t('rewards.subtitle')}</div>

      <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(212,165,60,.08), rgba(0,200,83,.04))' }}>
        <div className="stats" style={{ margin: 0 }}>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v gld" style={{ fontSize: 18 }}>{xp.toLocaleString()}</div><div className="stat-l">{t('rewards.totalXp')} ✨</div></div>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v" style={{ fontSize: 14 }}>{badgesEarned} / {badgesTotal}</div><div className="stat-l">{t('rewards.badges')} 🎖</div></div>
          <div className="stat" style={{ background: 'transparent' }}><div className="stat-v gld" style={{ fontSize: 14 }}>{capitalize(tier)}</div><div className="stat-l">{t('rewards.tier')}</div></div>
        </div>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="t3">Next: <span className="gld">{capitalize(nextTier)} 🥈</span></div>
          <div className="grn" style={{ fontSize: 14, fontWeight: 700 }}>{t('rewards.xpAway', { amount: xpToNext.toLocaleString() })}</div>
        </div>
        <div className="bar"><div className="fl" style={{ width: `${pct}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', marginTop: 2 }}>
          <span>{capitalize(tier)} · {xp.toLocaleString()} XP</span>
          <span>{capitalize(nextTier)} · {nextTierXp.toLocaleString()} XP</span>
        </div>
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

      {tab === 'badges' && badges?.items?.map(b => {
        const done = b.userId !== null
        return (
          <div key={b.id} className="li">
            <div className="li-i" style={{ background: done ? 'rgba(0,200,83,.1)' : 'var(--surface-soft)' }}>
              <Icon name={done ? 'check' : 'star'} size={14} color={done ? 'var(--gl)' : 'var(--text-mid-30)'} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {b.title} <span className={`badge badge-${b.rarity === 'RARE' ? 'gd' : b.rarity === 'EPIC' ? 'r' : b.rarity === 'UNCOMMON' ? 'g' : ''}`} style={{ fontSize: 8 }}>{b.rarity}</span>
              </div>
              <div className="li-s">{done ? `Earned ${new Date(b.earnedAt!).toLocaleDateString()}` : b.progress}</div>
            </div>
            <div className="li-r"><span className="grn" style={{ fontSize: 13, fontWeight: 700 }}>{b.xp}</span></div>
          </div>
        )
      })}
    </PhoneShell>
  )
}

function capitalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
