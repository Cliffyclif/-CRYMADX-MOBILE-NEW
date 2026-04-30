import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { AIScheduledAction } from '../../mock/db'

const TABS = ['active', 'paused', 'cancelled', 'completed'] as const

export function AIScheduled() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('active')
  const { data } = useEndpoint<{ items: AIScheduledAction[] }>('api.ai.scheduled.list')

  const items = (data?.items ?? []).filter(a => a.status === tab)
  const counts = TABS.reduce((acc, k) => ({ ...acc, [k]: (data?.items ?? []).filter(a => a.status === k).length }), {} as Record<string, number>)

  const tabLabel = (k: typeof TABS[number]) =>
    k === 'active' ? t('ai.tabActive2') :
    k === 'paused' ? t('ai.tabPaused2') :
    k === 'cancelled' ? t('ai.tabCancelled') :
    t('ai.tabCompleted')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.scheduledTitle2')} actions={<button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}><Icon name="plus" size={16} color="var(--gl)" /></button>} />
      <div className="t2">{t('ai.scheduledSub')}</div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{t('ai.tabCount', { label: tabLabel(k), count: counts[k] })}</button>
        ))}
      </div>

      {items.map(a => (
        <button key={a.id} onClick={() => nav(routeFor('route.ai.action', { actionId: a.id }))} className="g" style={{ padding: 10, margin: '4px 0', textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="li-i" style={{ background: 'rgba(0,200,83,.15)', width: 28, height: 28 }}>
              <Icon name={a.icon as IconName} size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{a.title}</div>
              <div className="t3">{a.description}</div>
            </div>
            <div className="badge badge-g" style={{ fontSize: 9 }}>{a.status.toUpperCase()}</div>
          </div>
          {a.recurring && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
            <span className="t3">{a.cooldown}</span>
            <span className="grn">{t('ai.recurringLabel')}</span>
          </div>}
        </button>
      ))}

      {items.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('ai.noActionsTab', { tab: tabLabel(tab).toLowerCase() })}</div>
        </div>
      )}
    </PhoneShell>
  )
}
