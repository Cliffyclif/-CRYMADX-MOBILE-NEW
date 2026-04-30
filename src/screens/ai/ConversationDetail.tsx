import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { AIConversation, AIMessage } from '../../mock/db'

export function ConversationDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { conversationId = '' } = useParams()
  const { data, isLoading } = useEndpoint<{ conversation: AIConversation; messages: AIMessage[] }>('api.ai.chat.conversation', { pathParams: { conversationId } })

  if (isLoading || !data) {
    return <PhoneShell noTabs><div style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }

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
        {data.messages.map(m => (
          <div key={m.id} className={`bub bub-${m.role === 'user' ? 'u' : 'ai'}`}>{m.text}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, fontSize: 13, padding: 8, margin: 0 }} onClick={() => nav(ROUTES['route.tab.ai'].path)}>
          <Icon name="msg" size={12} /> {t('ai.continueChat')}
        </button>
        <button className="btn btn-g" style={{ flex: 1, fontSize: 13, padding: 8, margin: 0 }} onClick={() => nav(routeFor('route.ai.share', { conversationId }))}>
          <Icon name="share" size={12} color="#fff" /> {t('ai.share')}
        </button>
      </div>
    </PhoneShell>
  )
}
