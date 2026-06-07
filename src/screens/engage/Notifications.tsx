import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useNotifications } from '../../stores/notifications'
import { useEndpointMutation } from '../../api/hooks'

const TABS = ['all', 'trading', 'wallet', 'security', 'news'] as const

export function Notifications() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  // Read from the live store — populated by useLiveNotifications() at the App root
  const items = useNotifications(s => s.items)
  const markAllSeen = useNotifications(s => s.markAllSeen)
  const markAllRead = useNotifications(s => s.markAllRead)
  const markRead = useEndpointMutation('api.notifications.read', { invalidates: ['api.notifications.list'] })

  // "Mark all as read": flip every item locally for instant feedback, then
  // persist server-side. The screen renders from the live store (not the list
  // query), so the optimistic store update is what the user actually sees.
  const handleMarkAllRead = () => {
    if (!items.some(n => !n.read)) return // nothing unread — no-op
    markAllRead()
    markRead.mutate({})
  }

  // Mark all as seen when the user lands on this screen — clears the toast queue
  // and the unread badge. The server-side read is a separate "mark all read" action.
  useEffect(() => {
    markAllSeen()
  }, [markAllSeen])

  const filtered = items.filter(n => tab === 'all' || matchesTab(n.type, tab))

  const tabLabel = (k: typeof TABS[number]) => {
    if (k === 'all') return t('rewards.tabAllCount', { count: items.length })
    if (k === 'trading') return t('rewards.tabTrading')
    if (k === 'wallet') return t('rewards.tabWallet')
    if (k === 'security') return t('rewards.tabSecurity')
    return t('rewards.tabNews')
  }

  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime()
    const m = Math.floor(ms / 60_000)
    if (m < 60) return t('rewards.minAgo', { n: m })
    const h = Math.floor(ms / 3_600_000)
    if (h < 24) return t('rewards.hourAgo', { n: h })
    return t('rewards.dayAgo', { n: Math.floor(ms / 86_400_000) })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('rewards.notificationsTitle')}</h2>
        <button className="grn t3" onClick={handleMarkAllRead} disabled={!items.some(n => !n.read)} style={{ background: 'none', border: 'none', cursor: items.some(n => !n.read) ? 'pointer' : 'default', fontFamily: 'Outfit', opacity: items.some(n => !n.read) ? 1 : 0.5 }}>{t('rewards.markAllRead')}</button>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {filtered.map(n => {
        const tint = n.tone === 'g' ? '0,200,83'
          : n.tone === 'r' ? '239,68,68'
          : n.tone === 'gd' ? '212,165,60'
          : '0,200,83'
        const color = n.tone === 'r' ? 'var(--r)' : n.tone === 'gd' ? 'var(--gd)' : 'var(--gl)'
        const Wrapper: 'div' | 'button' = n.href ? 'button' : 'div'
        return (
          <Wrapper
            key={n.id}
            className="li"
            onClick={n.href ? () => nav(n.href!) : undefined}
            style={{
              background: !n.read ? 'rgba(0,200,83,.04)' : undefined,
              borderLeft: !n.read ? '3px solid var(--gl)' : undefined,
              ...(n.href ? { width: '100%', textAlign: 'left' as const, cursor: 'pointer' } : {}),
            }}
          >
            <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
              <Icon name={(n.icon as IconName) || 'bell'} size={14} color={color} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {n.title}
                {!n.read && <span className="grn">●</span>}
              </div>
              <div className="li-s">{n.body}</div>
            </div>
            <div className="li-r"><div className="li-d">{relativeTime(n.createdAt)}</div></div>
          </Wrapper>
        )
      })}

      {filtered.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('rewards.noNotifications')}</div>
        </div>
      )}
    </PhoneShell>
  )
}

function matchesTab(type: string, tab: string): boolean {
  if (tab === 'trading') return /trade|order|spot|swap|conversion/i.test(type)
  if (tab === 'wallet') return /deposit|withdraw|wallet|balance|transfer/i.test(type)
  if (tab === 'security') return /security|2fa|password|login|session/i.test(type)
  if (tab === 'news') return /announcement|broadcast|news|promo|update/i.test(type)
  return false
}
