import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { TurnstileWidget } from '../../components/TurnstileWidget'
import { ROUTES } from '../../routes'
import { useEndpointMutation } from '../../api/hooks'
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn'
import { haptics } from '../../lib/haptics'
import { isValidName, NAME_VALIDATION_MESSAGE } from '../../lib/nameValidation'

export function Register() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referral, setReferral] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
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
    if (!isValidName(name)) {
      setError(NAME_VALIDATION_MESSAGE)
      return
    }
    if (!captchaToken) {
      setError(t('auth.captchaRequired'))
      return
    }
    try {
      await m.mutateAsync({ body: { firstName: name.split(' ')[0] ?? '', lastName: name.split(' ').slice(1).join(' '), email, password, referral, captchaToken } })
      nav(ROUTES['route.auth.verify-email'].path, { state: { email } })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const isEmailTakenError = !!error && /already (exists|registered)|EMAIL_TAKEN/i.test(error)

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
          <input type={showPassword ? 'text' : 'password'} placeholder={t('auth.createPasswordPlaceholder')} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(s => !s)} style={{ background: 'none', border: 'none', padding: 0, marginLeft: 'auto', cursor: 'pointer', display: 'flex' }}>
            <Icon name="eye" size={14} />
          </button>
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

        <TurnstileWidget
          onVerify={(t) => { setCaptchaToken(t); setError(null) }}
          onExpire={() => setCaptchaToken(null)}
          onError={() => { setCaptchaToken(null); setError('Security check failed — please retry') }}
        />

        {error && (
          <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>
            <div>{error}</div>
            {isEmailTakenError && (
              <button
                type="button"
                onClick={() => nav(ROUTES['route.auth.login'].path, { state: { email } })}
                style={{ background: 'none', border: 'none', color: 'var(--gl)', fontWeight: 700, padding: 0, marginTop: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Log in instead →
              </button>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-g" disabled={m.isPending || !captchaToken}>
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
