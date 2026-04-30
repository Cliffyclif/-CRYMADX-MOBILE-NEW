import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { AIMemoryItem } from '../../mock/db'

const TABS = ['all', 'preference', 'trading-style', 'context', 'goal'] as const

export function AIMemory() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data } = useEndpoint<{ items: AIMemoryItem[] }>('api.ai.memory.list')
  const remove = useEndpointMutation('api.ai.memory.delete', { invalidates: ['api.ai.memory.list'] })
  const clear = useEndpointMutation('api.ai.memory.clear', { invalidates: ['api.ai.memory.list'] })

  const items = data?.items ?? []
  const filtered = tab === 'all' ? items : items.filter(i => i.category === tab)
  const prefs = items.filter(i => i.category === 'preference').length
  const ctx = items.filter(i => i.category === 'context' || i.category === 'goal' || i.category === 'trading-style').length

  const tabLabel = (k: typeof TABS[number]) =>
    k === 'all' ? t('ai.tabAllAi') :
    k === 'preference' ? t('ai.tabPreference') :
    k === 'trading-style' ? t('ai.tabTradingStyle') :
    k === 'context' ? t('ai.tabContext') :
    t('ai.tabGoals')

  const relativeTime = (iso: string): string => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    if (d < 1) return t('ai.todayMem')
    if (d < 7) return t('ai.daysAgoMem', { n: d })
    if (d < 30) return t('ai.weeksAgoMem', { n: Math.floor(d / 7) })
    return t('ai.monthsAgoMem', { n: Math.floor(d / 30) })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.aiMemoryTitle')} />
      <div className="t2">{t('ai.memoryHeaderSub')}</div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 14 }}>{items.length}</div><div className="stat-l">{t('ai.items')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 14 }}>{prefs}</div><div className="stat-l">{t('ai.preferences')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 14 }}>{ctx}</div><div className="stat-l">{t('ai.context')}</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {filtered.map(m => (
        <div key={m.id} className="li">
          <div className="li-i"><Icon name={m.icon as IconName} size={16} /></div>
          <div className="li-c">
            <div className="li-n">{m.title}</div>
            <div className="li-s">{m.detail}</div>
          </div>
          <div className="li-r" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="li-d">{relativeTime(m.createdAt)}</div>
            <button onClick={() => remove.mutate({ pathParams: { itemId: m.id } })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon name="trash" size={12} color="var(--text-mid-30)" />
            </button>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <button className="btn btn-r" style={{ marginTop: 8 }} onClick={() => clear.mutate({})} disabled={clear.isPending}>
          {clear.isPending ? t('ai.clearing') : t('ai.clearAllMemory')}
        </button>
      )}

      {items.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('ai.noMemoryItems')}</div>
        </div>
      )}
    </PhoneShell>
  )
}
