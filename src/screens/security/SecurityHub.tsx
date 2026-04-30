import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, type RouteId } from '../../routes'
import type { SecuritySummary } from '../../mock/db'

interface Row {
  icon: IconName
  name: string
  desc: string
  rightLabel?: string
  rightTone?: 'g' | 'gd' | 'r'
  routeId?: RouteId
}

export function SecurityHub() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<SecuritySummary>('api.security.summary')
  if (!data) return <PhoneShell noTabs><ScreenHeader title={t('security.title')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const rows: Row[] = [
    { icon: 'lock',   name: t('security.twoFactorShort'),    desc: t('security.twoFactorSub'),                                          rightLabel: data.twoFAEnabled ? t('security.enabled') : t('security.off'), rightTone: data.twoFAEnabled ? 'g' : 'r', routeId: 'route.security.2fa' },
    { icon: 'shield', name: t('security.changePassword'),    desc: t('security.passwordSub', { days: daysAgo(data.passwordChangedAt) }), routeId: 'route.security.password' },
    { icon: 'key',    name: t('security.backupCodes'),       desc: t('security.backupCodesSub', { generated: data.backupCodesGenerated, unused: data.backupCodesUnused }), routeId: 'route.security.backup-codes' },
    { icon: 'eye',    name: t('security.antiPhishing'),       desc: `"${data.antiPhishingCode}"` },
    { icon: 'clock',  name: t('security.loginHistory'),       desc: t('security.loginHistorySub'), routeId: 'route.security.sessions' },
    { icon: 'user',   name: t('security.sessions'),           desc: t('security.sessionsSub', { count: data.activeSessions }), routeId: 'route.security.sessions' },
    { icon: 'pin',    name: t('security.trustedDevices'),     desc: t('security.trustedDevicesSub'), routeId: 'route.security.sessions' },
    { icon: 'phone',  name: t('security.phoneVerification'),  desc: '+234 ****5678', rightLabel: '✓', rightTone: 'g' },
  ]

  const rating = data.score >= 90 ? t('security.ratingExcellent') : data.score >= 70 ? t('security.ratingGood') : t('security.ratingImprove')

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.title')} />

      <div className="ring" style={{ margin: '14px auto' }}>
        <div className="rv">{data.score}</div>
        <div className="rl">{t('security.scoreOf100', { rating })}</div>
      </div>

      <div className="g" style={{ padding: 8, marginTop: 4, borderLeft: '3px solid var(--gl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="grn">✓</span>
          <div className="t3" style={{ lineHeight: 1.4 }}>
            <span className="grn">{t('security.goodScore')}</span> {data.twoFAEnabled ? t('security.completeKyc') : t('security.enable2fa')} {t('security.toReach')}
          </div>
        </div>
      </div>

      {rows.map(r => (
        <button key={r.name} onClick={() => r.routeId && nav(ROUTES[r.routeId].path)} className="li" style={{ width: '100%', textAlign: 'left', cursor: r.routeId ? 'pointer' : 'default' }}>
          <div className="li-i"><Icon name={r.icon} size={16} /></div>
          <div className="li-c">
            <div className="li-n">{r.name}</div>
            <div className="li-s">{r.desc}</div>
          </div>
          <div className="li-r">
            {r.rightLabel && <span className={`badge badge-${r.rightTone}`} style={{ fontSize: 9 }}>{r.rightLabel}</span>}
            {!r.rightLabel && r.routeId && <span className="t3" style={{ fontSize: 14, color: 'var(--text-mid-30)' }}>›</span>}
          </div>
        </button>
      ))}

      <div className="li">
        <div className="li-i"><Icon name="fp" size={16} /></div>
        <div className="li-c">
          <div className="li-n">{t('security.biometricLock')}</div>
          <div className="li-s">{t('security.biometricLockSub')}</div>
        </div>
        <button className={`tgl ${data.biometricEnabled ? 'on' : 'off'}`} aria-label="Biometric" />
      </div>

      <div className="g" style={{ padding: 8, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">💡</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="gld">{t('security.tipPrefix')}</span> {t('security.tipNeverShare')}
        </div>
      </div>
    </PhoneShell>
  )
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}
