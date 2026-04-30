import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { SupportTicket } from '../../mock/db'

const TABS = ['open', 'closed', 'all'] as const

export function Tickets() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('open')
  const { data } = useEndpoint<{ items: SupportTicket[] }>('api.support.tickets.list')

  const items = (data?.items ?? []).filter(tk => tab === 'all' ? true : tab === 'open' ? tk.status !== 'closed' : tk.status === 'closed')
  const counts = {
    open: (data?.items ?? []).filter(tk => tk.status !== 'closed').length,
    closed: (data?.items ?? []).filter(tk => tk.status === 'closed').length,
    all: data?.items?.length ?? 0,
  }

  const tabLabel = (k: typeof TABS[number]) => {
    const label = k === 'open' ? t('support.tabOpen') : k === 'closed' ? t('support.tabClosed') : t('support.tabAll')
    return t('support.tabCount', { label, count: counts[k] })
  }

  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime()
    const h = Math.floor(ms / 3_600_000)
    if (h < 24) return t('support.hourAgoSupport', { n: h })
    return t('support.dayAgoSupport', { n: Math.floor(ms / 86_400_000) })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('support.supportTickets')}</h2>
        <button onClick={() => nav(ROUTES['route.support.contact'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="plus" size={16} color="var(--gl)" />
        </button>
      </div>
      <div className="t2">{t('support.yourConversations')}</div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {items.map(tk => {
        const tone = tk.status === 'open' ? 'g' : tk.status === 'awaiting' ? 'gd' : '-'
        const tint = tone === 'g' ? '0,200,83' : tone === 'gd' ? '212,165,60' : '255,255,255'
        const color = tone === 'g' ? 'var(--gl)' : tone === 'gd' ? 'var(--gd)' : 'var(--text-mid-40)'
        const icon: IconName = tone === 'g' ? 'msg' : tone === 'gd' ? 'clock' : 'check'
        return (
          <button key={tk.id} onClick={() => nav(routeFor('route.support.ticket', { ticketId: tk.id }))} className="li" style={{ background: tk.unread ? 'rgba(0,200,83,.04)' : undefined, borderLeft: tk.unread ? '3px solid var(--gl)' : undefined, width: '100%', textAlign: 'left' }}>
            <div className="li-i" style={{ background: `rgba(${tint},.06)` }}>
              <Icon name={icon} size={14} color={color} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{tk.id} {tk.subject}</div>
              <div className="li-s">{tk.status === 'closed' ? t('support.statusClosedLabel') : tk.status === 'awaiting' ? t('support.awaitingReply') : t('support.teamReplied', { team: tk.team })} · {relativeTime(tk.updatedAt)}</div>
            </div>
            <div className="li-r">
              <div className={`badge badge-${tone === 'g' ? 'g' : tone === 'gd' ? 'gd' : ''}`} style={{ fontSize: 8 }}>
                {tk.status === 'open' ? t('support.badgeUpdated') : tk.status === 'awaiting' ? t('support.badgeAwaiting') : t('support.badgeResolved')}
              </div>
            </div>
          </button>
        )
      })}

      <div className="g" style={{ padding: 12, marginTop: 8, textAlign: 'center' }}>
        <div className="t2">{t('support.needUrgentHelp')}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }}><Icon name="msg" size={10} /> {t('support.liveChat')}</button>
          <button className="btn btn-g" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
            <Icon name="mail" size={10} color="#fff" /> {t('support.newTicket')}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
