import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { useAuth } from '../../stores/auth'
import { ROUTES } from '../../routes'
import type { AuthSession } from '../../api/endpoints'

export function Login2FA() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const signIn = useAuth(s => s.signIn)
  const state = (loc.state as { email?: string; userId?: string } | null) ?? {}
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [seconds, setSeconds] = useState(28)
  const [error, setError] = useState<string | null>(null)
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const m = useEndpointMutation<{ body: { userId?: string; code: string } }, AuthSession & { refreshToken?: string }>('api.auth.verify-2fa')

  useEffect(() => {
    if (!state.userId) {
      nav(ROUTES['route.auth.login'].path, { replace: true })
    }
  }, [state.userId, nav])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1)
    setCode(prev => { const n = [...prev]; n[i] = d; return n })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!state.userId) {
      setError(t('auth.sessionExpired'))
      return
    }
    try {
      const session = await m.mutateAsync({ body: { userId: state.userId, code: code.join('') } })
      if (session.user && session.accessToken) {
        signIn(session.user, session.accessToken, session.refreshToken)
      }
      nav(ROUTES['route.tab.home'].path, { replace: true })
    } catch (err) { setError((err as Error).message) }
  }

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
       <div className="auth-card">
        <div style={{ textAlign: 'center', margin: '0 0 8px' }}>
          <div className="ic" style={{ width: 76, height: 76, margin: '0 auto' }}><Icon name="lock" size={36} /></div>
          <h2 style={{ marginTop: 12 }}>{t('auth.twoFactorTitle')}</h2>
          <div className="t2" style={{ marginTop: 6 }}>{t('auth.twoFactorSubtitle')}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '20px 0', justifyContent: 'center' }}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              value={d}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="g"
              style={{ width: 44, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'var(--gl)', background: 'rgba(27,140,62,.05)', border: 'none', borderRadius: 14 }}
            />
          ))}
        </div>

        {error && <div className="g" style={{ padding: 10, marginBottom: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14, width: '100%' }}>{error}</div>}

        <button type="submit" className="btn btn-g" disabled={m.isPending || code.some(c => !c)}>
          {m.isPending ? t('auth.verifying') : t('auth.verify')}
        </button>
        <button type="button" className="btn btn-o">{t('auth.useBackupCode')}</button>

        <div className="t2" style={{ textAlign: 'center', marginTop: 14, fontSize: 14 }}>
          {seconds > 0
            ? <span className="t3">{t('auth.resendIn2', { seconds })}</span>
            : <span className="grn" style={{ cursor: 'pointer' }} onClick={() => setSeconds(28)}>{t('auth.resendCode')}</span>}
        </div>
       </div>
      </form>
    </PhoneShell>
  )
}
