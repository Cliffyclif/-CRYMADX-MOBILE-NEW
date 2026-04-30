import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { resetDb } from '../../mock/db'
import { ROUTES } from '../../routes'

const ENV_ROWS: Array<[IconName, string, string, string]> = [
  ['globe',    'Environment',    'prod-eu-west-1',     '▾'],
  ['link',     'API Endpoint',   'api.crymadx.io/v2',   '▾'],
  ['settings', 'Build Type',     'release',             '—'],
  ['target',   'Feature Flags',  '12 enabled · 4 off',  '›'],
]

const TOOLS: Array<[IconName, string, string, () => void]> = [
  ['refresh', 'Clear Cache',          'Force fresh API calls', () => location.reload()],
  ['trash',   'Wipe Local Storage',   'Logs you out',          () => { localStorage.clear(); location.href = '/' }],
  ['archive', 'Export Logs',          'Last 24h · debug.log',  () => {}],
  ['mic',     'Force Crash',          'Test crash reporting',  () => { throw new Error('Test crash from Debug') }],
  ['x',       'Reset Onboarding',     'See onboarding again',  () => { localStorage.removeItem('crymadx.onboarded'); location.href = '/onboarding' }],
  ['dl',      'Download Build',       'APK / IPA mirror',      () => {}],
]

export function Debug() {
  const nav = useNavigate()

  const onResetMock = () => {
    resetDb()
    location.reload()
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Developer / Debug" actions={<span className="badge badge-r" style={{ fontSize: 10 }}>HIDDEN</span>} />
      <div className="t3">Long-press the logo 7 times to access</div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--r)' }}>
        <span className="red">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="red">For internal use only.</span> Don't show this menu in production builds.
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>Environment</h3>
      <div className="g" style={{ padding: 2 }}>
        {ENV_ROWS.map(([icon, n, v, a]) => (
          <div key={n} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10 }}>
            <div className="li-i" style={{ width: 28, height: 28 }}><Icon name={icon} size={12} /></div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
              <div className="li-s" style={{ fontFamily: 'monospace', fontSize: 10 }}>{v}</div>
            </div>
            <div className="li-r" style={{ color: 'var(--text-mid-40)', fontSize: 14 }}>{a}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 10 }}>Tools</h3>
      <div className="g" style={{ padding: 2 }}>
        <button onClick={onResetMock} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'rgba(0,200,83,.04)', padding: 10, width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 28, height: 28 }}><Icon name="refresh" size={12} /></div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>Reset Demo Data</div>
            <div className="li-s">Wipes localStorage and reseeds the mock DB</div>
          </div>
        </button>
        {TOOLS.map(([icon, n, d, fn]) => (
          <button key={n} onClick={fn} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10, width: '100%', textAlign: 'left' }}>
            <div className="li-i" style={{ width: 28, height: 28 }}><Icon name={icon} size={12} /></div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
              <div className="li-s">{d}</div>
            </div>
          </button>
        ))}
        <button onClick={() => nav(ROUTES['route.system.offline'].path)} className="li" style={{ margin: 0, borderRadius: 0, boxShadow: 'none', background: 'transparent', padding: 10, width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 28, height: 28 }}><Icon name="cloud-off" size={12} /></div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>Test Offline Screen</div>
            <div className="li-s">Preview /offline state</div>
          </div>
        </button>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, fontSize: 10, fontFamily: 'monospace', color: 'var(--text-mid-40)', lineHeight: 1.4 }}>
        CrymadX 2.1.0 (build 4821)<br />
        RN 0.74 · Capacitor 6 · iOS 17.4<br />
        Device: iPhone 14 Pro · Hash: a8f3...def8<br />
        Last sync: 14:22:08 GMT
      </div>
    </PhoneShell>
  )
}
