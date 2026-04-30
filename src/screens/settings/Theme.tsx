import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useTheme } from '../../stores/theme'
import { useDisplay, type DisplaySize } from '../../stores/display'

const ACCENTS = [
  ['#1B8C3E', 'Wave Green', true],
  ['#0066ff', 'Ocean',      false],
  ['#9333ea', 'Royal',      false],
  ['#ec4899', 'Sunset',     false],
  ['#f59e0b', 'Sun',        false],
  ['#06b6d4', 'Teal',       false],
] as const

export function Theme() {
  const { t } = useTranslation()
  const theme = useTheme(s => s.theme)
  const setTheme = useTheme(s => s.setTheme)
  const size = useDisplay(s => s.size)
  const setSize = useDisplay(s => s.set)

  const MODES: Array<[IconName, 'dark' | 'light' | 'system', string, string]> = [
    ['moon',     'dark',   t('settings.themeDark'),   'Always dark'],
    ['sun',      'light',  t('settings.themeLight'),  'Always light'],
    ['settings', 'system', t('settings.themeSystem'), 'Follow device setting'],
  ]

  const SIZES: Array<{ id: DisplaySize; label: string; preview: number }> = [
    { id: 'small',  label: t('settings.small'),  preview: 12 },
    { id: 'medium', label: t('settings.medium'), preview: 14 },
    { id: 'large',  label: t('settings.large'),  preview: 17 },
  ]

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.theme')} />
      <div className="t2">Choose how CrymadX looks</div>

      <h3 style={{ marginTop: 14 }}>Mode</h3>
      {MODES.map(([icon, mode, name, desc]) => (
        <button key={mode} onClick={() => mode !== 'system' && setTheme(mode)} className="g" style={{ padding: 14, margin: '6px 0', width: '100%', textAlign: 'left', borderLeft: theme === mode ? '3px solid var(--gl)' : undefined, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="li-i"><Icon name={icon} size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: 'var(--text-strong)', fontWeight: 700 }}>{name}</div>
              <div className="t3">{desc}</div>
            </div>
            {theme === mode ? <div className="grn" style={{ fontSize: 18 }}>●</div> : <div className="t3" style={{ fontSize: 18 }}>○</div>}
          </div>
        </button>
      ))}

      <h3 style={{ marginTop: 14 }}>{t('settings.displaySize')}</h3>
      <div className="t3" style={{ marginBottom: 8 }}>{t('settings.displaySizeSubtitle')}</div>
      <div className="g" style={{ padding: 6 }}>
        {SIZES.map(s => (
          <button
            key={s.id}
            onClick={() => setSize(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '12px 10px', cursor: 'pointer', textAlign: 'left',
              background: size === s.id ? 'rgba(0,200,83,.06)' : 'transparent',
              border: 'none',
              borderLeft: size === s.id ? '3px solid var(--gl)' : '3px solid transparent',
            }}
          >
            {/* Preview "Aa" sized to match the option */}
            <div
              style={{
                width: 44, height: 44, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: s.preview, fontWeight: 800,
                color: 'var(--text-strong)',
              }}
            >
              Aa
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>{s.label}</div>
              <div className="t3">
                {s.id === 'small' && '100% · default'}
                {s.id === 'medium' && '112% · easier to read'}
                {s.id === 'large' && '125% · accessibility'}
              </div>
            </div>
            {size === s.id
              ? <Icon name="check" size={16} color="var(--gl)" />
              : <div className="t3" style={{ fontSize: 14 }}>○</div>}
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: 14 }}>Accent Color</h3>
      <div className="g" style={{ padding: 14 }}>
        <div className="t3" style={{ marginBottom: 8 }}>Select your preferred accent</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {ACCENTS.map(([col, n, a]) => (
            <div key={n as string} style={{ textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: col as string, margin: '0 auto', boxShadow: a ? `0 0 0 3px rgba(255,255,255,.4), 0 0 12px ${col}` : undefined }} />
              <div className="t3" style={{ fontSize: 9, marginTop: 4 }}>{n}</div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: 14 }}>Accessibility</h3>
      <div className="g" style={{ padding: 2 }}>
        {[
          ['Reduce motion', 'Animations off', false],
          ['Bold text',     'Stronger weights', false],
          ['High contrast', 'For readability', false],
        ].map(([n, d, on]) => (
          <div key={n as string} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10 }}>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
              <div className="li-s">{d}</div>
            </div>
            <button className={`tgl ${on ? 'on' : 'off'}`} aria-label={n as string} />
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}
