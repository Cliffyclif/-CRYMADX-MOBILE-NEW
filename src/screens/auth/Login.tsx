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
import { haptics } from '../../lib/haptics'
import type { AuthSession } from '../../api/endpoints'

export function Login() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const signIn = useAuth(s => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const login = useEndpointMutation<{ body: { email: string; password: string; captchaToken?: string } }, AuthSession>('api.auth.login')
  const { biometricEnabled, biometricAvailable, authenticate } = useBiometricLock(false)

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

        {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <button type="submit" className="btn btn-g" disabled={login.isPending || !captchaToken}>
          {login.isPending ? t('auth.signingIn') : `${t('auth.signIn')} →`}
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0 10px', position: 'relative', fontSize: 16, color: 'var(--text-mid-30)' }}>
          <span style={{ padding: '0 8px', letterSpacing: 1 }}>{t('auth.orContinueWith')}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-o" style={{ flex: 1, fontSize: 14, padding: '14px 8px', margin: 0 }}>G&nbsp;&nbsp;Google</button>
          <button type="button" className="btn btn-o" style={{ flex: 1, fontSize: 14, padding: '14px 8px', margin: 0 }}>&nbsp;&nbsp;Apple</button>
        </div>

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
