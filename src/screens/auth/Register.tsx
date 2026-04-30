import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES } from '../../routes'
import { useEndpointMutation } from '../../api/hooks'

export function Register() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referral, setReferral] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.auth.register')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await m.mutateAsync({ body: { firstName: name.split(' ')[0] ?? '', lastName: name.split(' ').slice(1).join(' '), email, password, referral } })
      nav(ROUTES['route.auth.verify-email'].path, { state: { email } })
    } catch (err) {
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

        {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <button type="submit" className="btn btn-g" disabled={m.isPending}>
          {m.isPending ? t('auth.creating') : t('common.continue')}
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0 10px', position: 'relative', fontSize: 16, color: 'var(--text-mid-30)' }}>
          <span style={{ padding: '0 8px', letterSpacing: 1 }}>{t('auth.orSignUpWith')}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-o" style={{ flex: 1, fontSize: 14, padding: '14px 8px', margin: 0 }}>G&nbsp;&nbsp;{t('auth.google')}</button>
          <button type="button" className="btn btn-o" style={{ flex: 1, fontSize: 14, padding: '14px 8px', margin: 0 }}>&nbsp;&nbsp;{t('auth.apple')}</button>
        </div>

        <div className="t2" style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          {t('auth.haveAccount')} <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.login'].path)}>{t('auth.signIn')}</span>
        </div>
       </div>
      </form>
    </PhoneShell>
  )
}
