import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { useAuth } from '../../stores/auth'
import { ROUTES } from '../../routes'
import type { KYCSubmission } from '../../mock/db'

export function KYCStatus() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const { data } = useEndpoint<KYCSubmission>('api.user.kyc.status')

  const level = data?.level ?? user?.kycLevel ?? 0
  const status = data?.status ?? user?.kycStatus ?? 'unverified'

  const levelInfo = (lvl: 1 | 2 | 3) =>
    lvl === 1 ? [t('kyc.lvl1'), t('kyc.lvl1Sub'), t('kyc.lvl1Limit')] :
    lvl === 2 ? [t('kyc.lvl2'), t('kyc.lvl2Sub'), t('kyc.lvl2Limit')] :
    [t('kyc.lvl3'), t('kyc.lvl3Sub'), t('kyc.lvl3Limit')]

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('kyc.kycVerification')} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="ic" style={{ width: 64, height: 64, margin: '0 auto', background: 'rgba(0,200,83,.15)', boxShadow: '0 0 20px rgba(0,200,83,.2)' }}>
          <Icon name="shield" size={32} />
        </div>
        <div className="badge badge-g" style={{ marginTop: 8, fontSize: 11 }}>{t('kyc.levelStatus', { level, status: status.toUpperCase() })}</div>
        <h2 style={{ marginTop: 6 }}>{user ? `${user.firstName} ${user.lastName}` : 'Joseph Obasi'}</h2>
        <div className="t3">DOB Mar 14, 1992 · Nigeria 🇳🇬</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('kyc.verificationLevels')}</h3>
      {([1, 2, 3] as const).map(lvl => {
        const state: 'd' | 'a' | '-' = level > lvl ? 'd' : level === lvl ? 'a' : '-'
        const desc = levelInfo(lvl)
        return (
          <div key={lvl} className="g" style={{ padding: 12, margin: '4px 0', borderLeft: state === 'a' ? '3px solid var(--gl)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="step"><div className={`sn ${state}`}>{state === 'd' ? '✓' : lvl}</div></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {t('kyc.level')} {lvl} · {desc[0]} {state === 'a' && <span className="badge badge-g" style={{ fontSize: 8, marginLeft: 4 }}>{t('kyc.currentBadge')}</span>}
                </div>
                <div className="t3">{desc[1]}</div>
                <div className="t3" style={{ marginTop: 1, color: 'var(--gl)' }}>{t('kyc.limitPrefix')} {desc[2]}</div>
              </div>
              {state === '-' && <div className="badge badge-gd" style={{ fontSize: 9 }}>{t('kyc.upgradeBadge')}</div>}
            </div>
          </div>
        )
      })}

      <h3 style={{ marginTop: 8 }}>{t('kyc.benefitsUnlocked')}</h3>
      <div className="g" style={{ padding: 10 }}>
        {[
          ['✓', t('kyc.benefit1'), 'g'],
          ['✓', t('kyc.benefit2'), 'g'],
          ['✓', t('kyc.benefit3'), 'g'],
          ['○', t('kyc.benefit4'), 't3'],
          ['○', t('kyc.benefit5'), 't3'],
        ].map(([c, label, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0', fontSize: 13 }}>
            <span style={{ color: col === 'g' ? 'var(--gl)' : 'var(--text-mid-30)', fontWeight: 700 }}>{c}</span>
            <span style={{ color: col === 'g' ? 'var(--text-strong)' : 'var(--text-mid-40)' }}>{label}</span>
          </div>
        ))}
      </div>

      {level < 3 && (
        <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => nav(ROUTES['route.kyc.flow'].path)}>
          {t('kyc.upgradeToLevel', { level: level + 1 })}
        </button>
      )}
    </PhoneShell>
  )
}
