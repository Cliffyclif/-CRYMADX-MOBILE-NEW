import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { TurnstileWidget } from '../../components/TurnstileWidget'
import { ROUTES } from '../../routes'
import { useEndpointMutation } from '../../api/hooks'
import { useAuth } from '../../stores/auth'
import { useBiometricLock } from '../../hooks/useBiometricLock'
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn'
import { haptics } from '../../lib/haptics'
import type { AuthSession } from '../../api/endpoints'

export function Login() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const signIn = useAuth(s => s.signIn)
  const [email, setEmail] = useState((loc.state as { email?: string } | null)?.email ?? '')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const login = useEndpointMutation<{ body: { email: string; password: string; captchaToken?: string } }, AuthSession>('api.auth.login')
  const resend = useEndpointMutation<{ body: { email: string } }, { message: string }>('api.auth.resend-code')
  const { biometricEnabled, biometricAvailable, authenticate } = useBiometricLock(false)
  const google = useGoogleSignIn()

  const googleClick = async () => {
    setError(null)
    haptics.selection()
    try {
      const session = await google.signIn()
      if (!session) return // user cancelled
      haptics.success()
      const from = (loc.state as { from?: string } | null)?.from
      nav(from && from !== ROUTES['route.auth.login'].path ? from : ROUTES['route.tab.home'].path, { replace: true })
    } catch (e: any) {
      haptics.error()
      setError(e?.message ?? 'Google sign-in failed')
    }
  }

  const biometricSignIn = async () => {
    if (!biometricEnabled) {
      toast.error(t('auth.biometricNotSetUp') || 'Biometric not set up. Sign in once with your password to enable it.')
      return
    }
    if (!biometricAvailable) {
      toast.error(t('auth.biometricUnavailable') || 'Biometric not available on this device')
      return
    }
    const ok = await authenticate()
    if (!ok) {
      haptics.error()
      toast.error(t('auth.biometricFailed') || 'Biometric verification failed')
      return
    }
    haptics.success()
    // Biometric only re-unlocks an existing session (the server token in localStorage).
    // If the token is gone (logout/expired), user must re-enter credentials.
    const cached = localStorage.getItem('crymadx.auth.token')
    if (!cached) {
      toast.info(t('auth.sessionExpired') || 'Session expired — please sign in')
      return
    }
    const stored = localStorage.getItem('crymadx.auth')
    const cachedUser = stored ? (() => { try { return JSON.parse(stored).user } catch { return null } })() : null
    if (cachedUser) signIn(cachedUser, cached, localStorage.getItem('crymadx.auth.refresh') ?? undefined)
    nav(ROUTES['route.tab.home'].path, { replace: true })
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (!captchaToken) {
      setError(t('auth.captchaRequired'))
      return
    }
    try {
      const session = await login.mutateAsync({ body: { email, password, captchaToken } }) as AuthSession & { refreshToken?: string; requires2FA?: boolean; userId?: string }
      if (session.requires2FA) {
        nav(ROUTES['route.auth.login-2fa'].path, { state: { email, userId: (session as any).userId } })
        return
      }
      signIn(session.user, session.accessToken, session.refreshToken)
      const from = (loc.state as { from?: string } | null)?.from
      nav(from && from !== ROUTES['route.auth.login'].path ? from : ROUTES['route.tab.home'].path, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
       <div className="auth-card">
        <div style={{ textAlign: 'center', margin: '0 0 16px' }}>
          <img src="/crymadx-mark.png" alt="" style={{ width: 76 }} />
          <h2 style={{ marginTop: 8 }}>{t('auth.welcomeBack')}</h2>
          <div className="t2" style={{ marginTop: 4 }}>{t('auth.signInToAccount')}</div>
        </div>

        <div className="inp">
          <Icon name="mail" size={14} />
          <input type="email" placeholder={t('auth.email') as string} value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="inp">
          <Icon name="lock" size={14} />
          <input type={show ? 'text' : 'password'} placeholder={t('auth.password') as string} value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', padding: 0, marginLeft: 'auto', cursor: 'pointer', display: 'flex' }}>
            <Icon name="eye" size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: 18 }}>
          <label style={{ color: 'var(--text-mid-40)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--g)' }} />
            {t('auth.rememberMe')}
          </label>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.forgot'].path)}>{t('auth.forgotPassword')}</span>
        </div>

        <TurnstileWidget
          onVerify={(t) => { setCaptchaToken(t); setError(null) }}
          onExpire={() => setCaptchaToken(null)}
          onError={() => { setCaptchaToken(null); setError('Security check failed — please retry') }}
        />

        {error && (
          <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>
            <div>{error}</div>
            {/email.*not.*verified|verify.*your.*email/i.test(error) && (
              <button
                type="button"
                disabled={resend.isPending}
                onClick={async () => {
                  setError(null); setInfo(null)
                  try {
                    await resend.mutateAsync({ body: { email } })
                    setInfo('Verification code sent. Check your inbox, then enter it on the next screen.')
                    setTimeout(() => nav(ROUTES['route.auth.verify-email'].path, { state: { email } }), 800)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--gl)', fontWeight: 700, padding: 0, marginTop: 6, cursor: 'pointer', fontSize: 14 }}
              >
                {resend.isPending ? 'Sending code…' : 'Resend verification code →'}
              </button>
            )}
          </div>
        )}
        {info && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--gl)', color: 'var(--gl)', fontSize: 14 }}>{info}</div>}

        <button type="submit" className="btn btn-g" disabled={login.isPending || !captchaToken}>
          {login.isPending ? t('auth.signingIn') : `${t('auth.signIn')} →`}
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0 10px', position: 'relative', fontSize: 16, color: 'var(--text-mid-30)' }}>
          <span style={{ padding: '0 8px', letterSpacing: 1 }}>{t('auth.orContinueWith')}</span>
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
            <span>{google.isLoading ? (t('auth.signingIn') as string) : 'Continue with Google'}</span>
          </button>
        )}

        {biometricAvailable && biometricEnabled && (
          <button type="button" className="btn btn-o" style={{ marginTop: 10, fontSize: 14 }} onClick={biometricSignIn}>
            <Icon name="fp" size={18} color="var(--gl)" />{t('auth.useBiometric')}
          </button>
        )}

        <div className="t2" style={{ textAlign: 'center', marginTop: 18, fontSize: 14 }}>
          {t('auth.noAccount')} <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.register'].path)}>{t('auth.signUp')}</span>
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
