import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'

type AINotif = { id: string; type: string; tone: 'g' | 'gd' | 'r'; title: string; body: string; when: string }

const TABS = ['all', 'triggered', 'failed', 'reminders'] as const

export function AINotifications() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data } = useEndpoint<{ items: AINotif[] }>('api.ai.notifications')

  const items = data?.items ?? []
  const filtered = tab === 'all' ? items
    : tab === 'triggered' ? items.filter(n => n.tone === 'g')
    : tab === 'failed' ? items.filter(n => n.tone === 'r')
    : items.filter(n => n.tone === 'gd')

  const tabLabel = (k: typeof TABS[number]) =>
    k === 'all' ? t('ai.tabAllN', { count: items.length }) :
    k === 'triggered' ? t('ai.tabTriggered') :
    k === 'failed' ? t('ai.tabFailed') :
    t('ai.tabReminders')

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ flex: 1 }}>{t('ai.aiAlerts')}</h2>
        <span className="t3 grn" style={{ cursor: 'pointer' }}>{t('ai.markAllRead')}</span>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {filtered.map(n => {
        const tint = n.tone === 'g' ? '0,200,83' : n.tone === 'r' ? '239,68,68' : '212,165,60'
        const color = n.tone === 'g' ? 'var(--gl)' : n.tone === 'r' ? 'var(--r)' : 'var(--gd)'
        return (
          <div key={n.id} className="li">
            <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
              <Icon name={n.type as IconName} size={14} color={color} />
            </div>
            <div className="li-c">
              <div className="li-n">{n.title}</div>
              <div className="li-s">{n.body}</div>
            </div>
            <div className="li-r"><div className="li-d">{n.when}</div></div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('ai.noNotifications')}</div>
        </div>
      )}
    </PhoneShell>
  )
}
