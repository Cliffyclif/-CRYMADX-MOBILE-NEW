import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
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

// Tier+commission system (volume-aggregator schema)
interface TierResponse {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  total_volume_usd: number
  lifetime_revenue_usd: number
  tier_achieved_at: string | null
  last_event_at: string | null
}
interface EarningsSummary {
  lifetime_earned_usd: number
  available_usd: number
  accruing_usd: number
  requested_usd: number
  paid_usd: number
}
type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled'
interface CommissionPayout {
  id: string
  total_amount_usd: string
  payout_chain: string
  payout_token: string
  payout_address: string
  status: PayoutStatus
  tx_hash?: string | null
  requested_at: string
  reviewed_at?: string | null
  paid_at?: string | null
  notes?: string | null
}

type Tab = 'overview' | 'referrals' | 'payouts'

export function Referral() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')
  const [shareOpen, setShareOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)

  const { data: code }      = useEndpoint<CodeResponse>('api.referral.code')
  const { data: info }      = useEndpoint<InfoResponse>('api.referral.info')
  const { data: stats }     = useEndpoint<StatsResponse>('api.referral.stats',     {}, { refetchInterval: 30_000 })
  const { data: refsRes }   = useEndpoint<{ referrals?: ReferralRow[]; total?: number }>('api.referral.referrals')
  const { data: rewardsRes } = useEndpoint<RewardsResponse>('api.referral.rewards')
  // Tier+commission system
  const { data: tierRes } = useEndpoint<TierResponse>('api.referral.tier', {}, { refetchInterval: 60_000 })
  const { data: earningsSummary, refetch: refetchSummary } = useEndpoint<EarningsSummary>(
    'api.referral.earnings.summary', {}, { refetchInterval: 30_000 },
  )
  const { data: commissionPayoutsRes, refetch: refetchPayouts } = useEndpoint<{ payouts?: CommissionPayout[] }>(
    'api.referral.payouts', {}, { refetchInterval: 30_000 },
  )

  const requestPayout = useEndpointMutation<{ body: { chain: string; token: string; toAddress: string } }, { payoutId: string }>(
    'api.referral.payouts.request',
    {
      onSuccess: () => { refetchSummary(); refetchPayouts() },
    },
  )
  const cancelPayout = useEndpointMutation<{ pathParams: { id: string } }, { success: boolean }>(
    'api.referral.payouts.cancel',
    {
      onSuccess: () => { refetchSummary(); refetchPayouts() },
    },
  )

  const referralCode = code?.referralCode ?? ''
  // Prefer the canonical referralLink the backend returns
  // (https://crymadx.io/register?ref=…). The referral programme is tracked
  // centrally on the main site, so links must always point there regardless
  // of which surface generated them. Falls back to the configured public
  // web URL only when the backend doesn't supply a link (legacy responses).
  const PUBLIC_WEB_URL = (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined)
    ?? 'https://crymadx.io'
  const referralLink = code?.referralLink
    ? code.referralLink
    : referralCode
      ? `${PUBLIC_WEB_URL}/register?ref=${referralCode}`
      : ''

  const totalRefs    = stats?.totalReferrals ?? refsRes?.total ?? (refsRes?.referrals?.length ?? 0)
  const activeRefs   = stats?.activeReferrals ?? (refsRes?.referrals ?? []).filter(r => r.status === 'active').length
  const totalEarned  = rewardsRes?.rewards?.total ?? stats?.totalEarned ?? '0'
  const pendingEarn  = rewardsRes?.rewards?.pending ?? '0'
  const commissionPct = info?.referrerRewardPercent != null ? `${info.referrerRewardPercent}%` : '—'
  const rewardToken  = info?.rewardToken ?? 'USDT'

  const referrals = refsRes?.referrals ?? []
  const legacyPayouts = rewardsRes?.history ?? []
  const commissionPayouts = commissionPayoutsRes?.payouts ?? []
  const payoutTabCount = commissionPayouts.length || legacyPayouts.length

  const availableUsd = earningsSummary?.available_usd ?? 0
  const accruingUsd  = earningsSummary?.accruing_usd ?? 0
  const requestedUsd = earningsSummary?.requested_usd ?? 0

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

      {/* Hero — gradient card with commission + subtitle. Kept structurally
          identical to other cards on the page so it can't be squished by a
          flex parent: no overflow:hidden, no position:relative. */}
      <div
        className="g"
        style={{
          padding: '20px 16px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(27,140,62,.16), rgba(0,200,83,.04))',
          marginTop: 4,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: 'rgba(0,200,83,.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Icon name="trophy" size={28} color="var(--gl)" />
        </div>
        <div style={{ fontSize: 24, color: 'var(--text-strong)', fontWeight: 800, lineHeight: 1.2 }}>
          {commissionPct} commission
        </div>
        <div className="t2" style={{ marginTop: 6, lineHeight: 1.4, maxWidth: 320 }}>{subtitle}</div>
        {tierRes && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className={`badge badge-${tierBadgeKind(tierRes.tier)}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px' }}>
              {tierRes.tier} tier
            </span>
            <span className="t3" style={{ fontSize: 10 }}>
              ${(tierRes.total_volume_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} volume
            </span>
          </div>
        )}
        {info?.minTradeVolume != null && (
          <div className="t3" style={{ marginTop: 10, fontSize: 11 }}>
            Min trade volume to qualify: ${parseFloat(String(info.minTradeVolume)).toFixed(0)}
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

      {/* Available-to-withdraw banner — only renders when tier-commission system has earnings.
          accruingUsd shows holdings still inside their 7-day cooldown; requestedUsd shows
          amounts already locked into a pending payout request awaiting admin approval. */}
      {(availableUsd > 0 || accruingUsd > 0 || requestedUsd > 0) && (
        <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(0,200,83,.12), rgba(212,165,60,.04))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="t3" style={{ fontSize: 11 }}>Available to withdraw</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gl)' }}>${availableUsd.toFixed(2)}</div>
            </div>
            <button
              onClick={() => { haptics.medium(); setPayoutOpen(true) }}
              disabled={availableUsd <= 0}
              className="btn btn-g"
              style={{ padding: '10px 16px', fontSize: 13, margin: 0, opacity: availableUsd <= 0 ? 0.5 : 1, cursor: availableUsd <= 0 ? 'not-allowed' : 'pointer' }}
            >
              Request payout
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div className="t3" style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--gd)' }}>Accruing: </span>
              <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>${accruingUsd.toFixed(2)}</span>
            </div>
            {requestedUsd > 0 && (
              <div className="t3" style={{ fontSize: 11 }}>
                <span>Pending approval: </span>
                <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>${requestedUsd.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="t3" style={{ fontSize: 10, marginTop: 6, opacity: 0.75 }}>
            Commissions become available 7 days after they accrue. Payouts are reviewed manually by our team within 24h.
          </div>
        </div>
      )}

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
        <button className={`tab ${tab === 'payouts' ? 'a' : ''}`} onClick={() => setTab('payouts')}>Payouts ({payoutTabCount})</button>
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
        commissionPayouts.length > 0 ? (
          commissionPayouts.map((p) => {
            const statusColor = p.status === 'paid' ? 'var(--gl)'
              : p.status === 'rejected' || p.status === 'cancelled' ? 'var(--text-mid-40)'
              : 'var(--gd)'
            const statusBg = p.status === 'paid' ? 'rgba(0,200,83,.08)'
              : p.status === 'rejected' || p.status === 'cancelled' ? 'var(--surface-soft)'
              : 'rgba(212,165,60,.08)'
            const statusIcon = p.status === 'paid' ? 'check'
              : p.status === 'rejected' || p.status === 'cancelled' ? 'x'
              : 'clock'
            const badgeKind = p.status === 'paid' ? 'g'
              : p.status === 'rejected' || p.status === 'cancelled' ? 'r'
              : 'gd'
            return (
              <div key={p.id} className="li">
                <div className="li-i" style={{ background: statusBg, width: 30, height: 30 }}>
                  <Icon name={statusIcon} size={14} color={statusColor} />
                </div>
                <div className="li-c">
                  <div className="li-n" style={{ fontSize: 13 }}>
                    ${parseFloat(p.total_amount_usd).toFixed(2)} → {p.payout_token} on {p.payout_chain}
                  </div>
                  <div className="li-s">
                    {new Date(p.requested_at).toLocaleDateString()}
                    {p.tx_hash ? ` · tx ${p.tx_hash.slice(0, 8)}…` : ''}
                    {p.notes && p.status === 'rejected' ? ` · ${p.notes}` : ''}
                  </div>
                </div>
                <div className="li-r" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span className={`badge badge-${badgeKind}`} style={{ fontSize: 9 }}>{p.status}</span>
                  {p.status === 'pending' && (
                    <button
                      onClick={async () => {
                        try {
                          await cancelPayout.mutateAsync({ pathParams: { id: p.id } })
                          toast.success('Payout cancelled')
                        } catch (e: any) {
                          toast.error(e?.message || 'Could not cancel')
                        }
                      }}
                      disabled={cancelPayout.isPending}
                      style={{ background: 'none', border: '1px solid var(--divider-soft)', borderRadius: 6, padding: '2px 6px', fontSize: 9, cursor: 'pointer', color: 'var(--text-mid-40)' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : legacyPayouts.length > 0 ? (
          legacyPayouts.map((p, i) => (
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
        ) : (
          <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 4 }}>
            <div className="t3">No payouts yet — they'll appear here when your referrals start trading.</div>
          </div>
        )
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

      {payoutOpen && (
        <RequestPayoutSheet
          availableUsd={availableUsd}
          onClose={() => setPayoutOpen(false)}
          onSubmit={async ({ chain, token, toAddress }) => {
            try {
              await requestPayout.mutateAsync({ body: { chain, token, toAddress } })
              toast.success('Payout requested — admin will review within 24h')
              setPayoutOpen(false)
            } catch (e: any) {
              toast.error(e?.message || 'Could not request payout')
            }
          }}
          isSubmitting={requestPayout.isPending}
        />
      )}
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function RequestPayoutSheet({
  availableUsd,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  availableUsd: number
  onClose: () => void
  onSubmit: (input: { chain: string; token: string; toAddress: string }) => void
  isSubmitting: boolean
}) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  const [chain, setChain] = useState('MATIC')
  const [token, setToken] = useState('USDC')
  const [toAddress, setToAddress] = useState('')

  // Stable-only options — keeps payout amount = USD 1:1, avoids price-volatility surprise
  // and matches the admin approve flow which auto-defaults to amount_usd for stables.
  const chainOptions = ['MATIC', 'ETH', 'BSC', 'SOL', 'TRX']
  const tokenOptions = chain === 'SOL' ? ['USDC'] : chain === 'TRX' ? ['USDT'] : ['USDC', 'USDT']

  const isValid = toAddress.trim().length > 10 && availableUsd > 0

  return (
    <div
      role="dialog" aria-modal="true" data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '85vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
          overflowY: 'auto',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 6px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ flex: 1, margin: 0 }}>Request payout</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="t3" style={{ marginBottom: 12, fontSize: 12 }}>
          Withdraw <strong style={{ color: 'var(--gl)' }}>${availableUsd.toFixed(2)}</strong> in commission earnings to the address you choose.
          Admin reviews each request manually within 24 hours.
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="t3" style={{ fontSize: 11, marginBottom: 6 }}>Network</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chainOptions.map(c => (
              <button
                key={c}
                onClick={() => {
                  setChain(c)
                  // Reset token if not supported on new chain
                  const t = c === 'SOL' ? 'USDC' : c === 'TRX' ? 'USDT' : 'USDC'
                  setToken(t)
                }}
                style={{
                  background: chain === c ? 'var(--gl)' : 'var(--surface-soft)',
                  color: chain === c ? '#fff' : 'var(--text-strong)',
                  border: '1px solid ' + (chain === c ? 'var(--gl)' : 'var(--divider-soft)'),
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="t3" style={{ fontSize: 11, marginBottom: 6 }}>Token</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {tokenOptions.map(tk => (
              <button
                key={tk}
                onClick={() => setToken(tk)}
                style={{
                  background: token === tk ? 'var(--gl)' : 'var(--surface-soft)',
                  color: token === tk ? '#fff' : 'var(--text-strong)',
                  border: '1px solid ' + (token === tk ? 'var(--gl)' : 'var(--divider-soft)'),
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {tk}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="t3" style={{ fontSize: 11, marginBottom: 6 }}>Destination address ({chain})</div>
          <input
            type="text"
            value={toAddress}
            onChange={e => setToAddress(e.target.value)}
            placeholder={chain === 'SOL' ? 'Solana address' : chain === 'TRX' ? 'TRON address (T…)' : '0x… (EVM address)'}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              background: 'var(--surface-soft)',
              border: '1px solid var(--divider-soft)',
              borderRadius: 8,
              color: 'var(--text-strong)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={() => onSubmit({ chain, token, toAddress: toAddress.trim() })}
          disabled={!isValid || isSubmitting}
          className="btn btn-g"
          style={{ width: '100%', padding: 12, margin: 0, fontSize: 14, opacity: !isValid || isSubmitting ? 0.5 : 1, cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Submitting…' : `Request $${availableUsd.toFixed(2)} payout`}
        </button>
        <div className="t3" style={{ fontSize: 10, marginTop: 8, textAlign: 'center', opacity: 0.7 }}>
          Double-check the address — payouts cannot be reversed.
        </div>
      </div>
    </div>
  )
}

function tierBadgeKind(tier: string): 'g' | 'gd' | 'r' | 'b' {
  switch (tier) {
    case 'Diamond':
    case 'Platinum':
      return 'b'
    case 'Gold':
      return 'gd'
    case 'Silver':
      return 'g'
    default:
      return 'gd'
  }
}

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
