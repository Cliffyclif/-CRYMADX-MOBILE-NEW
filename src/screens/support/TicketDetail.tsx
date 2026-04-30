import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { SupportTicket, SupportTicketMessage } from '../../mock/db'

export function TicketDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { ticketId = '' } = useParams()
  const { data } = useEndpoint<{ ticket: SupportTicket; messages: SupportTicketMessage[] }>('api.support.tickets.detail', { pathParams: { ticketId } })
  const reply = useEndpointMutation('api.support.tickets.reply', { invalidates: ['api.support.tickets.detail'] })
  const [draft, setDraft] = useState('')

  if (!data) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    await reply.mutateAsync({ pathParams: { ticketId }, body: { body: draft } })
    setDraft('')
  }

  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime()
    const h = Math.floor(ms / 3_600_000)
    if (h < 24) return t('support.hourAgoSupport', { n: h })
    return t('support.dayAgoSupport', { n: Math.floor(ms / 86_400_000) })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>{data.ticket.id}</div>
          <div className="t3">{data.ticket.subject}</div>
        </div>
        <span className={`badge badge-${data.ticket.status === 'open' ? 'g' : data.ticket.status === 'awaiting' ? 'gd' : ''}`} style={{ fontSize: 9 }}>{data.ticket.status.toUpperCase()}</span>
      </div>

      <div className="t3" style={{ marginTop: 6 }}>{data.ticket.team} · {t('support.messagesCount', { count: data.messages.length })} · {t('support.lastReply', { when: relativeTime(data.ticket.updatedAt) })}</div>

      {data.ticket.meta && (
        <div className="g" style={{ padding: 10, marginTop: 8, background: 'rgba(212,165,60,.04)' }}>
          <div className="gld" style={{ fontSize: 13, fontWeight: 700 }}>{t('support.orderRef')}</div>
          {Object.entries(data.ticket.meta).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '2px 0' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, flex: 1 }}>
        {data.messages.map(m => (
          <div key={m.id} className={`bub bub-${m.authorRole === 'user' ? 'u' : 'ai'}`}>
            {m.authorRole === 'agent' && <div className="t3" style={{ marginBottom: 2 }}>{m.authorName} · {relativeTime(m.createdAt)}</div>}
            {m.body}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="inp" style={{ marginTop: 8, padding: 8 }}>
        <Icon name="paperclip" size={14} />
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={t('support.typeMessage')} style={{ flex: 1 }} />
        <button type="submit" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 0 }} disabled={!draft.trim() || reply.isPending}>
          <Icon name="send" size={14} color="var(--gl)" />
        </button>
      </form>

      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }}><Icon name="check" size={10} /> {t('support.markResolved')}</button>
        <button className="btn btn-r" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }}>{t('support.reopenIssue')}</button>
      </div>
    </PhoneShell>
  )
}
