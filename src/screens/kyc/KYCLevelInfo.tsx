import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { ROUTES } from '../../routes'

export function KYCLevelInfo() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const LEVELS = [
    { id: 1, name: `${t('kyc.level')} 1`, sub: t('kyc.lvl1'),    docs: t('kyc.lvl1Sub'), state: 'd' as const, limits: [['$1,000', t('kyc.limitDaily')], ['$5,000', t('kyc.limitMonthly')], [t('kyc.limitTrade'), 'Yes'], [t('kyc.limitP2P'), 'Limited'], [t('kyc.limitCard'), 'No'], [t('kyc.limitOTC'), 'No']] },
    { id: 2, name: `${t('kyc.level')} 2`, sub: t('kyc.lvl2'),    docs: t('kyc.lvl2Sub'), state: 'a' as const, limits: [['$50,000', t('kyc.limitDaily')], ['$250,000', t('kyc.limitMonthly')], [t('kyc.limitTrade'), 'Yes'], [t('kyc.limitP2P'), 'Full'], [t('kyc.limitCard'), 'Yes ✓'], [t('kyc.limitOTC'), 'No']] },
    { id: 3, name: `${t('kyc.level')} 3`, sub: t('kyc.lvl3'),    docs: t('kyc.lvl3Sub'), state: '-' as const, limits: [['$500,000', t('kyc.limitDaily')], ['$2,500,000', t('kyc.limitMonthly')], [t('kyc.limitTrade'), 'Unlimited'], [t('kyc.limitP2P'), 'Priority'], [t('kyc.limitCard'), 'Higher limit'], [t('kyc.limitOTC'), 'Yes ✓']] },
  ]

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('kyc.verLevels')} />
      <div className="t2">{t('kyc.higherLimits')}</div>

      {LEVELS.map(lvl => (
        <div key={lvl.id} className="g" style={{ padding: 14, margin: '6px 0', borderLeft: lvl.state === 'a' ? '3px solid var(--gl)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="step"><div className={`sn ${lvl.state}`}>{lvl.state === 'd' ? '✓' : lvl.id}</div></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
                {lvl.name} <span className="t3" style={{ fontSize: 13, fontWeight: 600 }}>· {lvl.sub}</span>
              </div>
              <div className="t3" style={{ fontSize: 10, letterSpacing: 1, marginTop: 2 }}>{lvl.docs}</div>
            </div>
            {lvl.state === 'd' && <span className="badge badge-g" style={{ fontSize: 8 }}>{t('kyc.doneBadge')}</span>}
            {lvl.state === 'a' && <span className="badge badge-g" style={{ fontSize: 8 }}>{t('kyc.currentBadge')}</span>}
          </div>
          {lvl.limits.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '2px 0' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
          {lvl.state === '-' && (
            <button className="btn btn-g" style={{ marginTop: 8, padding: 8, fontSize: 14 }} onClick={() => nav(ROUTES['route.kyc.flow'].path)}>
              {t('kyc.upgradeTo', { name: lvl.name })}
            </button>
          )}
        </div>
      ))}
    </PhoneShell>
  )
}
