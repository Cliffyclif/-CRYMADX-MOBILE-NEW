import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'

const ONBOARDED_KEY = 'crymadx.onboarded'

export function Splash() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)

  useEffect(() => {
    const tm = setTimeout(() => {
      // Logged-in users always go straight to home.
      if (user) {
        nav(ROUTES['route.tab.home'].path, { replace: true })
        return
      }
      // Brand-new install / fresh storage — show the onboarding carousel
      // before the login screen. Onboarding marks this flag on completion or
      // skip, so existing users who already signed in once never see it
      // again even if they sign out.
      const seen = (() => {
        try { return localStorage.getItem(ONBOARDED_KEY) === '1' } catch { return false }
      })()
      nav(seen ? ROUTES['route.auth.login'].path : ROUTES['route.onboarding'].path, { replace: true })
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
