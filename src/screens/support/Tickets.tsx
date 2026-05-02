import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'

const TABS = ['open', 'closed', 'all'] as const
type Tab = typeof TABS[number]

// Backend statuses: open | in_progress | resolved | closed
type RawTicket = {
  id: string
  subject: string
  category?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'awaiting' | string
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string
  createdAt?: string
  updatedAt?: string
  messages?: number
  unread?: boolean
}

const statusBucket = (s: string): 'open' | 'closed' => {
  return (s === 'closed' || s === 'resolved') ? 'closed' : 'open'
}

const statusLabel = (s: string): string => {
  if (s === 'closed' || s === 'resolved') return 'Resolved'
  if (s === 'in_progress') return 'Awaiting'
  if (s === 'open') return 'Updated'
  return s
}

const statusTone = (s: string): 'g' | 'gd' | 'plain' => {
  if (s === 'closed' || s === 'resolved') return 'plain'
  if (s === 'in_progress' || s === 'awaiting') return 'gd'
  return 'g'
}

const relativeTime = (iso?: string): string => {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${Math.max(1, m)} min ago`
  const h = Math.floor(ms / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(ms / 86_400_000)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Tickets() {
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('open')
  const { data, isLoading } = useEndpoint<{ items: RawTicket[] }>('api.support.tickets.list')

  const all = data?.items ?? []
  const items = all.filter(tk => tab === 'all' ? true : statusBucket(tk.status) === tab)
  const counts = {
    open: all.filter(tk => statusBucket(tk.status) === 'open').length,
    closed: all.filter(tk => statusBucket(tk.status) === 'closed').length,
    all: all.length,
  }

  const tabLabel = (k: Tab) => {
    const n = k === 'open' ? counts.open : k === 'closed' ? counts.closed : counts.all
    return `${k === 'open' ? 'Open' : k === 'closed' ? 'Closed' : 'All'} (${n})`
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <Icon name="arrow-l" size={18} />
        </button>
        <h2 style={{ flex: 1, margin: 0 }}>Support Tickets</h2>
        <button
          onClick={() => nav(ROUTES['route.support.contact'].path)}
          aria-label="New Ticket"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="plus" size={16} color="var(--gl)" />
        </button>
      </div>
      <div className="t2">Your conversations with our team</div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {isLoading && (
        <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">Loading…</div>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div className="ic" style={{ width: 48, height: 48, margin: '0 auto', background: 'rgba(0,200,83,.08)' }}>
            <Icon name="msg" size={20} color="var(--gl)" />
          </div>
          <h3 style={{ marginTop: 10, fontSize: 15 }}>{tab === 'closed' ? 'No closed tickets' : tab === 'all' ? 'No tickets yet' : 'No open tickets'}</h3>
          <div className="t3" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {tab === 'closed' ? 'Tickets you resolve will show up here.' : 'Got a question? Open a new ticket and our team will reply within ~2 hours.'}
          </div>
          <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
            <Icon name="plus" size={12} color="#fff" /> New Ticket
          </button>
        </div>
      )}

      {items.map(tk => {
        const tone = statusTone(tk.status)
        const tint = tone === 'g' ? '0,200,83' : tone === 'gd' ? '212,165,60' : '255,255,255'
        const color = tone === 'g' ? 'var(--gl)' : tone === 'gd' ? 'var(--gd)' : 'var(--text-mid-40)'
        const icon: IconName = tone === 'g' ? 'msg' : tone === 'gd' ? 'clock' : 'check'
        return (
          <button
            key={tk.id}
            onClick={() => nav(routeFor('route.support.ticket', { ticketId: tk.id }))}
            className="li"
            style={{
              background: tk.unread ? 'rgba(0,200,83,.04)' : undefined,
              borderLeft: tk.unread ? '3px solid var(--gl)' : undefined,
              width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
            }}
          >
            <div className="li-i" style={{ background: `rgba(${tint},.06)` }}>
              <Icon name={icon} size={14} color={color} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>#{tk.id.slice(0, 8)} {tk.subject}</div>
              <div className="li-s">{tk.category ?? 'Support'} · {relativeTime(tk.updatedAt)}</div>
            </div>
            <div className="li-r">
              <div className={`badge ${tone === 'g' ? 'badge-g' : tone === 'gd' ? 'badge-gd' : ''}`} style={{ fontSize: 8 }}>
                {statusLabel(tk.status).toUpperCase()}
              </div>
            </div>
          </button>
        )
      })}

      <div className="g" style={{ padding: 12, marginTop: 12, textAlign: 'center' }}>
        <div className="t2">Need urgent help?</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            type="button"
            disabled
            className="btn btn-o"
            style={{ flex: 1, padding: 8, fontSize: 13, margin: 0, position: 'relative', opacity: 0.65, cursor: 'not-allowed' }}
            aria-label="Live Chat — coming soon"
          >
            <Icon name="msg" size={10} /> Live Chat
            <span
              style={{
                position: 'absolute', top: -6, right: -4,
                background: 'var(--gd)', color: '#000',
                fontSize: 9, fontWeight: 800, padding: '2px 6px',
                borderRadius: 8, lineHeight: 1,
              }}
            >
              SOON
            </span>
          </button>
          <button className="btn btn-g" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
            <Icon name="mail" size={10} color="#fff" /> New Ticket
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
