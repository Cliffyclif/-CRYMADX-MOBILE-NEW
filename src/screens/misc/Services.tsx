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

type Category =
  | 'Buy Crypto' | 'Trade' | 'Earn' | 'NFT' | 'Card' | 'AI'
  | 'Account' | 'Security' | 'Settings' | 'Engagement' | 'Support' | 'Legal'

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
  /** extra search keywords (semicolon-separated) for the search box —
   *  e.g. "Help Center" should match "support" too */
  keywords?: string
}

const SERVICES: ServiceItem[] = [
  // ────────────────────────────── BUY CRYPTO ──────────────────────────────
  { id: 'deposit',       label: 'Deposit',          icon: 'dl',        category: 'Buy Crypto',   route: 'route.wallet.deposit-pick', recommended: true, keywords: 'receive crypto address qr' },
  { id: 'buy',           label: 'Buy Crypto',       icon: 'dollar',    category: 'Buy Crypto',   route: 'route.fiat.buy',            recommended: true, keywords: 'fiat card bank purchase' },
  { id: 'p2p-buy',       label: 'P2P Trading',      icon: 'handshake', category: 'Buy Crypto',   route: 'route.p2p.market',          keywords: 'peer escrow local currency' },
  { id: 'p2p-payments',  label: 'Payment Methods',  icon: 'card',      category: 'Buy Crypto',   route: 'route.p2p.payments',        keywords: 'p2p bank transfer methods' },

  // ─────────────────────────────── TRADE ─────────────────────────────────
  { id: 'spot',          label: 'Spot Trade',       icon: 'chart',     category: 'Trade', path: routeFor('route.trading.spot', { pair: 'BTC/USDT' }), recommended: true, hot: true, keywords: 'order book limit market' },
  { id: 'convert',       label: 'Convert',          icon: 'swap',      category: 'Trade', route: 'route.wallet.convert', recommended: true, keywords: 'swap exchange instant' },
  { id: 'activity',      label: 'Activity',         icon: 'trend-up',  category: 'Trade', route: 'route.trading.activity' },
  { id: 'markets',       label: 'Markets',          icon: 'bar',       category: 'Trade', route: 'route.tab.markets',     keywords: 'prices charts pairs' },
  { id: 'send',          label: 'Send',             icon: 'send',      category: 'Trade', route: 'route.wallet.withdraw', keywords: 'withdraw transfer external' },

  // ─────────────────────────────── EARN ──────────────────────────────────
  { id: 'earn',          label: 'Earn Hub',         icon: 'zap',       category: 'Earn', route: 'route.earn.hub', recommended: true },
  { id: 'staking',       label: 'Staking',          icon: 'target',    category: 'Earn', route: 'route.earn.staking',     keywords: 'apy yield reward' },
  { id: 'savings',       label: 'Savings',          icon: 'piggy',     category: 'Earn', route: 'route.earn.savings',     keywords: 'interest deposit fixed' },
  { id: 'autoinvest',    label: 'Auto-Invest',      icon: 'refresh',   category: 'Earn', route: 'route.earn.autoinvest',  keywords: 'dca recurring schedule' },
  { id: 'vault',         label: 'Vault',            icon: 'archive',   category: 'Earn', route: 'route.earn.vault',       keywords: 'lock secure earn' },

  // ─────────────────────────────── NFT ───────────────────────────────────
  { id: 'nft',           label: 'My NFTs',          icon: 'grid',      category: 'NFT', route: 'route.nft.gallery',       keywords: 'collectibles gallery' },
  { id: 'nftmarket',     label: 'NFT Market',       icon: 'layers',    category: 'NFT', route: 'route.nft.market',        keywords: 'marketplace buy sell' },

  // ─────────────────────────────── CARD ──────────────────────────────────
  { id: 'card',          label: 'Card',             icon: 'card',      category: 'Card', route: 'route.card.hub',         recommended: true, keywords: 'visa spend cashback' },
  { id: 'card-apply',    label: 'Apply for Card',   icon: 'rocket',    category: 'Card', route: 'route.card.onboarding',  keywords: 'order new visa kyc' },
  { id: 'card-topup',    label: 'Top Up',           icon: 'plus',      category: 'Card', route: 'route.card.topup',       keywords: 'fund load card' },
  { id: 'card-tx',       label: 'Card Activity',    icon: 'clock',     category: 'Card', route: 'route.card.transactions',keywords: 'card transactions spending' },
  { id: 'card-settings', label: 'Card Settings',    icon: 'settings',  category: 'Card', route: 'route.card.settings',    keywords: 'freeze pin limit' },

  // ─────────────────────────────── AI ────────────────────────────────────
  { id: 'ai-chat',       label: 'AI Chat',          icon: 'bot',       category: 'AI', route: 'route.tab.ai',             recommended: true, keywords: 'copilot assistant' },
  { id: 'ai-voice',      label: 'Voice Mode',       icon: 'mic',       category: 'AI', route: 'route.ai.voice',           keywords: 'speak microphone hands-free' },
  { id: 'ai-history',    label: 'Chat History',     icon: 'cards',     category: 'AI', route: 'route.ai.history',         keywords: 'conversations past' },
  { id: 'ai-memory',     label: 'AI Memory',        icon: 'briefcase', category: 'AI', route: 'route.ai.memory',          keywords: 'context remember' },
  { id: 'ai-scheduled',  label: 'Scheduled Actions',icon: 'pin',       category: 'AI', route: 'route.ai.scheduled',       keywords: 'automation triggers' },
  { id: 'ai-tools',      label: 'AI Tools',         icon: 'tool',      category: 'AI', route: 'route.ai.tools',           keywords: 'capabilities permissions' },
  { id: 'ai-settings',   label: 'AI Settings',      icon: 'compass',   category: 'AI', route: 'route.ai.settings',        keywords: 'model voice persona' },

  // ─────────────────────────────── ACCOUNT ───────────────────────────────
  { id: 'wallet',        label: 'Wallet',           icon: 'wallet',    category: 'Account', route: 'route.tab.wallet',     keywords: 'balances assets portfolio' },
  { id: 'beneficiaries', label: 'Saved Addresses',  icon: 'users',     category: 'Account', route: 'route.wallet.beneficiaries', keywords: 'whitelist contacts' },
  { id: 'history',       label: 'Transaction History', icon: 'clock',  category: 'Account', route: 'route.wallet.tx-history',    keywords: 'transactions past' },
  { id: 'kyc',           label: 'KYC Verification', icon: 'shield',    category: 'Account', route: 'route.kyc.status',     keywords: 'identity verify documents' },
  { id: 'kyc-levels',    label: 'KYC Levels',       icon: 'star',      category: 'Account', route: 'route.kyc.levels',     keywords: 'tiers limits' },

  // ─────────────────────────────── SECURITY ──────────────────────────────
  { id: 'security',      label: 'Security Hub',     icon: 'lock',      category: 'Security', route: 'route.security.hub' },
  { id: 'sec-2fa',       label: '2FA',              icon: 'fp',        category: 'Security', route: 'route.security.2fa',           keywords: 'authenticator totp' },
  { id: 'sec-backup',    label: 'Backup Codes',     icon: 'cards',     category: 'Security', route: 'route.security.backup-codes',  keywords: 'recovery 2fa' },
  { id: 'sec-password',  label: 'Change Password',  icon: 'key',       category: 'Security', route: 'route.security.password',      keywords: 'reset login' },
  { id: 'sec-pin',       label: 'App PIN',          icon: 'bookmark',  category: 'Security', route: 'route.security.pin',           keywords: 'lock biometric' },
  { id: 'sec-sessions',  label: 'Active Sessions',  icon: 'phone',     category: 'Security', route: 'route.security.sessions',      keywords: 'devices logout' },
  { id: 'sec-antiphish', label: 'Anti-Phishing',    icon: 'shield',    category: 'Security', route: 'route.security.anti-phishing', keywords: 'email code phrase' },

  // ─────────────────────────────── SETTINGS ─────────────────────────────
  { id: 'set-notifs',    label: 'Notifications',    icon: 'bell',      category: 'Settings', route: 'route.settings.notifications', keywords: 'push email alerts' },
  { id: 'set-theme',     label: 'Theme',            icon: 'sun',       category: 'Settings', route: 'route.settings.theme',         keywords: 'dark light appearance' },
  { id: 'set-language',  label: 'Language',         icon: 'globe',     category: 'Settings', route: 'route.settings.language',      keywords: 'locale translate' },
  { id: 'set-currency',  label: 'Display Currency', icon: 'dollar',    category: 'Settings', route: 'route.settings.currency',      keywords: 'fiat usd ngn' },
  { id: 'set-alerts',    label: 'Price Alerts',     icon: 'flag',      category: 'Settings', route: 'route.settings.alerts',        keywords: 'notification price target' },
  { id: 'set-developer', label: 'Developer',        icon: 'tool',      category: 'Settings', route: 'route.settings.developer',     keywords: 'debug logs' },
  { id: 'set-apikeys',   label: 'API Keys',         icon: 'key',       category: 'Settings', route: 'route.settings.api-keys',      keywords: 'developer trading bot' },
  { id: 'set-ecosystem', label: 'Ecosystem',        icon: 'layers',    category: 'Settings', route: 'route.settings.ecosystem',     keywords: 'partners integrations' },

  // ────────────────────────────── ENGAGEMENT ─────────────────────────────
  { id: 'rewards',       label: 'Rewards Hub',      icon: 'trophy',    category: 'Engagement', recommended: true, route: 'route.engage.rewards', keywords: 'xp tier badges' },
  { id: 'tier',          label: 'My Tier',          icon: 'star',      category: 'Engagement', route: 'route.engage.tier',                       keywords: 'level vip benefits' },
  { id: 'referral',      label: 'Refer & Earn',     icon: 'gift',      category: 'Engagement', recommended: true, route: 'route.engage.referral', keywords: 'invite bonus friends' },
  { id: 'announcements', label: "What's New",       icon: 'flag',      category: 'Engagement', route: 'route.engage.announcements',              keywords: 'news updates announcements' },
  { id: 'notif-feed',    label: 'Notifications',    icon: 'bell',      category: 'Engagement', route: 'route.engage.notifications',              keywords: 'inbox updates' },

  // ─────────────────────────────── SUPPORT ──────────────────────────────
  { id: 'help',          label: 'Help Center',      icon: 'help',      category: 'Support', route: 'route.support.help',     keywords: 'support faq guide articles' },
  { id: 'tickets',       label: 'My Tickets',       icon: 'msg',       category: 'Support', route: 'route.support.tickets',  keywords: 'support requests' },
  { id: 'contact',       label: 'Contact Support',  icon: 'phone',     category: 'Support', route: 'route.support.contact',  keywords: 'email chat live' },
  { id: 'status',        label: 'System Status',    icon: 'info',      category: 'Support', route: 'route.legal.status',     keywords: 'uptime incidents' },
  { id: 'scan',          label: 'Scan QR',          icon: 'camera',    category: 'Support', route: 'route.misc.scan-qr',     keywords: 'qr code wallet' },

  // ─────────────────────────────── LEGAL ────────────────────────────────
  { id: 'about',         label: 'About CrymadX',    icon: 'info',      category: 'Legal', route: 'route.legal.about',     keywords: 'company team' },
  { id: 'terms',         label: 'Terms of Service', icon: 'doc',       category: 'Legal', route: 'route.legal.terms',     keywords: 'agreement legal' },
  { id: 'privacy',       label: 'Privacy Policy',   icon: 'shield',    category: 'Legal', route: 'route.legal.privacy',   keywords: 'data gdpr' },
  { id: 'cookies',       label: 'Cookie Policy',    icon: 'doc',       category: 'Legal', route: 'route.legal.cookies',   keywords: 'cookies tracking gdpr eprivacy' },
]

const CATEGORIES: ('Recommended' | Category)[] = [
  'Recommended', 'Buy Crypto', 'Trade', 'Earn', 'NFT', 'Card', 'AI',
  'Account', 'Security', 'Settings', 'Engagement', 'Support', 'Legal',
]

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
      return SERVICES.filter(s =>
        s.label.toLowerCase().includes(filter)
        || s.category.toLowerCase().includes(filter)
        || (s.keywords ?? '').toLowerCase().includes(filter)
      )
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
