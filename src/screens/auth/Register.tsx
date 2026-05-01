import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { TurnstileWidget } from '../../components/TurnstileWidget'
import { ROUTES } from '../../routes'
import { useEndpointMutation } from '../../api/hooks'
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn'
import { haptics } from '../../lib/haptics'
import { isNativeApp } from '../../lib/platform'

export function Register() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const refFromUrl = new URLSearchParams(loc.search).get('ref') ?? ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referral, setReferral] = useState(refFromUrl)
  const [agreed, setAgreed] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.auth.register')
  const google = useGoogleSignIn()

  const googleClick = async () => {
    setError(null)
    haptics.selection()
    try {
      const session = await google.signIn()
      if (!session) return
      haptics.success()
      nav(ROUTES['route.tab.home'].path, { replace: true })
    } catch (e: any) {
      haptics.error()
      setError(e?.message ?? 'Google sign-in failed')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!agreed) {
      setError('Please accept the Terms of Service to continue')
      return
    }
    // Captcha is required on the web (Cloudflare Turnstile widget). Skipped
    // inside the APK — the backend bypasses captcha when the request carries
    // X-Mobile-App: 1 (set automatically by api/client.ts in Capacitor).
    if (!isNativeApp() && !captchaToken) {
      setError('Please complete the security check')
      return
    }
    try {
      await m.mutateAsync({
        body: {
          firstName: name.split(' ')[0] ?? '',
          lastName: name.split(' ').slice(1).join(' '),
          email,
          password,
          referral,
          captchaToken,
        },
      })
      haptics.success()
      nav(ROUTES['route.auth.verify-email'].path, { state: { email } })
    } catch (err) {
      haptics.error()
      setError((err as Error).message)
    }
  }

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 4 ? 2 : 1

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
       <div className="auth-card">
        <div style={{ textAlign: 'center', margin: '0 0 12px' }}>
          <img src="/crymadx-mark.png" alt="" style={{ width: 72 }} />
          <h2 style={{ marginTop: 8 }}>{t('auth.createAccount')}</h2>
          <div className="t2" style={{ marginTop: 4 }}>{t('auth.joinTraders')}</div>
        </div>

        <div className="inp">
          <Icon name="user" size={14} />
          <input placeholder={t('auth.fullNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="inp">
          <Icon name="mail" size={14} />
          <input type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" placeholder={t('auth.createPasswordPlaceholder')} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </div>

        <div style={{ margin: '8px 0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= strength ? 'var(--gl)' : 'var(--surface-mild)' }} />
            ))}
          </div>
          <div className="t3" style={{ marginTop: 6 }}>{strength >= 3 ? t('auth.strengthStrong') : strength === 2 ? t('auth.strengthOk') : t('auth.strengthWeak')}</div>
        </div>

        <div className="inp">
          <Icon name="share" size={14} />
          <input placeholder={t('auth.referralPlaceholder')} value={referral} onChange={e => setReferral(e.target.value)} />
        </div>

        {/* Terms of Service — required */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            margin: '10px 0 6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--gl)', flexShrink: 0 }}
          />
          <span className="t3" style={{ fontSize: 12, lineHeight: 1.4 }}>
            {t('auth.agreeTerms') ||
              <>I agree to the <span className="grn">Terms of Service</span> and <span className="grn">Privacy Policy</span></>}
          </span>
        </label>

        {/* Cloudflare Turnstile — backend's /register requires a valid token */}
        <TurnstileWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />

        {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <button
          type="submit"
          className="btn btn-g"
          disabled={m.isPending || !agreed || (!isNativeApp() && !captchaToken)}
        >
          {m.isPending ? t('auth.creating') : t('common.continue')}
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0 10px', position: 'relative', fontSize: 16, color: 'var(--text-mid-30)' }}>
          <span style={{ padding: '0 8px', letterSpacing: 1 }}>{t('auth.orSignUpWith')}</span>
        </div>

        {google.isAvailable && (
          <button
            type="button"
            className="btn btn-o"
            style={{ width: '100%', fontSize: 14, padding: '14px 12px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            onClick={googleClick}
            disabled={google.isLoading}
          >
            <GoogleGlyph />
            <span>{google.isLoading ? (t('auth.creating') as string) : `${t('auth.google')} →`}</span>
          </button>
        )}

        <div className="t2" style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          {t('auth.haveAccount')} <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.login'].path)}>{t('auth.signIn')}</span>
        </div>
       </div>
      </form>
    </PhoneShell>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86a5.27 5.27 0 0 1-4.95-3.64H1.04v2.34A8.99 8.99 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M4.05 10.78A5.4 5.4 0 0 1 3.77 9c0-.62.1-1.22.28-1.78V4.88H1.04a8.99 8.99 0 0 0 0 8.24l3.01-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A8.99 8.99 0 0 0 9 0a8.99 8.99 0 0 0-7.96 4.88l3.01 2.34A5.27 5.27 0 0 1 9 3.58z"/>
    </svg>
  )
}
