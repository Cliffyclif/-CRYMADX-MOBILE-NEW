import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { MarkdownBlock } from '../../components/MarkdownBlock'
import { ToolResultWidget, type ToolResult } from '../../components/ToolResultWidgets'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { AIConversation } from '../../mock/db'

// Server-shape (Mongo). Persisted messages come back with _id (not id),
// content (not text), and may have toolCalls with embedded results for
// assistant turns. The mock AIMessage type only covers the simple form.
type ServerMessage = {
  _id?: string
  id?: string
  role: 'user' | 'assistant' | 'tool'
  content?: string | null
  toolCalls?: Array<{ id?: string; name?: string; result?: unknown }>
  createdAt?: string
}

export function ConversationDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { conversationId = '' } = useParams()
  const { data, isLoading } = useEndpoint<{ conversation: AIConversation; messages: ServerMessage[] }>(
    'api.ai.chat.conversation',
    { pathParams: { conversationId } },
  )

  if (isLoading || !data) {
    return <PhoneShell noTabs><div style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }

  // Filter: drop tool messages (they're rendered as widgets attached to
  // the assistant turn that called them) and assistant turns that have
  // neither content nor any tool calls (they're empty stubs from PIN
  // gating or interrupted streams).
  const visible = (data.messages || []).filter(m => {
    if (m.role === 'tool') return false
    const hasContent = typeof m.content === 'string' && m.content.trim().length > 0
    const hasTools = Array.isArray(m.toolCalls) && m.toolCalls.length > 0
    return hasContent || hasTools
  })

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{data.conversation.title}</div>
          <div className="t3">{t('ai.convReadOnly', { date: new Date(data.conversation.createdAt).toLocaleDateString(), count: data.conversation.messageCount })}</div>
        </div>
        <button onClick={() => nav(routeFor('route.ai.share', { conversationId }))} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="share" size={14} />
        </button>
        <Icon name="archive" size={14} />
      </div>

      <div style={{ marginTop: 8 }}>
        {visible.map((m, i) => {
          const key = m._id ?? m.id ?? `msg-${i}`
          const isUser = m.role === 'user'
          const tools = (m.toolCalls || []).filter(tc => tc && tc.result)
          return (
            <div key={key} className={`bub bub-${isUser ? 'u' : 'ai'}`}>
              {isUser ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{m.content || ''}</span>
              ) : (
                <>
                  {tools.map((tr, j) => (
                    <ToolResultWidget
                      key={tr.id ?? `tool-${i}-${j}`}
                      tool={{ id: tr.id ?? `tool-${i}-${j}`, name: tr.name ?? '', result: tr.result } as ToolResult}
                    />
                  ))}
                  {m.content && <MarkdownBlock content={m.content} />}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <button
          className="btn btn-o"
          style={{ flex: 1, fontSize: 13, padding: 8, margin: 0 }}
          onClick={() => {
            // Tell AIChat to resume THIS conversation instead of whatever
            // was last active. AIChat's mount effect reads this key.
            try { localStorage.setItem('crymadx.ai.activeConversation', conversationId) } catch {}
            nav(ROUTES['route.tab.ai'].path)
          }}
        >
          <Icon name="msg" size={12} /> {t('ai.continueChat')}
        </button>
        <button className="btn btn-g" style={{ flex: 1, fontSize: 13, padding: 8, margin: 0 }} onClick={() => nav(routeFor('route.ai.share', { conversationId }))}>
          <Icon name="share" size={12} color="#fff" /> {t('ai.share')}
        </button>
      </div>
    </PhoneShell>
  )
}
