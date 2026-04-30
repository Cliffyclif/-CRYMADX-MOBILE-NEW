import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function ChangePassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.security.password.change')

  const strength = pw.length >= 12 ? 4 : pw.length >= 8 ? 3 : pw.length >= 4 ? 2 : 1
  const checks: Array<[boolean, string]> = [
    [pw.length >= 12,            t('security.req12chars')],
    [/[a-z]/.test(pw) && /[A-Z]/.test(pw), t('security.reqMixCase')],
    [/[0-9]/.test(pw),           t('security.reqNumber')],
    [/[^A-Za-z0-9]/.test(pw),    t('security.reqSpecial')],
    [pw.length > 0,              t('security.reqNotRecent')],
  ]

  const submit = async () => {
    setError(null)
    if (pw !== confirm) { setError(t('security.passwordsDontMatch')); return }
    try {
      await m.mutateAsync({ body: { currentPassword: cur, newPassword: pw } })
      nav(ROUTES['route.security.hub'].path, { replace: true })
    } catch (err) { setError((err as Error).message) }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.changePassword')} />
      <div className="t2">{t('security.lastChanged', { days: 12 })}</div>

      <div style={{ marginTop: 14 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('security.passwordOld')}</div>
        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" value={cur} onChange={e => setCur(e.target.value)} placeholder={t('security.enterCurrent')} style={{ flex: 1 }} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('security.passwordNew')}</div>
        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={t('security.chooseStrong')} style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? 'var(--gl)' : 'var(--surface-mild)' }} />
          ))}
        </div>
        <div className={strength >= 3 ? 'grn' : 't3'} style={{ fontSize: 11, marginTop: 2 }}>{strength >= 3 ? t('security.strong') : t('security.keepGoing')}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('security.passwordConfirm')}</div>
        <div className="inp">
          <Icon name="lock" size={14} />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t('security.reEnterNew')} style={{ flex: 1 }} />
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{t('security.requirements')}</div>
        {checks.map(([ok, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0', fontSize: 11 }}>
            <span className={ok ? 'grn' : 'red'}>{ok ? '✓' : '○'}</span>
            <span style={{ color: 'var(--text-strong)' }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('security.allSignOut')}</div>
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={m.isPending || strength < 3 || !cur}>
        {m.isPending ? t('security.changing') : t('security.changePassword')}
      </button>
    </PhoneShell>
  )
}
