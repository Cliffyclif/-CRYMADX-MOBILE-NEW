import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function ResetPassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.auth.reset-password')

  const strength = pw.length >= 12 ? 4 : pw.length >= 8 ? 3 : pw.length >= 4 ? 2 : 1

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw !== confirm) { setError(t('auth.passwordsDontMatch')); return }
    try {
      await m.mutateAsync({ body: { password: pw } })
      nav(ROUTES['route.auth.login'].path, { replace: true })
    } catch (err) { setError((err as Error).message) }
  }

  const checks = [
    [pw.length >= 8,            t('auth.req8chars')],
    [/[A-Z]/.test(pw),          t('auth.reqUpper')],
    [/[0-9]/.test(pw),          t('auth.reqNumber')],
    [/[^A-Za-z0-9]/.test(pw),   t('auth.reqSpecial')],
  ] as const

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
       <div className="auth-card">
        <div style={{ textAlign: 'center', margin: '0 0 12px' }}>
          <div className="ic" style={{ width: 76, height: 76, margin: '0 auto' }}><Icon name="key" size={36} /></div>
          <h2 style={{ marginTop: 12 }}>{t('auth.newPassword2')}</h2>
          <div className="t2" style={{ marginTop: 6 }}>{t('auth.chooseStrong')}</div>
        </div>

        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" placeholder={t('auth.newPasswordPlaceholder')} value={pw} onChange={e => setPw(e.target.value)} required style={{ flex: 1 }} />
        </div>
        <div style={{ margin: '4px 0' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? 'var(--gl)' : 'var(--surface-mild)' }} />
            ))}
          </div>
          <div className={strength >= 3 ? 'grn' : 't3'} style={{ fontSize: 11, marginTop: 2 }}>
            {strength >= 3 ? t('auth.strongCheck') : t('auth.keepGoing')}
          </div>
        </div>

        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" placeholder={t('auth.confirmPasswordPlaceholder')} value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ flex: 1 }} />
        </div>

        <div className="g" style={{ padding: 8, marginTop: 6, fontSize: 11 }}>
          <div className="t3">{t('auth.passwordReq')}</div>
          {checks.map(([ok, label]) => (
            <div key={label} style={{ margin: '2px 0', color: ok ? 'var(--gl)' : 'var(--text-mid-30)' }}>{ok ? '✓' : '○'} {label}</div>
          ))}
        </div>

        {error && <div className="g" style={{ padding: 10, marginTop: 6, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <button type="submit" className="btn btn-g" style={{ marginTop: 8 }} disabled={m.isPending || strength < 3}>
          {m.isPending ? t('auth.savingDots') : t('auth.setNewPassword')}
        </button>
        <div className="t2" style={{ textAlign: 'center', marginTop: 14, fontSize: 14 }}>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.login'].path)}>← {t('auth.backToSignIn')}</span>
        </div>
       </div>
      </form>
    </PhoneShell>
  )
}
