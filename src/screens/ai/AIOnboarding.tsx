import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES } from '../../routes'

export function AIOnboarding() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const FEATURES: Array<[IconName, string, string]> = [
    ['mic',     t('ai.feat1'), t('ai.feat1Sub')],
    ['zap',     t('ai.feat2'), t('ai.feat2Sub')],
    ['archive', t('ai.feat3'), t('ai.feat3Sub')],
  ]

  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <img src="/crymadx-ai-full.png" alt="" style={{ width: 200, marginBottom: 8 }} />
        <h2 style={{ marginTop: 6 }}>{t('ai.meetCopilot')}</h2>
        <div className="t2" style={{ textAlign: 'center', marginTop: 6, lineHeight: 1.5, padding: '0 12px' }}>
          {t('ai.voiceOrText')}
        </div>

        <div className="g" style={{ padding: 12, marginTop: 14, width: '100%' }}>
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 8, margin: '6px 0', alignItems: 'center' }}>
              <div className="li-i" style={{ width: 28, height: 28 }}><Icon name={icon} size={14} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 600 }}>{title}</div>
                <div className="t3">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dots" style={{ marginTop: 12 }}>
          <div className="dot a" /><div className="dot" /><div className="dot" />
        </div>

        <button className="btn btn-g" style={{ width: '100%' }} onClick={() => nav(ROUTES['route.tab.ai'].path)}>{t('auth.getStarted')}</button>
        <div className="t3" style={{ textAlign: 'center', marginTop: 6 }}>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.tab.home'].path)}>{t('ai.skipExplore')}</span>
        </div>
      </div>
    </PhoneShell>
  )
}
