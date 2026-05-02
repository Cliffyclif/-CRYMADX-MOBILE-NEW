import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, type RouteId } from '../../routes'

const VERSION = '2.1.0'
const BUILD = '4821'
const RELEASED = 'Apr 28, 2026'

const CONNECT: Array<[IconName, string, string, string]> = [
  // [icon, label, sub-text, href]
  ['globe', 'Website',     'crymadx.io',           'https://crymadx.io'],
  ['msg',   'X / Twitter', '@crymadxhq',           'https://x.com/crymadxhq'],
  ['users', 'Discord',     'discord.gg/crymadx',   'https://discord.gg/crymadx'],
  ['phone', 'Telegram',    't.me/crymadx_official','https://t.me/crymadx_official'],
  ['mail',  'Support',     'support@crymadx.io',   'mailto:support@crymadx.io'],
  ['target','Status',      'status.crymadx.io',    'https://status.crymadx.io'],
]

const LEGAL: Array<[string, string, RouteId]> = [
  ['Terms of Service',  'v3.2',         'route.legal.terms'],
  ['Privacy Policy',    'v2.8',         'route.legal.privacy'],
  ['Cookie Policy',     'v1.4',         'route.legal.cookies'],
]

export function About() {
  const nav = useNavigate()

  const openExternal = (href: string) => {
    if (!href) return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="About" />

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <img src="/crymadx-full.png" alt="" style={{ width: 200, marginBottom: 6 }} />
        <div className="t3" style={{ letterSpacing: 2 }}>TRADE THE FUTURE OF FINANCE</div>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 14 }}>
        {[
          ['Version', `${VERSION} (build ${BUILD})`],
          ['Released', RELEASED],
          ['Platform', 'iOS · Android · Web'],
          ['Code', 'Capacitor + React + TS'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-o" style={{ marginTop: 8 }} onClick={() => openExternal('https://crymadx.io/download')}>
        <Icon name="refresh" size={12} /> Check for Update
      </button>

      <h3 style={{ marginTop: 10 }}>Connect</h3>
      {CONNECT.map(([icon, n, d, href]) => (
        <button
          key={n}
          onClick={() => openExternal(href)}
          className="li"
          style={{ padding: 10, width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left' }}
        >
          <div className="li-i" style={{ width: 28, height: 28 }}><Icon name={icon} size={14} /></div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
            <div className="li-s">{d}</div>
          </div>
          <div className="li-r"><Icon name="ext" size={12} color="var(--gl)" /></div>
        </button>
      ))}

      <h3 style={{ marginTop: 10 }}>Legal</h3>
      <div className="g" style={{ padding: 2 }}>
        {LEGAL.map(([n, v, route]) => (
          <button
            key={n}
            onClick={() => nav(ROUTES[route].path)}
            className="li"
            style={{
              margin: 0, borderRadius: 0,
              borderBottom: '1px solid var(--divider-soft)',
              boxShadow: 'none', background: 'transparent', padding: 8,
              width: '100%', border: 'none', borderBottomStyle: 'solid',
              borderBottomWidth: 1, borderBottomColor: 'var(--divider-soft)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{n}</div></div>
            <div className="li-r" style={{ fontSize: 11, color: 'var(--text-mid-40)' }}>{v} ›</div>
          </button>
        ))}
      </div>

      <div className="t3" style={{ textAlign: 'center', marginTop: 14 }}>
        © 2026 Cryptomadness Group<br />
        Made in Lagos
      </div>
    </PhoneShell>
  )
}
