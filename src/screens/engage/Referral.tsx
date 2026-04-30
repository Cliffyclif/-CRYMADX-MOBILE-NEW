import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { haptics } from '../../lib/haptics'

interface CodeResponse { referralCode: string; referralLink?: string }
interface InfoResponse {
  referrerRewardPercent?: number
  refereeRewardPercent?: number
  minTradeVolume?: string | number
  maxRewardPerReferral?: string | number
  rewardToken?: string
  enabled?: boolean
}
interface StatsResponse {
  totalReferrals?: number
  activeReferrals?: number
  totalEarned?: string
  totalVolume?: string
}
interface ReferralRow {
  id: string
  email?: string
  username?: string
  status?: 'pending' | 'active' | 'qualified' | 'inactive'
  joinedAt?: string
  totalRewards?: string
  totalVolume?: string
}
interface RewardsResponse {
  rewards?: { total?: string; pending?: string; paid?: string }
  history?: Array<{
    amount: string
    source?: string
    status: 'pending' | 'paid'
    createdAt: string
    referredEmail?: string
  }>
}

type Tab = 'overview' | 'referrals' | 'payouts'

export function Referral() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')
  const [shareOpen, setShareOpen] = useState(false)

  const { data: code }      = useEndpoint<CodeResponse>('api.referral.code')
  const { data: info }      = useEndpoint<InfoResponse>('api.referral.info')
  const { data: stats }     = useEndpoint<StatsResponse>('api.referral.stats',     {}, { refetchInterval: 30_000 })
  const { data: refsRes }   = useEndpoint<{ referrals?: ReferralRow[]; total?: number }>('api.referral.referrals')
  const { data: rewardsRes } = useEndpoint<RewardsResponse>('api.referral.rewards')

  const referralCode = code?.referralCode ?? ''
  // Always rebuild link client-side so it points at THIS deployment, not
  // whatever the backend hardcoded. Falls back to the host the user is on.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mobile.crymadx.io'
  const referralLink = referralCode ? `${origin}/register?ref=${referralCode}` : ''

  const totalRefs    = stats?.totalReferrals ?? refsRes?.total ?? (refsRes?.referrals?.length ?? 0)
  const activeRefs   = stats?.activeReferrals ?? (refsRes?.referrals ?? []).filter(r => r.status === 'active').length
  const totalEarned  = rewardsRes?.rewards?.total ?? stats?.totalEarned ?? '0'
  const pendingEarn  = rewardsRes?.rewards?.pending ?? '0'
  const commissionPct = info?.referrerRewardPercent != null ? `${info.referrerRewardPercent}%` : '—'
  const rewardToken  = info?.rewardToken ?? 'USDT'

  const referrals = refsRes?.referrals ?? []
  const payouts   = rewardsRes?.history ?? []

  const subtitle = useMemo(() => {
    if (info?.referrerRewardPercent != null) {
      return `Earn ${info.referrerRewardPercent}% commission on every trade your referrals make.`
    }
    return 'Invite friends, earn commission on every trade they make.'
  }, [info?.referrerRewardPercent])

  const copy = async (text: string, label = 'Copied') => {
    if (!text) return
    haptics.selection()
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error('Could not copy')
    }
  }

  const nativeShare = async () => {
    if (!referralLink) return
    haptics.medium()
    const text = `Join me on CrymadX with my referral code ${referralCode} — $${totalEarned} ${rewardToken} earned so far.`
    const nav: any = navigator
    if (typeof nav?.share === 'function') {
      try { await nav.share({ title: 'CrymadX', text, url: referralLink }) } catch { /* user cancelled */ }
    } else {
      setShareOpen(true)
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('referral.title')} actions={
        referralLink ? (
          <button onClick={() => setShareOpen(true)} className="badge badge-g" style={{ padding: '4px 10px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="share" size={11} color="#fff" /> Share
          </button>
        ) : null
      } />

      {/* Hero — gradient card with subtitle + commission */}
      <div className="g" style={{ padding: 16, textAlign: 'center', background: 'linear-gradient(135deg, rgba(27,140,62,.16), rgba(0,200,83,.04))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 36 }}>🎁</div>
        <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 800, marginTop: 4 }}>
          {commissionPct} commission
        </div>
        <div className="t2" style={{ marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>
        {info?.minTradeVolume != null && (
          <div className="t3" style={{ marginTop: 6, fontSize: 11 }}>
            Min trade volume: ${parseFloat(String(info.minTradeVolume)).toFixed(0)}
          </div>
        )}
      </div>

      {/* Stats grid (2x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        <StatCard label="Total Referrals" value={String(totalRefs)} />
        <StatCard label="Active" value={String(activeRefs)} accent="grn" />
        <StatCard label="Total Earned" value={`$${totalEarned}`} accent="grn" />
        <StatCard label="Pending" value={`$${pendingEarn}`} accent="gld" />
      </div>

      {/* Referral link card */}
      <h3 style={{ marginTop: 12 }}>Your referral link</h3>
      <div className="g" style={{ padding: 12 }}>
        <div className="t3">Code</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ flex: 1, fontSize: 18, color: 'var(--text-strong)', fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace' }}>
            {referralCode || '—'}
          </div>
          <button
            onClick={() => copy(referralCode, 'Code copied')}
            disabled={!referralCode}
            className="badge"
            style={{ background: 'rgba(0,200,83,.12)', border: '1px solid rgba(0,200,83,.3)', cursor: referralCode ? 'pointer' : 'not-allowed', padding: '6px 10px', fontSize: 11, color: 'var(--gl)', display: 'flex', alignItems: 'center', gap: 4, opacity: referralCode ? 1 : 0.5 }}
          >
            <Icon name="copy" size={11} color="var(--gl)" /> Copy
          </button>
        </div>

        <div className="t3" style={{ marginTop: 10 }}>Link</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '8px 10px', background: 'var(--surface-soft)', border: '1px solid var(--divider-soft)', borderRadius: 8 }}>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-strong)' }}>
            {referralLink || '—'}
          </div>
          <button
            onClick={() => copy(referralLink, 'Link copied')}
            disabled={!referralLink}
            style={{ background: 'none', border: 'none', cursor: referralLink ? 'pointer' : 'not-allowed', display: 'flex', padding: 4, opacity: referralLink ? 1 : 0.5 }}
          >
            <Icon name="copy" size={14} color="var(--gl)" />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={nativeShare} disabled={!referralLink} className="btn btn-g" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }}>
            <Icon name="share" size={12} color="#fff" /> Share
          </button>
          <button onClick={() => setShareOpen(true)} disabled={!referralLink} className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }}>
            More options
          </button>
        </div>
      </div>

      {/* How it works (stays static) */}
      <h3 style={{ marginTop: 12 }}>How it works</h3>
      <div className="g" style={{ padding: 10 }}>
        {[
          ['1', 'Share your link', 'Send your referral link to friends'],
          ['2', 'They sign up', 'Friend creates an account using your code'],
          ['3', 'They trade', 'Friend completes their first trade'],
          ['4', `Earn ${commissionPct}`, `You earn ${commissionPct} commission on every trade they make`],
        ].map(([n, title, desc]) => (
          <div key={n} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: 'rgba(0,200,83,.12)', color: 'var(--gl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              {n}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{title}</div>
              <div className="t3">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabbed details */}
      <div className="tabs" style={{ marginTop: 14, fontSize: 12 }}>
        <button className={`tab ${tab === 'overview' ? 'a' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'referrals' ? 'a' : ''}`} onClick={() => setTab('referrals')}>My Referrals ({totalRefs})</button>
        <button className={`tab ${tab === 'payouts' ? 'a' : ''}`} onClick={() => setTab('payouts')}>Payouts ({payouts.length})</button>
      </div>

      {tab === 'overview' && (
        <div className="g" style={{ padding: 12, marginTop: 4 }}>
          {[
            ['Commission rate', commissionPct],
            ['Total volume traded by your referrals', `$${stats?.totalVolume ?? '0'}`],
            ['Reward token', rewardToken],
            ['Min trade volume to qualify', info?.minTradeVolume != null ? `$${info.minTradeVolume}` : '—'],
            ['Max reward per referral', info?.maxRewardPerReferral != null ? `$${info.maxRewardPerReferral}` : 'Unlimited'],
            ['Program status', info?.enabled === false ? 'Paused' : 'Active'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--divider-soft)' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'referrals' && (
        referrals.length === 0 ? (
          <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 28 }}>👋</div>
            <div className="t2" style={{ marginTop: 4 }}>No referrals yet</div>
            <div className="t3" style={{ marginTop: 4 }}>Share your link to start earning {commissionPct} on every trade.</div>
          </div>
        ) : referrals.map(r => {
          const handle = r.email ? r.email.replace(/(.{3}).*(@.*)/, '$1***$2') : (r.username || '?')
          const initial = (handle.charAt(0) || '?').toUpperCase()
          const statusColor = r.status === 'active' ? 'var(--gl)' : r.status === 'qualified' ? 'var(--gd)' : 'var(--text-mid-40)'
          const statusBg = r.status === 'active' ? 'rgba(0,200,83,.06)' : 'var(--surface-soft)'
          return (
            <div key={r.id} className="li">
              <div className="li-i" style={{ background: statusBg, width: 30, height: 30 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: statusColor }}>{initial}</div>
              </div>
              <div className="li-c">
                <div className="li-n" style={{ fontSize: 13 }}>{handle}</div>
                <div className="li-s">
                  {r.status ?? 'pending'} · {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : 'pending join'}
                </div>
              </div>
              <div className="li-r">
                <div className="li-v grn" style={{ fontSize: 13 }}>${r.totalRewards ?? '0'}</div>
                {r.totalVolume && <div className="li-d" style={{ fontSize: 10, color: 'var(--text-mid-30)' }}>vol ${r.totalVolume}</div>}
              </div>
            </div>
          )
        })
      )}

      {tab === 'payouts' && (
        payouts.length === 0 ? (
          <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 4 }}>
            <div className="t3">No payouts yet — they'll appear here when your referrals start trading.</div>
          </div>
        ) : payouts.map((p, i) => (
          <div key={i} className="li">
            <div className="li-i" style={{ background: p.status === 'paid' ? 'rgba(0,200,83,.08)' : 'rgba(212,165,60,.08)', width: 30, height: 30 }}>
              <Icon name={p.status === 'paid' ? 'check' : 'clock'} size={14} color={p.status === 'paid' ? 'var(--gl)' : 'var(--gd)'} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 13 }}>+${p.amount} {rewardToken}</div>
              <div className="li-s">
                {p.source ?? 'Trading commission'} · {new Date(p.createdAt).toLocaleDateString()}
                {p.referredEmail ? ` · from ${p.referredEmail.replace(/(.{3}).*(@.*)/, '$1***$2')}` : ''}
              </div>
            </div>
            <div className="li-r">
              <span className={`badge badge-${p.status === 'paid' ? 'g' : 'gd'}`} style={{ fontSize: 9 }}>
                {p.status}
              </span>
            </div>
          </div>
        ))
      )}

      {shareOpen && referralLink && (
        <ShareSheet
          link={referralLink}
          code={referralCode}
          onClose={() => setShareOpen(false)}
          onCopyLink={() => copy(referralLink, 'Link copied')}
          onCopyCode={() => copy(referralCode, 'Code copied')}
        />
      )}
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'grn' | 'gld' }) {
  return (
    <div className="g" style={{ padding: 10, textAlign: 'center' }}>
      <div className={accent ?? ''} style={{ fontSize: 18, fontWeight: 800, color: accent === 'grn' ? 'var(--gl)' : accent === 'gld' ? 'var(--gd)' : 'var(--text-strong)' }}>{value}</div>
      <div className="t3" style={{ fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function ShareSheet({ link, code, onClose, onCopyLink, onCopyCode }: {
  link: string
  code: string
  onClose: () => void
  onCopyLink: () => void
  onCopyCode: () => void
}) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  const text = `Join me on CrymadX with my referral code ${code}: ${link}`
  const enc = encodeURIComponent(text)
  const encLink = encodeURIComponent(link)
  const items = [
    { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', href: `https://wa.me/?text=${enc}` },
    { id: 'telegram', label: 'Telegram', emoji: '✈️', href: `https://t.me/share/url?url=${encLink}&text=${enc}` },
    { id: 'twitter',  label: 'X / Twitter', emoji: '𝕏', href: `https://twitter.com/intent/tweet?text=${enc}` },
    { id: 'facebook', label: 'Facebook', emoji: 'f', href: `https://www.facebook.com/sharer/sharer.php?u=${encLink}` },
    { id: 'reddit',   label: 'Reddit', emoji: '🅡', href: `https://reddit.com/submit?url=${encLink}&title=${encodeURIComponent('Join me on CrymadX')}` },
    { id: 'email',    label: 'Email',  emoji: '✉️', href: `mailto:?subject=${encodeURIComponent('Join me on CrymadX')}&body=${enc}` },
  ]
  const open = (href: string) => {
    haptics.selection()
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      role="dialog" aria-modal="true" data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 6px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ flex: 1, margin: 0 }}>Share your referral</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {items.map(it => (
            <button
              key={it.id}
              onClick={() => open(it.href)}
              style={{
                background: 'var(--surface-soft)',
                border: '1px solid var(--divider)',
                borderRadius: 12,
                padding: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 22 }}>{it.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--text-strong)' }}>{it.label}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onCopyCode} className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }}>
            <Icon name="copy" size={12} /> Copy code
          </button>
          <button onClick={onCopyLink} className="btn btn-g" style={{ flex: 2, padding: 10, margin: 0, fontSize: 13 }}>
            <Icon name="copy" size={12} color="#fff" /> Copy link
          </button>
        </div>
      </div>
    </div>
  )
}
