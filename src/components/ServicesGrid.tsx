/**
 * ServicesGrid — compact 5-tile launcher for the Home screen.
 *
 * Shows 4 highlighted shortcuts + a "More" tile that opens the full Services
 * page. Inspired by the pattern used by Bybit / Binance home dashboards.
 */
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from './Icon'
import { ROUTES, routeFor } from '../routes'

type Tile = {
  id: string
  label: string
  icon: IconName
  go: () => void
}

const TILE_BG = 'rgba(255,255,255,0.04)'
const TILE_BORDER = 'rgba(255,255,255,0.08)'

export function ServicesGrid() {
  const nav = useNavigate()
  const { t } = useTranslation()

  const tiles: Tile[] = [
    { id: 'rewards', label: t('services.rewards'), icon: 'trophy',    go: () => nav(ROUTES['route.engage.rewards'].path) },
    { id: 'trade',   label: t('services.trade'),   icon: 'chart',     go: () => nav(routeFor('route.trading.spot', { pair: 'BTC/USDT' })) },
    { id: 'earn',    label: t('services.earn'),    icon: 'zap',       go: () => nav(ROUTES['route.earn.hub'].path) },
    { id: 'p2p',     label: t('services.p2p'),     icon: 'handshake', go: () => nav(ROUTES['route.p2p.market'].path) },
    { id: 'more',    label: t('services.more'),    icon: 'more',      go: () => nav(ROUTES['route.misc.services'].path) },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
        marginTop: 4,
      }}
    >
      {tiles.map(t => (
        <button
          key={t.id}
          onClick={t.go}
          aria-label={t.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '4px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-strong)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: TILE_BG,
              border: `1px solid ${TILE_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform .12s ease',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Icon name={t.icon} size={20} color="var(--text-strong)" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', textAlign: 'center', lineHeight: 1.1 }}>
            {t.label}
          </div>
        </button>
      ))}
    </div>
  )
}
