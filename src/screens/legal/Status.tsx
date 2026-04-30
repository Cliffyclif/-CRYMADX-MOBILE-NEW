import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'

type ServiceStatus = { id: string; name: string; status: 'operational' | 'degraded' | 'outage'; uptime: string }
type Status = { overall: string; services: ServiceStatus[] }

const RECENT_INCIDENTS: Array<['g' | 'gd' | 'r', string, string]> = [
  ['gd', 'AI Assistant slower responses',   'Investigating · 18 min ago'],
  ['g',  'API rate limit issue resolved',   'Resolved · 2h ago'],
  ['g',  'Maintenance window completed',    'Completed · 1d ago'],
]

export function Status() {
  const { data, refetch } = useEndpoint<Status>('api.system.status')

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>System Status</h2>
        <button onClick={() => refetch()} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="refresh" size={16} />
        </button>
      </div>

      <div className="g" style={{ padding: 14, textAlign: 'center', background: 'rgba(0,200,83,.05)' }}>
        <div className="ic" style={{ width: 60, height: 60, margin: '0 auto', background: 'rgba(0,200,83,.2)', boxShadow: '0 0 20px rgba(0,200,83,.3)' }}>
          <Icon name="check" size={32} />
        </div>
        <div className="badge badge-g" style={{ marginTop: 8, fontSize: 11 }}>ALL SYSTEMS OPERATIONAL</div>
        <div className="t2" style={{ marginTop: 6 }}>Last updated 2 minutes ago</div>
      </div>

      <h3 style={{ marginTop: 10 }}>Services</h3>
      {data?.services?.map(s => {
        const ok = s.status === 'operational'
        const tone = ok ? 'g' : s.status === 'degraded' ? 'gd' : 'r'
        const tint = tone === 'g' ? '0,200,83' : tone === 'gd' ? '212,165,60' : '239,68,68'
        const color = tone === 'g' ? 'var(--gl)' : tone === 'gd' ? 'var(--gd)' : 'var(--r)'
        return (
          <div key={s.id} className="li">
            <div className="li-i" style={{ background: `rgba(${tint},.1)`, width: 30, height: 30 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
            </div>
            <div className="li-c">
              <div className="li-n">{s.name}</div>
              <div className="li-s">{s.status === 'operational' ? 'Operational' : s.status === 'degraded' ? 'Degraded · slower responses' : 'Outage'}</div>
            </div>
            <div className="li-r">
              <div className="grn" style={{ fontSize: 13, fontWeight: 700 }}>{s.uptime}</div>
              <div className="li-d">90d</div>
            </div>
          </div>
        )
      })}

      <h3 style={{ marginTop: 8 }}>Recent Incidents</h3>
      {RECENT_INCIDENTS.map(([tone, t, d], i) => {
        const tint = tone === 'g' ? '0,200,83' : '212,165,60'
        const icon: IconName = tone === 'g' ? 'check' : 'clock'
        return (
          <div key={i} className="li">
            <div className="li-i" style={{ background: `rgba(${tint},.1)`, width: 28, height: 28 }}>
              <Icon name={icon} size={12} color={tone === 'g' ? 'var(--gl)' : 'var(--gd)'} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{t}</div>
              <div className="li-s">{d}</div>
            </div>
          </div>
        )
      })}

      <button className="btn btn-o" style={{ marginTop: 8 }}><Icon name="bell" size={12} /> Subscribe to Updates</button>
    </PhoneShell>
  )
}
