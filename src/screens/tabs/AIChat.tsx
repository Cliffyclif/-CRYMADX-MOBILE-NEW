/**
 * AIChat — direct port of the production web flow.
 *
 * Mirrors `src/services/aiChatService.ts` from the main site:
 *   POST   /api/ai/web/conversations              → create
 *   GET    /api/ai/web/conversations              → list (history)
 *   GET    /api/ai/web/conversations/:id          → detail + messages
 *   POST   /api/ai/web/conversations/:id/messages → send (returns SSE stream)
 *
 * On first user message we create a conversation if none exists, then stream
 * the assistant's reply via SSE. No assumptions about endpoint shapes — this
 * is a copy of what the production website already does.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon } from '../../components/Icon'
import { MarkdownBlock } from '../../components/MarkdownBlock'
import { ToolResultWidget, type ToolResult } from '../../components/ToolResultWidgets'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { useAuth } from '../../stores/auth'
import { getToken } from '../../api/client'
import { ROUTES, routeFor } from '../../routes'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults?: ToolResult[]
}

type ChatConversation = {
  _id: string
  title: string
  createdAt?: string
  updatedAt?: string
  archived?: boolean
  pinned?: boolean
  messageCount?: number
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')
// API_BASE includes `/api`. The chat routes live at /api/ai/web on the
// gateway, so we strip the trailing `/api` to compose `/api/ai/web/...`.
const ROOT = API_BASE.replace(/\/api$/, '')
const CHAT_BASE = `${ROOT}/api/ai/web`

async function chatReq<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${CHAT_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

export function AIChat() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const firstName = user?.firstName ?? 'there'

  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 'seed', role: 'assistant', content: t('ai.greeting', { name: firstName }) },
  ])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, streaming])

  // Cancel stream on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  const ensureConversation = async (): Promise<string> => {
    if (conversationId) return conversationId
    const res = await chatReq<{ conversation: ChatConversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    })
    const id = res.conversation._id
    setConversationId(id)
    return id
  }

  const onSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const t = draft.trim()
    if (!t || streaming) return
    setDraft('')

    // Optimistically append the user message + an empty assistant placeholder we'll fill via SSE.
    const userMsg: Msg = { id: `u_${Date.now()}`, role: 'user', content: t }
    const aiMsg: Msg = { id: `a_${Date.now()}`, role: 'assistant', content: '' }
    setMsgs(m => [...m, userMsg, aiMsg])
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const cid = await ensureConversation()
      const token = getToken()
      const actionToken = (() => {
        try { return localStorage.getItem('crymadx_ai_action_token') } catch { return null }
      })()

      const res = await fetch(`${CHAT_BASE}/conversations/${cid}/messages`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(actionToken ? { 'x-ai-action-token': actionToken } : {}),
        },
        body: JSON.stringify({ content: t, pinVerified: false }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || `HTTP ${res.status}`)
      }

      // Parse SSE stream.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let pendingEvent: string | null = null

      // Append helper that mutates the placeholder message in-place
      const appendDelta = (delta: string) => {
        setMsgs(m => {
          const copy = m.slice()
          const last = copy[copy.length - 1]
          if (last && last.id === aiMsg.id) {
            copy[copy.length - 1] = { ...last, content: last.content + delta }
          }
          return copy
        })
      }
      const replaceContent = (full: string) => {
        setMsgs(m => {
          const copy = m.slice()
          const last = copy[copy.length - 1]
          if (last && last.id === aiMsg.id) {
            copy[copy.length - 1] = { ...last, content: full }
          }
          return copy
        })
      }

      // Production SSE events (from src/services/aiChatService.ts StreamEventMap):
      //   user_message      — echo of user's persisted message
      //   title_updated     — { title }
      //   delta             — { content: string }        ← streaming token
      //   tool_call         — { id, name, args }
      //   tool_result       — { id, name, result }
      //   pin_required      — { toolName, args, hasPin } (skip for now)
      //   assistant_message — full ChatMessage with .content (final)
      //   truncated         — { finish_reason }
      //   error             — { error: string }
      //   done              — { ok: true }
      let acc = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        let nl: number
        while ((nl = buf.indexOf('\n')) >= 0) {
          const rawLine = buf.slice(0, nl)
          buf = buf.slice(nl + 1)
          const line = rawLine.replace(/\r$/, '')

          if (line === '') { pendingEvent = null; continue }
          if (line.startsWith('event:')) { pendingEvent = line.slice(6).trim(); continue }
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            if (!pendingEvent) continue
            try {
              const parsed = JSON.parse(data)
              switch (pendingEvent) {
                case 'delta': {
                  // Stream token-by-token by appending to the same bubble.
                  const piece = typeof parsed.content === 'string' ? parsed.content : ''
                  if (piece) {
                    acc += piece
                    replaceContent(acc)
                  }
                  break
                }
                case 'assistant_message': {
                  // Final persisted message. content can supersede our accumulation.
                  const full = parsed?.content
                  if (typeof full === 'string' && full.length > 0) {
                    acc = full
                    replaceContent(acc)
                  }
                  break
                }
                case 'tool_call': {
                  // Optional inline indicator (no-op; widgets show on tool_result)
                  break
                }
                case 'tool_result': {
                  // Attach the structured result to the current assistant
                  // message so <ToolResultWidget> can render the QR / portfolio /
                  // balance card above the markdown text.
                  const tr: ToolResult = {
                    id: String(parsed?.id ?? `t_${Date.now()}`),
                    name: String(parsed?.name ?? ''),
                    result: parsed?.result,
                  }
                  setMsgs(m => {
                    const copy = m.slice()
                    const last = copy[copy.length - 1]
                    if (last && last.id === aiMsg.id) {
                      copy[copy.length - 1] = {
                        ...last,
                        toolResults: [...(last.toolResults ?? []), tr],
                      }
                    }
                    return copy
                  })
                  break
                }
                case 'pin_required': {
                  acc += `\n\n🔒 PIN required to run "${parsed?.toolName ?? 'this action'}". Open the AI app on your other device to confirm, or set a PIN in Settings.`
                  replaceContent(acc)
                  break
                }
                case 'error': {
                  const msg = parsed?.error ?? parsed?.message ?? 'AI error'
                  acc = acc ? `${acc}\n\n⚠ ${msg}` : `⚠ ${msg}`
                  replaceContent(acc)
                  break
                }
                case 'done': {
                  // Stream finished cleanly — nothing more to do.
                  break
                }
              }
            } catch { /* non-JSON data line */ }
          }
        }
      }
      // Avoid unused-warning on appendDelta which is provided for clarity.
      void appendDelta
    } catch (err) {
      const raw = (err as Error).message ?? ''
      let pretty = 'Something went wrong reaching the AI. Please try again.'
      try {
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) {
          const j = JSON.parse(m[0])
          pretty = j.message ?? j.error ?? pretty
        } else if (raw && raw.length < 200) {
          pretty = raw
        }
      } catch { /* keep pretty */ }
      setMsgs(m => {
        const copy = m.slice()
        const last = copy[copy.length - 1]
        if (last && last.role === 'assistant' && last.content === '') {
          copy[copy.length - 1] = { ...last, content: `⚠ ${pretty}` }
        } else {
          copy.push({ id: `e_${Date.now()}`, role: 'assistant', content: `⚠ ${pretty}` })
        }
        return copy
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  return (
    <PhoneShell bottomNav={<BottomNav />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(27,140,62,.06)' }}>
        <img src="/crymadx-ai-mark.png" alt="" style={{ width: 34, height: 34 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>CrymadX AI</div>
          <div className="t3"><span className="grn">●</span> {t('ai.online')}</div>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          aria-label={t('ai.history') as string}
          style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="clock" size={16} color="var(--text-mid-50)" />
        </button>
        <button
          onClick={() => nav(ROUTES['route.ai.settings'].path)}
          aria-label={t('ai.settings') as string}
          style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="settings" size={16} color="var(--text-mid-50)" />
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, marginTop: 8, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
        {msgs.map(m => (
          <div key={m.id} className={`bub bub-${m.role === 'user' ? 'u' : 'ai'}`}>
            {m.role === 'user' ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
            ) : (
              <>
                {m.toolResults?.map(tr => (
                  <ToolResultWidget key={tr.id} tool={tr} />
                ))}
                {m.content
                  ? <MarkdownBlock content={m.content} />
                  : ((streaming && (m.toolResults?.length ?? 0) === 0)
                      ? <span style={{ opacity: 0.6 }}>…</span>
                      : null)
                }
              </>
            )}
          </div>
        ))}

        <div className="chips" style={{ marginTop: 6 }}>
          <button className="chip" onClick={() => setDraft("What's my BTC balance?")}>{t('ai.btcBalance')}</button>
          <button className="chip" onClick={() => setDraft('Set a price alert for BTC')}>{t('ai.setAlert')}</button>
          <button className="chip" onClick={() => setDraft('Show recent transactions')}>{t('ai.recentTxs')}</button>
        </div>
      </div>

      <form onSubmit={onSend} className="inp" style={{ marginTop: 8, padding: 8 }}>
        <Icon name="paperclip" size={14} />
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={t('ai.askAnything') as string}
          style={{ flex: 1 }}
          disabled={streaming}
        />
        <button
          type="button"
          onClick={() => nav(ROUTES['route.ai.voice'].path)}
          aria-label="Voice mode"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="mic" size={14} color="var(--gl)" />
        </button>
        <button type="submit" disabled={streaming || !draft.trim()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
          <Icon name="send" size={14} color="var(--gl)" />
        </button>
      </form>

      {historyOpen && (
        <HistorySheet
          onClose={() => setHistoryOpen(false)}
          onPick={(id) => { setHistoryOpen(false); nav(routeFor('route.ai.conversation', { conversationId: id })) }}
        />
      )}
    </PhoneShell>
  )
}

function HistorySheet({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const nav = useNavigate()
  const [active, setActive] = useState<ChatConversation[] | null>(null)
  const [archived, setArchived] = useState<ChatConversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const dismiss = useSheetDismiss({ onDismiss: onClose })

  useEffect(() => {
    let cancelled = false
    // Mirror the production hook: fetch both archived=false and archived=true
    // in parallel (see src/hooks/useAIChat.ts).
    Promise.all([
      chatReq<{ conversations: ChatConversation[] }>('/conversations?archived=false').catch(() => ({ conversations: [] })),
      chatReq<{ conversations: ChatConversation[] }>('/conversations?archived=true').catch(() => ({ conversations: [] })),
    ])
      .then(([a, b]) => {
        if (cancelled) return
        setActive(a.conversations ?? [])
        setArchived(b.conversations ?? [])
      })
      .catch(e => { if (!cancelled) setError(e.message ?? 'Failed to load') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const fmtTime = (s?: string) => {
    if (!s) return ''
    try {
      const d = new Date(s)
      const now = new Date()
      const sameDay = d.toDateString() === now.toDateString()
      if (sameDay) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
      if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  const filterByQ = (list: ChatConversation[]) =>
    !q.trim() ? list : list.filter(c => (c.title ?? '').toLowerCase().includes(q.toLowerCase()))

  const activeList = active ? filterByQ(active) : null
  const archivedList = archived ? filterByQ(archived) : null
  const totalLoaded = (active?.length ?? 0) + (archived?.length ?? 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '82vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 6px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ flex: 1, margin: 0 }}>Chat History {totalLoaded > 0 && <span className="t3" style={{ fontWeight: 400 }}>· {totalLoaded}</span>}</h3>
          <button
            onClick={() => { onClose(); nav(ROUTES['route.ai.history'].path) }}
            className="badge badge-g"
            style={{ cursor: 'pointer', border: 'none', marginRight: 6 }}
          >
            View all →
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Search */}
        {totalLoaded > 0 && (
          <div className="inp" style={{ marginBottom: 8 }}>
            <Icon name="search" size={13} color="var(--text-mid-30)" />
            <input
              placeholder="Search conversations..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ flex: 1 }}
            />
            {q && (
              <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <Icon name="x" size={11} color="var(--text-mid-30)" />
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {active === null && archived === null && !error ? (
            <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">Loading…</div></div>
          ) : error ? (
            <div className="g" style={{ padding: 16, textAlign: 'center', borderLeft: '3px solid var(--gd)' }}>
              <div className="t3">{error}</div>
            </div>
          ) : totalLoaded === 0 ? (
            <div className="g" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
              <div className="t3">No previous chats yet</div>
              <div className="t3" style={{ fontSize: 11, marginTop: 4 }}>Conversations from the website and Telegram bot will appear here.</div>
            </div>
          ) : (
            <>
              {/* Active */}
              {activeList && activeList.length > 0 && (
                <>
                  <div className="t3" style={{ fontWeight: 700, padding: '4px 4px 6px', color: 'var(--text-mid-50)' }}>
                    Recent · {activeList.length}
                  </div>
                  {activeList.map(c => (
                    <ConvoRow key={c._id} c={c} fmtTime={fmtTime} onPick={onPick} />
                  ))}
                </>
              )}

              {/* Archived */}
              {archivedList && archivedList.length > 0 && (
                <>
                  <div className="t3" style={{ fontWeight: 700, padding: '12px 4px 6px', color: 'var(--text-mid-50)' }}>
                    Archived · {archivedList.length}
                  </div>
                  {archivedList.map(c => (
                    <ConvoRow key={c._id} c={c} fmtTime={fmtTime} onPick={onPick} muted />
                  ))}
                </>
              )}

              {q && (activeList?.length ?? 0) === 0 && (archivedList?.length ?? 0) === 0 && (
                <div className="g" style={{ padding: 16, textAlign: 'center' }}>
                  <div className="t3">No conversations match "{q}"</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ConvoRow({
  c, fmtTime, onPick, muted,
}: {
  c: ChatConversation
  fmtTime: (s?: string) => string
  onPick: (id: string) => void
  muted?: boolean
}) {
  return (
    <button
      key={c._id}
      onClick={() => onPick(c._id)}
      className="li"
      style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', opacity: muted ? 0.7 : 1 }}
    >
      <div className="li-i" style={{ background: 'rgba(27,140,62,.1)' }}>
        <Icon name="msg" size={14} color="var(--gl)" />
      </div>
      <div className="li-c" style={{ minWidth: 0 }}>
        <div className="li-n" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.title || 'Untitled conversation'}
        </div>
        <div className="li-s" style={{ fontSize: 11 }}>
          {(c.messageCount ?? 0)} message{(c.messageCount ?? 0) === 1 ? '' : 's'}
        </div>
      </div>
      <div className="li-r"><div className="li-d" style={{ fontSize: 10 }}>{fmtTime(c.updatedAt ?? c.createdAt)}</div></div>
    </button>
  )
}
