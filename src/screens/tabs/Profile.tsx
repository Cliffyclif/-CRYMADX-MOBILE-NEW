import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon, type IconName } from '../../components/Icon'
import { useAuth } from '../../stores/auth'
import { useTheme } from '../../stores/theme'
import { useDisplay } from '../../stores/display'
import { ROUTES } from '../../routes'
import { useEndpoint } from '../../api/hooks'
import { useEndpointMutation } from '../../api/hooks'
import { SUPPORTED_LANGUAGES } from '../../lib/i18n'

export function Profile() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const signOut = useAuth(s => s.signOut)
  const theme = useTheme(s => s.theme)
  const toggleTheme = useTheme(s => s.toggle)
  const size = useDisplay(s => s.size)
  const { data: rewards } = useEndpoint<{ xp: number; tier: string; badges: number }>('api.rewards.summary', {}, { enabled: !!user })
  const logout = useEndpointMutation('api.auth.logout')

  const handleLogout = async () => {
    try { await logout.mutateAsync({}) } catch {}
    signOut()
    nav(ROUTES['route.auth.login'].path, { replace: true })
  }

  const langLabel = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.native ?? 'English'
  const sizeLabel = size === 'small' ? t('settings.small') : size === 'medium' ? t('settings.medium') : t('settings.large')

  const account: Array<[IconName, string, string]> = [
    ['shield', t('profile.kyc'), 'L2 ✓'],
    ['lock', t('profile.security'), `${75}/100`],
    ['key', t('settings.apiKeys'), '3'],
    ['card', t('services.items.card'), '2'],
  ]

  const rewardsRows: Array<[IconName, string, string]> = [
    ['trophy', t('services.items.rewardsHub'), `${rewards?.xp ?? 0} XP`],
    ['gift', t('profile.referral'), '3'],
    ['star', t('rewards.tier'), rewards?.tier ?? 'Bronze'],
  ]

  const prefs: Array<[IconName, string, string, () => void]> = [
    ['moon', t('profile.theme'), theme === 'dark' ? t('settings.themeDark') : t('settings.themeLight'), toggleTheme],
    ['settings', t('settings.displaySize'), sizeLabel, () => nav(ROUTES['route.settings.theme'].path)],
    ['globe', t('profile.language'), langLabel, () => nav(ROUTES['route.settings.language'].path)],
    ['dollar', t('profile.currency'), 'USD', () => nav(ROUTES['route.settings.currency'].path)],
    ['bell', t('profile.notifications'), t('common.online'), () => nav(ROUTES['route.settings.notifications'].path)],
  ]

  return (
    <PhoneShell bottomNav={<BottomNav />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/crymadx-mark.png" alt="" style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(27,140,62,.06)', padding: 6 }} />
        <div style={{ flex: 1 }}>
          <h2>{user ? `${user.firstName} ${user.lastName}` : 'Demo User'}</h2>
          <div className="t3">{user?.email ?? 'demo@crymadx.io'}</div>
          <span className="badge badge-gd" style={{ fontSize: 10, marginTop: 2 }}>🥉 Bronze · {rewards?.xp ?? 0} XP</span>
        </div>
        <Icon name="edit" size={14} color="var(--gl)" />
      </div>

      <Section title={t('profile.myAccount').toUpperCase()} rows={account.map(([i, n, r]) => ({ icon: i, name: n, value: r, onClick: () => nav(ROUTES['route.kyc.status'].path) }))} />
      <Section title={t('profile.rewards').toUpperCase()} rows={rewardsRows.map(([i, n, r]) => ({ icon: i, name: n, value: r, valueClass: 'grn', onClick: () => nav(ROUTES['route.engage.rewards'].path) }))} />
      <Section title={t('common.settings').toUpperCase()} rows={prefs.map(([i, n, r, fn]) => ({ icon: i, name: n, value: r, onClick: fn }))} />

      <button className="btn btn-r" onClick={handleLogout} style={{ marginTop: 10 }} disabled={logout.isPending}>
        {logout.isPending ? t('auth.loggingOut') : t('profile.logout')}
      </button>
    </PhoneShell>
  )
}

interface Row {
  icon: IconName
  name: string
  value?: string
  valueClass?: string
  onClick?: () => void
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="g" style={{ padding: 2, marginTop: 8 }}>
      <div className="t3" style={{ padding: '8px 10px', fontWeight: 700 }}>{title}</div>
      {rows.map((r, i) => (
        <button key={i} onClick={r.onClick} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', border: 'none', borderBottomColor: 'var(--divider-soft)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 28, height: 28 }}>
            <Icon name={r.icon} size={14} />
          </div>
          <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{r.name}</div></div>
          {r.value && <div className={`li-r ${r.valueClass ?? ''}`} style={{ fontSize: 13, color: r.valueClass === 'grn' ? 'var(--gl)' : 'var(--text-mid-40)' }}>{r.value} ›</div>}
        </button>
      ))}
    </div>
  )
}
