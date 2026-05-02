import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { getToken } from '../../api/client'

type Ticket = {
  id: string
  subject: string
  category?: string
  priority?: string
  status: string
  createdAt?: string
  updatedAt?: string
  meta?: Record<string, string>
}

type Message = {
  id: string
  ticketId: string
  sender: 'user' | 'support' | string
  senderName?: string
  content: string
  attachments?: string[]
  createdAt: string
}

type DetailResponse = { ticket: Ticket; messages: Message[] }

const relativeTime = (iso?: string): string => {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(ms / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(ms / 86_400_000)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const isTerminal = (s: string) => s === 'closed' || s === 'resolved'

export function TicketDetail() {
  const nav = useNavigate()
  const { ticketId = '' } = useParams()
  const { data, refetch } = useEndpoint<DetailResponse>('api.support.tickets.detail', { pathParams: { ticketId } })
  const reply = useEndpointMutation<{ pathParams: { ticketId: string }; body: { message: string; attachments: string[] } }>(
    'api.support.tickets.reply',
    { invalidates: ['api.support.tickets.detail', 'api.support.tickets.list'] },
  )
  const [draft, setDraft] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!data) {
    return (
      <PhoneShell noTabs>
        <div className="g" style={{ padding: 14 }}>
          <div className="t3">Loading…</div>
        </div>
      </PhoneShell>
    )
  }

  const ticket = data.ticket
  const messages = data.messages ?? []
  const closed = isTerminal(ticket.status)

  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return []
    const token = getToken()
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    const res = await fetch('/api/support/tickets/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Upload failed: ${txt || res.status}`)
    }
    const json = await res.json() as { urls?: string[] }
    return json.urls ?? []
  }

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!draft.trim() && pendingFiles.length === 0) return
    setError(null)
    try {
      let urls: string[] = []
      if (pendingFiles.length > 0) {
        setUploading(true)
        urls = await uploadAttachments(pendingFiles)
        setUploading(false)
      }
      await reply.mutateAsync({
        pathParams: { ticketId },
        body: {
          message: draft.trim() || (urls.length > 0 ? '(Attachment)' : ''),
          attachments: urls,
        },
      })
      setDraft('')
      setPendingFiles([])
    } catch (err) {
      setUploading(false)
      setError((err as Error).message)
    }
  }

  const reopen = async () => {
    setError(null)
    try {
      await reply.mutateAsync({
        pathParams: { ticketId },
        body: { message: 'Reopening this ticket — the issue is not resolved yet.', attachments: [] },
      })
      refetch()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const tone = ticket.status === 'open' ? 'g' : ticket.status === 'in_progress' ? 'gd' : ''

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider-soft)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>#{ticket.id.slice(0, 8)}</div>
          <div className="t3">{ticket.subject}</div>
        </div>
        <span className={`badge ${tone === 'g' ? 'badge-g' : tone === 'gd' ? 'badge-gd' : ''}`} style={{ fontSize: 9 }}>
          {ticket.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="t3" style={{ marginTop: 6 }}>
        {ticket.category ?? 'Support'} · {messages.length} messages · last reply {relativeTime(ticket.updatedAt)}
      </div>

      {ticket.meta && Object.keys(ticket.meta).length > 0 && (
        <div className="g" style={{ padding: 10, marginTop: 8, background: 'rgba(212,165,60,.04)' }}>
          <div className="gld" style={{ fontSize: 13, fontWeight: 700 }}>Order Reference</div>
          {Object.entries(ticket.meta).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '2px 0' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, flex: 1 }}>
        {messages.length === 0 ? (
          <div className="g" style={{ padding: 14, textAlign: 'center' }}>
            <div className="t3">No messages yet — write one below to start the conversation.</div>
          </div>
        ) : (
          messages.map(m => {
            const isUser = m.sender === 'user'
            return (
              <div key={m.id} className={`bub bub-${isUser ? 'u' : 'ai'}`}>
                {!isUser && <div className="t3" style={{ marginBottom: 2, fontSize: 11 }}>{m.senderName ?? 'Support Team'} · {relativeTime(m.createdAt)}</div>}
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                {m.attachments && m.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                    {m.attachments.map((url, i) => {
                      const filename = url.split('/').pop() ?? `attachment-${i + 1}`
                      const isImage = /\.(png|jpe?g|gif|webp|heic)$/i.test(url)
                      return isImage ? (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }} />
                        </a>
                      ) : (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 8px', background: 'rgba(255,255,255,.04)', borderRadius: 8, color: 'var(--gl)' }}>
                          <Icon name="paperclip" size={12} color="var(--gl)" /> {filename}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {pendingFiles.map((f, i) => (
            <span key={i} className="badge" style={{ fontSize: 11, background: 'rgba(0,200,83,.08)', border: '1px solid rgba(0,200,83,.18)', color: 'var(--gl)', padding: '4px 10px', borderRadius: 30, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="paperclip" size={10} color="var(--gl)" />
              {f.name}
              <button
                onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                aria-label={`Remove ${f.name}`}
              >
                <Icon name="x" size={10} color="var(--gl)" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="g" style={{ padding: 10, marginTop: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 13 }}>{error}</div>
      )}

      <form onSubmit={send} className="inp" style={{ marginTop: 8, padding: 8 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={e => {
            const files = Array.from(e.target.files ?? []).slice(0, 5 - pendingFiles.length)
            setPendingFiles(prev => [...prev, ...files])
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={pendingFiles.length >= 5} aria-label="Attach files" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
          <Icon name="paperclip" size={14} color={pendingFiles.length >= 5 ? 'var(--text-mid-30)' : 'var(--text-mid-50)'} />
        </button>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={closed ? 'Type to reopen this ticket…' : 'Type a message…'}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={(!draft.trim() && pendingFiles.length === 0) || reply.isPending || uploading}
          style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 0 }}
          aria-label="Send"
        >
          <Icon name="send" size={14} color="var(--gl)" />
        </button>
      </form>
      {(uploading || reply.isPending) && <div className="t3" style={{ marginTop: 4 }}>{uploading ? 'Uploading attachments…' : 'Sending…'}</div>}

      {closed && (
        <button className="btn btn-r" style={{ marginTop: 8 }} onClick={reopen} disabled={reply.isPending}>
          Reopen Issue
        </button>
      )}
    </PhoneShell>
  )
}
