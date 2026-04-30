import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { AIConversation } from '../../mock/db'

const TABS = ['all', 'pinned', 'archived'] as const

export function ChatHistory() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data } = useEndpoint<{ items: AIConversation[] }>('api.ai.chat.history')

  const all = data?.items ?? []
  const filtered = tab === 'pinned' ? all.filter(c => c.pinned)
    : tab === 'archived' ? all.filter(c => c.archived)
    : all.filter(c => !c.archived)

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400_000).toDateString()
  const groups: Record<string, AIConversation[]> = { TODAY: [], YESTERDAY: [], EARLIER: [] }
  for (const c of filtered) {
    const d = new Date(c.updatedAt).toDateString()
    if (d === today) groups['TODAY'].push(c)
    else if (d === yesterday) groups['YESTERDAY'].push(c)
    else groups['EARLIER'].push(c)
  }

  const groupLabel = (g: string) =>
    g === 'TODAY' ? t('ai.groupToday') :
    g === 'YESTERDAY' ? t('ai.groupYesterday') :
    t('ai.groupEarlier')

  const tabLabel = (k: typeof TABS[number]) =>
    k === 'all' ? t('ai.tabAllCount', { count: all.filter(c => !c.archived).length }) :
    k === 'pinned' ? t('ai.tabPinned') :
    t('ai.tabArchived')

  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime()
    const m = Math.floor(ms / 60_000)
    if (m < 60) return t('ai.minSuffix', { n: m })
    const h = Math.floor(ms / 3_600_000)
    if (h < 24) return t('ai.hourSuffix', { n: h })
    const d = Math.floor(ms / 86_400_000)
    return t('ai.daySuffix', { n: d })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ flex: 1 }}>{t('ai.chatHistory')}</h2>
        <Icon name="search" size={16} />
        <button onClick={() => nav(ROUTES['route.tab.ai'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="plus" size={16} color="var(--gl)" />
        </button>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {Object.entries(groups).map(([label, items]) => items.length > 0 && (
        <div key={label}>
          <div className="t3" style={{ margin: '8px 0 4px', fontWeight: 700 }}>{groupLabel(label)}</div>
          {items.map(c => (
            <button key={c.id} className="li" onClick={() => nav(routeFor('route.ai.conversation', { conversationId: c.id }))} style={{ width: '100%', textAlign: 'left' }}>
              <div className="li-i"><Icon name="msg" size={16} /></div>
              <div className="li-c">
                <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.title}
                  {c.pinned && <span className="gld">📌</span>}
                </div>
                <div className="li-s">{c.preview}</div>
              </div>
              <div className="li-r"><div className="li-d">{relativeTime(c.updatedAt)}</div></div>
            </button>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('ai.noConversations')}</div>
        </div>
      )}
    </PhoneShell>
  )
}
