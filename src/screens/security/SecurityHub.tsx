import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, type RouteId } from '../../routes'
import { useBiometricLock } from '../../hooks/useBiometricLock'
import { useAuth } from '../../stores/auth'

interface SecuritySummary {
  score: number
  twoFAEnabled: boolean
  biometricEnabled?: boolean
  /** Null when backend doesn't track it — the row falls back to generic copy. */
  passwordChangedAt: string | null
  backupCodesGenerated: number
  backupCodesUnused: number
  antiPhishingCode: string
  activeSessions: number
  phone?: string | null
  phoneVerified?: boolean
  kycStatus?: string
  lastLoginAt?: string | null
}

interface Row {
  icon: IconName
  name: string
  desc: string
  rightLabel?: string
  rightTone?: 'g' | 'gd' | 'r'
  routeId?: RouteId
  custom?: React.ReactNode
}

export function SecurityHub() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const isAuthenticated = !!useAuth(s => s.user)
  const biometric = useBiometricLock(isAuthenticated)

  const { data, isLoading, error } = useEndpoint<SecuritySummary>('api.security.summary')

  if (isLoading && !data) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('security.title')} />
        <div className="g" style={{ padding: 24, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('common.loading') || 'Loading…'}</div>
        </div>
      </PhoneShell>
    )
  }

  if (error || !data) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('security.title')} />
        <div
          className="g"
          style={{
            padding: 14,
            marginTop: 8,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.06)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--r)' }}>
            Could not load security summary
          </div>
          <div className="t3" style={{ marginTop: 4 }}>
            {(error as any)?.message ?? 'Try again in a moment.'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <button className="btn btn-o" onClick={() => nav(ROUTES['route.security.2fa'].path)}>
            <Icon name="lock" size={14} /> Manage 2FA
          </button>
          <button className="btn btn-o" onClick={() => nav(ROUTES['route.security.password'].path)}>
            <Icon name="shield" size={14} /> Change password
          </button>
          <button className="btn btn-o" onClick={() => nav(ROUTES['route.security.sessions'].path)}>
            <Icon name="user" size={14} /> Active sessions
          </button>
        </div>
      </PhoneShell>
    )
  }

  const rating = ratingLabel(data.score)
  // Only show an absolute days-ago count when the backend actually tells us
  // when the password was last changed. Otherwise fall back to generic copy
  // so we never lie about it.
  const passwordDays = data.passwordChangedAt ? daysAgo(data.passwordChangedAt) : null
  const phoneShort = data.phone ? maskPhone(data.phone) : null
  const lastLoginLabel = data.lastLoginAt ? friendlyAt(data.lastLoginAt) : null
  const antiPhishingDisplay = data.antiPhishingCode && data.antiPhishingCode !== '—'
    ? `"${data.antiPhishingCode}"`
    : 'Not set — tap to add'

  const rows: Row[] = [
    {
      icon: 'lock',
      name: 'Two-Factor Auth',
      desc: data.twoFAEnabled ? 'Authenticator app' : 'Strongly recommended',
      rightLabel: data.twoFAEnabled ? 'ENABLED' : 'OFF',
      rightTone: data.twoFAEnabled ? 'g' : 'r',
      routeId: 'route.security.2fa',
    },
    {
      icon: 'shield',
      name: 'Change Password',
      desc:
        passwordDays === null
          ? 'Update your password regularly'
          : passwordDays === 0
          ? 'Changed today'
          : passwordDays === 1
          ? 'Changed yesterday'
          : `Changed ${passwordDays} days ago`,
      routeId: 'route.security.password',
    },
    {
      icon: 'pin',
      name: 'Transaction PIN',
      desc: 'Require a PIN for withdrawals & transfers',
      routeId: 'route.security.pin',
    },
    {
      icon: 'key',
      name: 'Backup Codes',
      desc: data.twoFAEnabled
        ? 'Manage one-time recovery codes'
        : 'Enable 2FA first to use backup codes',
      routeId: 'route.security.backup-codes',
    },
    {
      icon: 'eye',
      name: 'Anti-Phishing Code',
      desc: antiPhishingDisplay,
      routeId: 'route.security.anti-phishing',
    },
    ...(lastLoginLabel
      ? [{
          icon: 'clock' as IconName,
          name: 'Login History',
          desc: `Last sign-in: ${lastLoginLabel}`,
          routeId: 'route.security.sessions' as RouteId,
        }]
      : []),
    {
      icon: 'user',
      name: 'Active Sessions',
      desc: `${data.activeSessions} ${data.activeSessions === 1 ? 'device' : 'devices'}`,
      routeId: 'route.security.sessions',
    },
    ...(phoneShort
      ? [{
          icon: 'phone' as IconName,
          name: 'Phone Verification',
          desc: phoneShort,
          rightLabel: data.phoneVerified ? '✓' : 'UNVERIFIED',
          rightTone: (data.phoneVerified ? 'g' : 'r') as 'g' | 'r',
        }]
      : []),
  ]

  // What single action would push the score the most?
  const tipText = !data.twoFAEnabled
    ? 'Enable 2FA to add 35 points and lock down your account.'
    : data.antiPhishingCode === '—'
    ? 'Set an anti-phishing code so you can spot fake emails instantly.'
    : data.kycStatus !== 'approved'
    ? 'Complete KYC to unlock full account features.'
    : 'You\'re fully secured. Keep your backup codes somewhere safe.'

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.title') || 'Security'} />

      {/* Multicolour score ring */}
      <ScoreRing score={data.score} rating={rating} />

      <div
        className="g"
        style={{
          padding: 10,
          marginTop: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          borderLeft: `3px solid ${data.score >= 70 ? 'var(--gl)' : data.score >= 40 ? 'var(--gd)' : 'var(--r)'}`,
          background: data.score >= 70
            ? 'rgba(0,200,83,.05)'
            : data.score >= 40
            ? 'rgba(255,193,7,.05)'
            : 'rgba(255,82,82,.05)',
        }}
      >
        <span
          style={{
            color: data.score >= 70 ? 'var(--gl)' : data.score >= 40 ? 'var(--gd)' : 'var(--r)',
            fontWeight: 800,
          }}
        >
          {data.score >= 70 ? '✓' : data.score >= 40 ? '!' : '⚠'}
        </span>
        <div className="t3" style={{ flex: 1, lineHeight: 1.4, fontSize: 12 }}>
          {tipText}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {rows.map(r => (
          <button
            key={r.name}
            onClick={() => r.routeId && nav(ROUTES[r.routeId].path)}
            disabled={!r.routeId}
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(0,200,83,.04)',
              border: '1px solid rgba(255,255,255,.04)',
              cursor: r.routeId ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
              fontFamily: 'Outfit',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(0,200,83,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={r.icon} size={18} color="var(--gl)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                {r.name}
              </div>
              <div
                className="t3"
                style={{
                  fontSize: 12,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.desc}
              </div>
            </div>
            {r.rightLabel ? (
              <span
                style={{
                  fontSize: 9,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background:
                    r.rightTone === 'g'
                      ? 'rgba(0,200,83,.16)'
                      : r.rightTone === 'r'
                      ? 'rgba(255,82,82,.14)'
                      : 'rgba(255,193,7,.14)',
                  color:
                    r.rightTone === 'g'
                      ? 'var(--gl)'
                      : r.rightTone === 'r'
                      ? 'var(--r)'
                      : 'var(--gd)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.6px',
                  flexShrink: 0,
                }}
              >
                {r.rightLabel}
              </span>
            ) : r.routeId ? (
              <span style={{ color: 'var(--text-mid-30)', fontSize: 16 }}>›</span>
            ) : null}
          </button>
        ))}

        {/* Biometric — toggle, real backing via useBiometricLock */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'rgba(0,200,83,.04)',
            border: '1px solid rgba(255,255,255,.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(0,200,83,.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="fp" size={18} color="var(--gl)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
              Biometric Lock
            </div>
            <div className="t3" style={{ fontSize: 12, marginTop: 2 }}>
              {biometric.biometricAvailable
                ? 'Unlock the app with Face ID or fingerprint'
                : 'Not available on this device'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!biometric.biometricAvailable) return
              // Hook handles enable (auth probe + register) and disable.
              biometric.toggleBiometric(!biometric.biometricEnabled).catch(() => {})
            }}
            disabled={!biometric.biometricAvailable}
            aria-pressed={biometric.biometricEnabled}
            style={{
              width: 42,
              height: 24,
              borderRadius: 999,
              background: biometric.biometricEnabled ? 'var(--gl)' : 'rgba(255,255,255,.15)',
              position: 'relative',
              border: 'none',
              cursor: biometric.biometricAvailable ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'background .15s',
              opacity: biometric.biometricAvailable ? 1 : 0.4,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: biometric.biometricEnabled ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .15s',
              }}
            />
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Multi-colour score ring — gradient stroke + animated arc length.
// ─────────────────────────────────────────────────────────────────────────
function ScoreRing({ score, rating }: { score: number; rating: string }) {
  const safe = Math.max(0, Math.min(100, score))
  const r = 56
  const c = 2 * Math.PI * r
  const dash = (c * safe) / 100
  const valueColor = safe >= 70 ? '#10b981' : safe >= 40 ? '#fbbf24' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '14px auto' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          {/* 4-stop gradient: red → orange → amber → green so the ring is
              colourful regardless of the score. */}
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Background track */}
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />

        {/* Soft glow underneath the arc */}
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 80 80)"
          opacity="0.45"
          filter="url(#ringGlow)"
        />

        {/* Crisp arc on top */}
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 80 80)"
        />
      </svg>

      {/* Score text overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: valueColor,
            fontFamily: 'Outfit, sans-serif',
            lineHeight: 1,
            textShadow: `0 0 24px ${valueColor}55`,
          }}
        >
          {safe}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-mid)',
            marginTop: 4,
            letterSpacing: '.5px',
          }}
        >
          / 100
        </div>
        <div
          style={{
            fontSize: 10,
            color: valueColor,
            marginTop: 2,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {rating}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function ratingLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Weak'
}

function daysAgo(iso: string): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function maskPhone(phone: string): string {
  if (!phone) return ''
  // Keep first 3 chars (country/prefix), mask the middle, show last 4.
  if (phone.length <= 7) return phone
  const head = phone.slice(0, 4)
  const tail = phone.slice(-4)
  return `${head} ${'•'.repeat(Math.max(2, phone.length - 8))}${tail}`
}

function friendlyAt(iso: string): string {
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  if (ms < 60_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return d.toLocaleDateString()
}
