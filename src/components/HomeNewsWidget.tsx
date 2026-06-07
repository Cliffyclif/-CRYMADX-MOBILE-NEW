// Compact crypto news card for the mobile Home screen.
// Reuses the existing api.announcements.list endpoint, which falls back
// to CoinGecko free news in client.ts. Tap-through opens the article.
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEndpoint } from '../api/hooks'
import { Icon } from './Icon'
import { ROUTES } from '../routes'
import type { Announcement } from '../mock/db'

type AnnouncementWithLink = Announcement & { url?: string; source?: string; imageUrl?: string }

export function HomeNewsWidget() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<{ items: AnnouncementWithLink[] }>('api.announcements.list')
  const items = (data?.items ?? []).slice(0, 3)

  const open = (url?: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (items.length === 0) return null

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{t('home.cryptoNews') || 'Crypto News'}</h3>
        <button
          onClick={() => nav(ROUTES['route.engage.announcements'].path)}
          style={{ background: 'none', border: 'none', color: 'var(--gl)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          {t('common.viewAll') || 'View all'} ›
        </button>
      </div>
      {items.map((a, i) => (
        <button
          key={`${a.id}-${i}`}
          onClick={() => open(a.url)}
          disabled={!a.url}
          className="li"
          style={{
            width: '100%', textAlign: 'left', border: 'none',
            background: 'transparent', cursor: a.url ? 'pointer' : 'default',
          }}
        >
          {a.imageUrl ? (
            <img
              src={a.imageUrl}
              alt=""
              loading="lazy"
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--surface-soft)' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="li-i" style={{ background: 'var(--surface-soft)' }}>
              <span style={{ fontSize: 14 }}>{a.emoji || '📰'}</span>
            </div>
          )}
          <div className="li-c">
            <div className="li-n" style={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', lineHeight: 1.3,
            }}>{a.title}</div>
            <div className="li-s">
              {a.source || 'CoinGecko'}
              {a.createdAt && ` · ${timeAgo(a.createdAt)}`}
            </div>
          </div>
          {a.url && <Icon name="arrow" size={12} color="var(--text-mid-40)" />}
        </button>
      ))}
    </div>
  )
}

function timeAgo(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  } catch {
    return ''
  }
}
