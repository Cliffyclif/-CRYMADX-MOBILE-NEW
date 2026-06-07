/**
 * Services — full launcher screen. Categorized list of every feature.
 * All labels/categories are i18n keys (services.item.* / services.cat.*) so the
 * screen translates with the app language.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, routeFor, type RouteId } from '../../routes'

type Category = 'buyCrypto' | 'trade' | 'earn' | 'nft' | 'account' | 'engagement' | 'support'

type ServiceItem = {
  id: string
  /** i18n sub-key under services.item.* */
  label: string
  icon: IconName
  category: Category
  route?: RouteId
  path?: string
  recommended?: boolean
  hot?: boolean
}

const SERVICES: ServiceItem[] = [
  // Buy Crypto
  { id: 'deposit',     label: 'deposit',     icon: 'dl',        category: 'buyCrypto', route: 'route.wallet.deposit-pick', recommended: true },
  { id: 'buy',         label: 'buyCrypto',   icon: 'dollar',    category: 'buyCrypto', route: 'route.fiat.buy',            recommended: true },
  { id: 'p2p-buy',     label: 'p2pTrading',  icon: 'handshake', category: 'buyCrypto', route: 'route.p2p.market' },

  // Trade
  { id: 'spot',        label: 'spotTrade',   icon: 'chart',     category: 'trade', path: routeFor('route.trading.spot', { pair: 'BTC%2FUSDT' }), recommended: true, hot: true },
  { id: 'convert',     label: 'convert',     icon: 'swap',      category: 'trade', route: 'route.wallet.convert', recommended: true },
  { id: 'activity',    label: 'activity',    icon: 'trend-up',  category: 'trade', route: 'route.trading.activity' },
  { id: 'markets',     label: 'markets',     icon: 'bar',       category: 'trade', route: 'route.tab.markets' },
  { id: 'send',        label: 'send',        icon: 'send',      category: 'trade', route: 'route.wallet.withdraw' },

  // Earn
  { id: 'earn',        label: 'earnHub',     icon: 'zap',       category: 'earn', route: 'route.earn.hub', recommended: true },
  { id: 'staking',     label: 'staking',     icon: 'target',    category: 'earn', route: 'route.earn.staking' },
  { id: 'savings',     label: 'savings',     icon: 'piggy',     category: 'earn', route: 'route.earn.savings' },
  { id: 'autoinvest',  label: 'autoInvest',  icon: 'refresh',   category: 'earn', route: 'route.earn.autoinvest' },
  { id: 'vault',       label: 'vault',       icon: 'archive',   category: 'earn', route: 'route.earn.vault' },

  // NFT
  { id: 'nft',         label: 'myNfts',      icon: 'grid',      category: 'nft', route: 'route.nft.gallery' },
  { id: 'nftmarket',   label: 'nftMarket',   icon: 'layers',    category: 'nft', route: 'route.nft.market' },

  // Account
  { id: 'card',        label: 'card',        icon: 'card',      category: 'account', recommended: true, route: 'route.card.hub' },
  { id: 'wallet',      label: 'wallet',      icon: 'wallet',    category: 'account', route: 'route.tab.wallet' },
  { id: 'beneficiaries', label: 'saved',     icon: 'users',     category: 'account', route: 'route.wallet.beneficiaries' },
  { id: 'history',     label: 'txHistory',   icon: 'clock',     category: 'account', route: 'route.wallet.tx-history' },
  { id: 'kyc',         label: 'kyc',         icon: 'shield',    category: 'account', route: 'route.kyc.status' },
  { id: 'security',    label: 'security',    icon: 'lock',      category: 'account', route: 'route.security.hub' },
  { id: 'apikeys',     label: 'apiKeys',     icon: 'key',       category: 'account', route: 'route.settings.api-keys' },

  // Engagement
  { id: 'rewards',     label: 'rewardsHub',  icon: 'trophy',    category: 'engagement', recommended: true, route: 'route.engage.rewards' },
  { id: 'referral',    label: 'referEarn',   icon: 'gift',      category: 'engagement', recommended: true, route: 'route.engage.referral' },
  { id: 'alerts',      label: 'priceAlerts', icon: 'bell',      category: 'engagement', route: 'route.settings.alerts' },
  { id: 'announcements', label: 'announcements', icon: 'flag',  category: 'engagement', route: 'route.engage.announcements' },

  // Support
  { id: 'help',        label: 'helpCenter',  icon: 'help',      category: 'support', route: 'route.support.help' },
  { id: 'tickets',     label: 'myTickets',   icon: 'msg',       category: 'support', route: 'route.support.tickets' },
  { id: 'contact',     label: 'contact',     icon: 'phone',     category: 'support', route: 'route.support.contact' },
  { id: 'status',      label: 'systemStatus', icon: 'info',     category: 'support', route: 'route.legal.status' },
]

const CATEGORIES: ('recommended' | Category)[] = ['recommended', 'buyCrypto', 'trade', 'earn', 'nft', 'account', 'engagement', 'support']

const FAV_KEY = 'crymadx.services.favorites'

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return ['deposit', 'rewards', 'p2p-buy', 'earn']
}

function saveFavs(ids: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)) } catch { /* noop */ }
}

export function Services() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof CATEGORIES[number]>('recommended')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(false)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())

  useEffect(() => { saveFavs(favs) }, [favs])

  const sl = (item: ServiceItem) => t(`services.item.${item.label}`)
  const cl = (cat: 'recommended' | Category) => t(`services.cat.${cat}`)

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
      return SERVICES.filter(s => sl(s).toLowerCase().includes(filter) || cl(s.category).toLowerCase().includes(filter))
    }
    if (tab === 'recommended') return SERVICES.filter(s => s.recommended)
    return SERVICES.filter(s => s.category === tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q])

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
      <ScreenHeader title={t('services.title')} />

      {/* Search */}
      <div className="inp" style={{ marginTop: 6 }}>
        <Icon name="search" size={14} color="var(--text-mid-30)" />
        <input
          placeholder={t('services.search')}
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
            <h3 style={{ flex: 1, margin: 0 }}>{t('services.myFavorites')}</h3>
            <button
              onClick={() => setEditing(e => !e)}
              className="badge badge-gd"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {editing ? t('common.done') : t('common.edit')}
            </button>
          </div>
          <div className="g" style={{ padding: 10 }}>
            {favItems.length === 0 ? (
              <div className="t3" style={{ textAlign: 'center', padding: 8 }}>
                {editing ? t('services.tapToFavorite') : t('services.noFavorites')}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {favItems.map(item => (
                  <ServiceTile key={item.id} item={item} label={sl(item)} isFavorite={true} showFavToggle={editing} onClick={() => editing ? toggleFav(item.id) : navigateTo(item)} />
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
              {cl(c)}
            </button>
          ))}
        </div>
      )}

      {/* Grouped service tiles */}
      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ marginTop: 12 }}>
          {(q || tab === 'recommended') && (
            <div className="t3" style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-mid-50)' }}>{cl(cat)}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {items.map(item => (
              <ServiceTile key={item.id} item={item} label={sl(item)} isFavorite={favs.includes(item.id)} showFavToggle={editing} onClick={() => editing ? toggleFav(item.id) : navigateTo(item)} />
            ))}
          </div>
        </div>
      ))}

      {visibleItems.length === 0 && (
        <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 12 }}>
          <div className="t3">{t('services.noMatch', { q })}</div>
        </div>
      )}
    </PhoneShell>
  )
}

function ServiceTile({
  item, label, isFavorite, showFavToggle, onClick,
}: {
  item: ServiceItem
  label: string
  isFavorite: boolean
  showFavToggle: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
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
        {label}
      </div>
    </button>
  )
}
