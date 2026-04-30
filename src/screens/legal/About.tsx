import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'

const CONNECT: Array<[IconName, string, string]> = [
  ['globe', 'Website',     'crymadx.io'],
  ['msg',   'X / Twitter', '@crymadxhq'],
  ['users', 'Discord',     'discord.gg/crymadx'],
  ['phone', 'Telegram',    't.me/crymadx_official'],
  ['mail',  'Support',     'support@crymadx.io'],
  ['target','Status',      'status.crymadx.io'],
]

const LEGAL = [
  ['Terms of Service',         'v3.2'],
  ['Privacy Policy',           'v2.8'],
  ['Cookie Policy',            '—'],
  ['Licenses',                 'Open-source'],
  ['Regulatory Disclosures',   'SEC · FCA · CBN'],
]

export function About() {
  return (
    <PhoneShell noTabs>
      <ScreenHeader title="About" />

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <img src="/crymadx-full.png" alt="" style={{ width: 200, marginBottom: 6 }} />
        <div className="t3" style={{ letterSpacing: 2 }}>TRADE THE FUTURE OF FINANCE</div>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 14 }}>
        {[
          ['Version', '2.1.0 (build 4821)'],
          ['Released', 'Apr 28, 2026'],
          ['Platform', 'iOS · Android · Web'],
          ['Code', 'Capacitor + React + TS'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-o" style={{ marginTop: 8 }}><Icon name="refresh" size={12} /> Check for Update</button>

      <h3 style={{ marginTop: 10 }}>Connect</h3>
      {CONNECT.map(([icon, n, d]) => (
        <div key={n} className="li" style={{ padding: 10 }}>
          <div className="li-i" style={{ width: 28, height: 28 }}><Icon name={icon} size={14} /></div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
            <div className="li-s">{d}</div>
          </div>
          <div className="li-r"><Icon name="ext" size={12} color="var(--gl)" /></div>
        </div>
      ))}

      <h3 style={{ marginTop: 10 }}>Legal</h3>
      <div className="g" style={{ padding: 2 }}>
        {LEGAL.map(([n, v]) => (
          <div key={n} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 8 }}>
            <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{n}</div></div>
            <div className="li-r" style={{ fontSize: 11, color: 'var(--text-mid-40)' }}>{v} ›</div>
          </div>
        ))}
      </div>

      <div className="t3" style={{ textAlign: 'center', marginTop: 14 }}>
        © 2026 Cryptomadness Group<br />
        Made with 💚 in Lagos
      </div>
    </PhoneShell>
  )
}
