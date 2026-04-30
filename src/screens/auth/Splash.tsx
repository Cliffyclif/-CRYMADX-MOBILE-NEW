import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'

export function Splash() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)

  useEffect(() => {
    const tm = setTimeout(() => {
      nav(user ? ROUTES['route.tab.home'].path : ROUTES['route.auth.login'].path, { replace: true })
    }, 1400)
    return () => clearTimeout(tm)
  }, [user, nav])

  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <img src="/crymadx-full.png" alt="CrymadX" style={{ width: 200, marginBottom: 8 }} />
        <div className="t3" style={{ marginTop: 4, letterSpacing: 2 }}>{t('auth.tagline')}</div>
        <div style={{ width: 60, marginTop: 24 }}>
          <div className="bar"><div className="fl" style={{ width: '65%' }} /></div>
        </div>
      </div>
    </PhoneShell>
  )
}
