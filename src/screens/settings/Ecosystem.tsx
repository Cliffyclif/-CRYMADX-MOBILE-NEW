import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'

const APPS: Array<[string, string, string, string, 'g' | 'gd' | '-']> = [
  ['🏦', 'Crymad Cash',      'Borderless banking · NGN/USD wallet',     'Connected · Synced',   'g' ],
  ['📈', 'CrymadX Pro',      'Advanced charting · Pro trader tools',    'Available · Free with L3', 'gd'],
  ['🎓', 'Crymad Academy',   'Learn crypto · Earn certificates',        'Open · Public',         'gd'],
  ['🚀', 'Crymad Launchpad', 'Token launches · Early access',           'VIP only',              '-' ],
  ['🤝', 'Crymad OTC',       'Large block trading · Concierge',         'OTC tier · Apply',      '-' ],
]

const PARTNERS = ['MetaMask', 'Phantom', 'Trust', 'Ledger', 'Trezor', 'Wise']

export function Ecosystem() {
  const { t } = useTranslation()
  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.ecosystem')} />
      <div className="t2">{t('settings.ecoFamily')}</div>

      <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(27,140,62,.1), rgba(0,200,83,.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/crymadx-mark.png" alt="" style={{ width: 40, height: 40 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 800 }}>CrymadX</div>
            <div className="t3">{t('settings.ecoYouAreHere')}</div>
          </div>
          <span className="badge badge-g" style={{ fontSize: 9 }}>{t('settings.ecoCurrent')}</span>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('settings.connectedApps')}</h3>
      {APPS.map(([emoji, n, d, s, c]) => (
        <div key={n} className="g" style={{ padding: 12, margin: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="li-i" style={{ background: c === 'g' ? 'rgba(0,200,83,.08)' : 'rgba(212,165,60,.08)' }}>
              <span style={{ fontSize: 18 }}>{emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{n}</div>
              <div className="t3">{d}</div>
              <div className="t3" style={{ marginTop: 2, color: c === 'g' ? 'var(--gl)' : 'var(--gd)' }}>{s}</div>
            </div>
            <Icon name="ext" size={12} color="var(--text-mid-40)" />
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('settings.partnerIntegrations')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {PARTNERS.map(p => (
          <div key={p} className="g" style={{ padding: 10, textAlign: 'center' }}>
            <div className="ic" style={{ width: 32, height: 32, margin: '0 auto' }}><Icon name="link" size={14} /></div>
            <div className="t2" style={{ fontSize: 11, marginTop: 4 }}>{p}</div>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}
