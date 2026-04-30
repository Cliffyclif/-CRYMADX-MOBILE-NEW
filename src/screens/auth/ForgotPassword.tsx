import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function ForgotPassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const m = useEndpointMutation('api.auth.forgot-password')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await m.mutateAsync({ body: { email } })
    setSent(true)
  }

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
       <div className="auth-card">
        <div style={{ textAlign: 'center', margin: '0 0 8px' }}>
          <div className="ic" style={{ width: 76, height: 76, margin: '0 auto' }}><Icon name="mail" size={36} /></div>
          <h2 style={{ marginTop: 12 }}>{sent ? t('auth.checkInbox') : t('auth.forgotTitle')}</h2>
          <div className="t2" style={{ marginTop: 6, lineHeight: 1.5 }}>
            {sent
              ? t('auth.checkInbox')
              : t('auth.forgotSubtitle')}
          </div>
        </div>

        {!sent && (
          <div className="inp" style={{ marginTop: 14 }}>
            <Icon name="mail" size={14} />
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1 }} />
          </div>
        )}

        {!sent
          ? <button type="submit" className="btn btn-g" disabled={m.isPending}>
              {m.isPending ? t('auth.sendingDots') : t('auth.sendResetLink')}
            </button>
          : <button type="button" className="btn btn-g" onClick={() => nav(ROUTES['route.auth.reset'].path, { state: { email } })}>
              {t('common.continue')}
            </button>}

        <div className="t2" style={{ textAlign: 'center', marginTop: 14, fontSize: 14 }}>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.auth.login'].path)}>← {t('auth.backToSignIn')}</span>
        </div>
       </div>
      </form>
    </PhoneShell>
  )
}
