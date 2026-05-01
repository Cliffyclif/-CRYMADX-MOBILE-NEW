import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CardFace } from '../../components/CardFace'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'

/**
 * CardHub — the live UI is built (CardFace, top-up, transactions, settings)
 * but the card programme isn't open to users yet, so this route shows a
 * "Coming Soon" screen with a notify-me CTA. Flip the COMING_SOON flag to
 * false (or delete this top block) to bring the live hub back.
 */
const COMING_SOON = true

const NOTIFY_KEY = 'crymadx.card.notify_optin'

export function CardHub() {
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const [optedIn, setOptedIn] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(NOTIFY_KEY) === '1'
  })

  if (!COMING_SOON) {
    // Live hub re-enable point — see git history for the full impl.
    return null
  }

  const notify = () => {
    try { localStorage.setItem(NOTIFY_KEY, '1') } catch {}
    setOptedIn(true)
    toast.success("You're on the list — we'll email you the moment cards go live.")
  }

  const previewName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim().toUpperCase() || 'CRYMADX MEMBER'
    : 'CRYMADX MEMBER'

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title="CrymadX Card" />

      {/* Hero: card preview + soft glow */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 18,
          paddingBottom: 6,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '0 -10% 10% -10%',
            background:
              'radial-gradient(circle at 50% 60%, rgba(0,200,83,.18), transparent 60%)',
            filter: 'blur(20px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            transform: 'rotate(-4deg)',
            transition: 'transform .3s',
          }}
        >
          <CardFace last4="0000" cardholderName={previewName} size="medium" />
        </div>
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 18,
            fontSize: 9,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(255,193,7,.18)',
            color: 'var(--gd)',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,193,7,.35)',
            zIndex: 2,
          }}
        >
          Coming Soon
        </span>
      </div>

      {/* Headline */}
      <div style={{ textAlign: 'center', padding: '14px 12px 4px' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-strong)' }}>
          Spend your crypto anywhere
        </h2>
        <div
          className="t3"
          style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, maxWidth: 320, margin: '8px auto 0' }}
        >
          A virtual card backed by your CrymadX balance — top up in any token,
          spend in dollars worldwide. We're putting the finishing touches on
          the rollout.
        </div>
      </div>

      {/* Feature bullets */}
      <div className="g" style={{ padding: 14, marginTop: 14 }}>
        {[
          ['zap', 'Instant top-up', 'Convert any token into card balance with one tap'],
          ['globe', 'Spend worldwide', 'Apple Pay, Google Pay, online and in store'],
          ['shield', 'Freeze in seconds', 'Lock the card from the app the moment something looks off'],
          ['bell', 'Real-time alerts', 'Push notifications for every transaction'],
        ].map(([icon, title, body]) => (
          <div
            key={title}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '8px 0',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(0,200,83,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={icon as any} size={16} color="var(--gl)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{title}</div>
              <div className="t3" style={{ fontSize: 12, marginTop: 2 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {optedIn ? (
        <div
          className="g"
          style={{
            padding: 14,
            marginTop: 14,
            borderLeft: '3px solid var(--gl)',
            background: 'rgba(0,200,83,.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Icon name="check" size={18} color="var(--gl)" />
          <div className="t3" style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
            You're on the early access list. We'll email{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{user?.email ?? 'you'}</strong>{' '}
            the moment cards go live.
          </div>
        </div>
      ) : (
        <button
          className="btn btn-g"
          style={{ marginTop: 14 }}
          onClick={notify}
        >
          <Icon name="bell" size={14} color="#fff" />
          Notify me when cards launch
        </button>
      )}

      <button
        className="btn btn-o"
        style={{ marginTop: 8 }}
        onClick={() => nav(ROUTES['route.tab.wallet'].path)}
      >
        Back to wallet
      </button>
    </PhoneShell>
  )
}
