import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { useEndpoint } from '../../api/hooks'
import type { Announcement } from '../../mock/db'

const TABS = ['all', 'product', 'listings', 'maintenance'] as const

// Items coming from the CryptoCompare fallback carry url + source + imageUrl.
// The local Announcement type doesn't declare them, so widen here.
type AnnouncementWithLink = Announcement & { url?: string; source?: string }

const openExternal = (href?: string) => {
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

export function Announcements() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data } = useEndpoint<{ items: AnnouncementWithLink[] }>('api.announcements.list')

  const items = (data?.items ?? []).filter(a => tab === 'all' || a.category === tab)
  const pinned = items.find(a => a.pinned)
  const others = items.filter(a => !a.pinned)

  const tabLabel = (k: typeof TABS[number]) => {
    if (k === 'all') return t('common.all')
    if (k === 'product') return t('rewards.tabProduct')
    if (k === 'listings') return t('rewards.tabListings')
    return t('rewards.tabMaintenance')
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}><h2 style={{ flex: 1 }}>{t('rewards.whatsNew')}</h2></div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {pinned && (
        <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(27,140,62,.1), rgba(0,200,83,.04))' }}>
          {pinned.source
            ? <div className="badge badge-g" style={{ fontSize: 9 }}>{pinned.source.toUpperCase()}</div>
            : <div className="badge badge-g" style={{ fontSize: 9 }}>v2.1.0 · NEW</div>}
          <h2 style={{ marginTop: 6, fontSize: 14 }}>{pinned.emoji} {pinned.title}</h2>
          <div className="t2" style={{ marginTop: 6, lineHeight: 1.5 }}>{pinned.body}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="btn btn-g" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => openExternal(pinned.url)}>
              {pinned.url ? t('rewards.readPost') : t('rewards.tryItNow')}
            </button>
            {pinned.url && (
              <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => openExternal(pinned.url)}>
                {t('rewards.readPost')}
              </button>
            )}
          </div>
        </div>
      )}

      {others.map(a => (
        <button
          key={a.id}
          className="li"
          onClick={() => openExternal(a.url)}
          disabled={!a.url}
          style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: a.url ? 'pointer' : 'default', padding: 0 }}
        >
          <div className="li-i" style={{ background: 'var(--surface-soft)', width: 32, height: 32 }}>
            <span style={{ fontSize: 14 }}>{a.emoji}</span>
          </div>
          <div className="li-c">
            <div className="li-n">{a.title}</div>
            <div className="li-s">{a.body}</div>
          </div>
          <div className="li-r"><div className="li-d">{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div>
        </button>
      ))}
    </PhoneShell>
  )
}
