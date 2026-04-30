/**
 * Services — full launcher screen. Categorized list of every feature.
 *
 * Patterned after the Bybit/Binance "All Services" sheet:
 *   - Search bar at top
 *   - "My Favorites" row with Edit
 *   - Category tabs (Recommended, Buy Crypto, Trade, Earn, More)
 *   - Sectioned grids of circular icon tiles
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, routeFor, type RouteId } from '../../routes'

type Category = 'Buy Crypto' | 'Trade' | 'Earn' | 'NFT' | 'Account' | 'Engagement' | 'Support'

type ServiceItem = {
  id: string
  label: string
  icon: IconName
  category: Category
  /** route id to navigate to */
  route?: RouteId
  /** static path (overrides route) — used for paths that need params */
  path?: string
  /** mark as recommended (shown in "Recommended" tab + has small flag) */
  recommended?: boolean
  /** "HOT" badge */
  hot?: boolean
}

const SERVICES: ServiceItem[] = [
  // Buy Crypto
  { id: 'deposit',     label: 'Deposit',        icon: 'dl',       category: 'Buy Crypto', route: 'route.wallet.deposit-pick', recommended: true },
  { id: 'buy',         label: 'Buy Crypto',     icon: 'dollar',   category: 'Buy Crypto', route: 'route.fiat.buy',            recommended: true },
  { id: 'p2p-buy',     label: 'P2P Trading',    icon: 'handshake',category: 'Buy Crypto', route: 'route.p2p.market' },

  // Trade
  { id: 'spot',        label: 'Spot Trade',     icon: 'chart',    category: 'Trade', path: routeFor('route.trading.spot', { pair: 'BTC/USDT' }), recommended: true, hot: true },
  { id: 'convert',     label: 'Convert',        icon: 'swap',     category: 'Trade', route: 'route.wallet.convert', recommended: true },
  { id: 'activity',    label: 'Activity',       icon: 'trend-up', category: 'Trade', route: 'route.trading.activity' },
  { id: 'markets',     label: 'Markets',        icon: 'bar',      category: 'Trade', route: 'route.tab.markets' },
  { id: 'send',        label: 'Send',           icon: 'send',     category: 'Trade', route: 'route.wallet.withdraw' },

  // Earn
  { id: 'earn',        label: 'Earn Hub',       icon: 'zap',      category: 'Earn', route: 'route.earn.hub', recommended: true },
  { id: 'staking',     label: 'Staking',        icon: 'target',   category: 'Earn', route: 'route.earn.staking' },
  { id: 'savings',     label: 'Savings',        icon: 'piggy',    category: 'Earn', route: 'route.earn.savings' },
  { id: 'autoinvest',  label: 'Auto-Invest',    icon: 'refresh',  category: 'Earn', route: 'route.earn.autoinvest' },
  { id: 'vault',       label: 'Vault',          icon: 'archive',  category: 'Earn', route: 'route.earn.vault' },

  // NFT
  { id: 'nft',         label: 'My NFTs',        icon: 'grid',     category: 'NFT', route: 'route.nft.gallery' },
  { id: 'nftmarket',   label: 'NFT Market',     icon: 'layers',   category: 'NFT', route: 'route.nft.market' },

  // Account
  { id: 'card',        label: 'Card',           icon: 'card',     category: 'Account', recommended: true, route: 'route.card.hub' },
  { id: 'wallet',      label: 'Wallet',         icon: 'wallet',   category: 'Account', route: 'route.tab.wallet' },
  { id: 'beneficiaries', label: 'Saved',        icon: 'users',    category: 'Account', route: 'route.wallet.beneficiaries' },
  { id: 'history',     label: 'Tx History',     icon: 'clock',    category: 'Account', route: 'route.wallet.tx-history' },
  { id: 'kyc',         label: 'KYC',            icon: 'shield',   category: 'Account', route: 'route.kyc.status' },
  { id: 'security',    label: 'Security',       icon: 'lock',     category: 'Account', route: 'route.security.hub' },
  { id: 'apikeys',     label: 'API Keys',       icon: 'key',      category: 'Account', route: 'route.settings.api-keys' },

  // Engagement
  { id: 'rewards',     label: 'Rewards Hub',    icon: 'trophy',   category: 'Engagement', recommended: true, route: 'route.engage.rewards' },
  { id: 'referral',    label: 'Refer & Earn',   icon: 'gift',     category: 'Engagement', recommended: true, route: 'route.engage.referral' },
  { id: 'alerts',      label: 'Price Alerts',   icon: 'bell',     category: 'Engagement', route: 'route.settings.alerts' },
  { id: 'announcements',label:'Announcements',  icon: 'flag',     category: 'Engagement', route: 'route.engage.announcements' },

  // Support
  { id: 'help',        label: 'Help Center',    icon: 'help',     category: 'Support', route: 'route.support.help' },
  { id: 'tickets',     label: 'My Tickets',     icon: 'msg',      category: 'Support', route: 'route.support.tickets' },
  { id: 'contact',     label: 'Contact',        icon: 'phone',    category: 'Support', route: 'route.support.contact' },
  { id: 'status',      label: 'System Status',  icon: 'info',     category: 'Support', route: 'route.legal.status' },
]

const CATEGORIES: ('Recommended' | Category)[] = ['Recommended', 'Buy Crypto', 'Trade', 'Earn', 'NFT', 'Account', 'Engagement', 'Support']

const FAV_KEY = 'crymadx.services.favorites'

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  // Default favorites — hand-picked
  return ['deposit', 'rewards', 'p2p-buy', 'earn']
}

function saveFavs(ids: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)) } catch { /* noop */ }
}

export function Services() {
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof CATEGORIES[number]>('Recommended')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(false)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())

  useEffect(() => { saveFavs(favs) }, [favs])

  const navigateTo = (item: ServiceItem) => {
    const dest = item.path ?? (item.route ? ROUTES[item.route].path : null)
    if (dest) nav(dest)
  }

  const toggleFav = (id: string) => {
    setFavs(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  const visibleItems = useMemo(() => {
    const filter = q.trim().toLowerCase()
    if (filter) {
      return SERVICES.filter(s => s.label.toLowerCase().includes(filter) || s.category.toLowerCase().includes(filter))
    }
    if (tab === 'Recommended') return SERVICES.filter(s => s.recommended)
    return SERVICES.filter(s => s.category === tab)
  }, [tab, q])

  // Group by category for the body (when not searching)
  const grouped = useMemo(() => {
    const map = new Map<Category, ServiceItem[]>()
    for (const s of visibleItems) {
      if (!map.has(s.category)) map.set(s.category, [])
      map.get(s.category)!.push(s)
    }
    return Array.from(map.entries())
  }, [visibleItems])

  const favItems = SERVICES.filter(s => favs.includes(s.id))

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Services" />

      {/* Search */}
      <div className="inp" style={{ marginTop: 6 }}>
        <Icon name="search" size={14} color="var(--text-mid-30)" />
        <input
          placeholder="Search services..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        {q && (
          <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={12} color="var(--text-mid-30)" />
          </button>
        )}
      </div>

      {/* My Favorites */}
      {!q && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
            <h3 style={{ flex: 1, margin: 0 }}>My Favorites</h3>
            <button
              onClick={() => setEditing(e => !e)}
              className="badge badge-gd"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="g" style={{ padding: 10 }}>
            {favItems.length === 0 ? (
              <div className="t3" style={{ textAlign: 'center', padding: 8 }}>
                {editing ? 'Tap any service below to add it as a favorite' : 'No favorites yet. Tap Edit to pick.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {favItems.map(item => (
                  <ServiceTile
                    key={item.id}
                    item={item}
                    isFavorite={true}
                    showFavToggle={editing}
                    onClick={() => editing ? toggleFav(item.id) : navigateTo(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Category tabs */}
      {!q && (
        <div className="tabs" style={{ marginTop: 10, overflowX: 'auto', flexWrap: 'nowrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`tab ${tab === c ? 'a' : ''}`} onClick={() => setTab(c)} style={{ whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grouped service tiles */}
      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ marginTop: 12 }}>
          {(q || tab === 'Recommended') && (
            <div className="t3" style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-mid-50)' }}>{cat}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {items.map(item => (
              <ServiceTile
                key={item.id}
                item={item}
                isFavorite={favs.includes(item.id)}
                showFavToggle={editing}
                onClick={() => editing ? toggleFav(item.id) : navigateTo(item)}
              />
            ))}
          </div>
        </div>
      ))}

      {visibleItems.length === 0 && (
        <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 12 }}>
          <div className="t3">No services match "{q}"</div>
        </div>
      )}
    </PhoneShell>
  )
}

function ServiceTile({
  item, isFavorite, showFavToggle, onClick,
}: {
  item: ServiceItem
  isFavorite: boolean
  showFavToggle: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '6px 2px',
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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform .12s ease',
          position: 'relative',
        }}
      >
        <Icon name={item.icon} size={20} color="var(--text-strong)" />
        {item.hot && !showFavToggle && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -10,
              background: 'var(--gd, #d4a53c)',
              color: '#000',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 5px',
              borderRadius: 8,
              lineHeight: 1,
            }}
          >
            HOT
          </span>
        )}
        {showFavToggle && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: isFavorite ? 'var(--r, #ef4444)' : 'var(--gl, #00c853)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg, #08080f)',
            }}
          >
            {isFavorite ? '−' : '+'}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', textAlign: 'center', lineHeight: 1.15 }}>
        {item.label}
      </div>
    </button>
  )
}
