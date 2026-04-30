import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { getFavoriteSymbols, toggleFavoriteSymbol } from '../../api/client'
import { routeFor } from '../../routes'
import type { MarketPair } from '../../api/endpoints'

const TABS = ['all', 'favorites', 'gainers', 'losers', 'new'] as const

function abbreviate(n: number): string {
  if (!isFinite(n) || n <= 0) return '0'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function Markets() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // Single API call — fetch the full ticker list once, then filter client-side
  // for the active tab. This removes the previous 2 simultaneous requests
  // (the screen used to fire one with `tab=...` and another with no tab) and
  // also makes star toggles reflect instantly in the Favs tab without
  // needing a refetch.
  const { data, refetch, isFetching } = useEndpoint<{ items: MarketPair[] }>(
    'api.markets.list',
    {},
    {
      // Tickers don't move every 100ms — 30s of staleness is fine, and lets
      // tab switches use the cached list with zero network.
      staleTime: 30_000,
      // Background-refresh every 30s while the screen is open
      refetchInterval: 30_000,
    },
  )

  // Local mirror of the favorites list — updates instantly on star toggle
  const [favs, setFavs] = useState<string[]>(() => getFavoriteSymbols())
  const toggleFav = (sym: string) => setFavs(toggleFavoriteSymbol(sym))

  const allPairs = (data?.items ?? []) as Array<MarketPair & { priceRaw?: number; volume24hRaw?: number }>

  // Aggregate stats — always computed from the full list
  const numOr = (n: number | undefined, fallback: number): number => (n ?? fallback) || fallback
  const totalVol = allPairs.reduce((s, p) => {
    const vol = numOr(p.volume24hRaw, parseFloat(String(p.volume24h).replace(/,/g, '')))
    const px  = numOr(p.priceRaw, parseFloat(String(p.price).replace(/,/g, '')))
    return s + (isFinite(vol) ? vol : 0) * (isFinite(px) ? px : 0)
  }, 0)
  const btc = allPairs.find(p => p.base === 'BTC')
  const btcVol = btc ? numOr(btc.volume24hRaw, parseFloat(String(btc.volume24h).replace(/,/g, ''))) * numOr(btc.priceRaw, parseFloat(String(btc.price).replace(/,/g, ''))) : 0
  const btcDominance = totalVol > 0 ? ((btcVol / totalVol) * 100).toFixed(1) + '%' : '—'

  // Tab + search filter (client-side)
  const visiblePairs = useMemo(() => {
    let list = allPairs
    if (tab === 'favorites') {
      const set = new Set(favs)
      list = list.filter(p => set.has(p.symbol))
    } else if (tab === 'gainers') {
      list = list.filter(p => parseFloat(p.change24h) > 0)
        .sort((a, b) => parseFloat(b.change24h) - parseFloat(a.change24h))
        .slice(0, 50)
    } else if (tab === 'losers') {
      list = list.filter(p => parseFloat(p.change24h) < 0)
        .sort((a, b) => parseFloat(a.change24h) - parseFloat(b.change24h))
        .slice(0, 50)
    } else if (tab === 'new') {
      list = list.slice(-50).reverse()
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.symbol.toLowerCase().includes(q) || p.base.toLowerCase().includes(q))
    }
    return list
  }, [allPairs, tab, favs, search])

  return (
    <PhoneShell bottomNav={<BottomNav />} onRefresh={async () => { await refetch() }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <h2 style={{ flex: 1 }}>{t('markets.title')}</h2>
        <button onClick={() => setSearchOpen(s => !s)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }} aria-label="Search markets">
          <Icon name="search" size={16} color={searchOpen ? 'var(--gl)' : undefined} />
        </button>
        <button onClick={() => setTab('favorites')} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }} aria-label="Favorites">
          <Icon name="star" size={16} color={tab === 'favorites' ? 'var(--gd)' : undefined} />
        </button>
      </div>
      <div className="t2">{t('markets.subtitle', { count: allPairs.length })}</div>

      {searchOpen && (
        <div className="inp" style={{ marginTop: 6, fontSize: 13 }}>
          <Icon name="search" size={13} color="var(--text-mid-30)" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search BTC, ETH, SOL…"
            style={{ flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Icon name="x" size={12} color="var(--text-mid-30)" />
            </button>
          )}
        </div>
      )}

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 13 }}>{abbreviate(totalVol)}</div><div className="stat-l">24h Vol</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 13, color: 'var(--text-strong)' }}>{btcDominance}</div><div className="stat-l">BTC Vol Share</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 13 }}>{visiblePairs.length}</div><div className="stat-l">Showing</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 13, color: 'var(--text-strong)' }}>{favs.length}</div><div className="stat-l">★ Favs</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 4 }}>
        {TABS.map(tabId => (
          <button key={tabId} className={`tab ${tab === tabId ? 'a' : ''}`} onClick={() => setTab(tabId)}>
            {tabId === 'all' ? 'All' : tabId === 'favorites' ? `★ Favs${favs.length ? ` (${favs.length})` : ''}` : tabId.charAt(0).toUpperCase() + tabId.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading skeleton — only shown on the very first fetch */}
      {allPairs.length === 0 && isFetching && (
        <div className="g" style={{ padding: 14, marginTop: 6, textAlign: 'center' }}>
          <div className="t3">Loading markets…</div>
        </div>
      )}

      {allPairs.length > 0 && visiblePairs.length === 0 && (
        <div className="g" style={{ padding: 14, marginTop: 6, textAlign: 'center' }}>
          <div className="t3">
            {tab === 'favorites'
              ? 'No favorites yet — tap the ★ on any pair to add'
              : search
                ? `No pairs match "${search}"`
                : 'No pairs in this category'}
          </div>
        </div>
      )}

      {visiblePairs.map(p => {
        const chgNum = parseFloat(p.change24h) || 0
        const positive = chgNum >= 0
        const chgDisplay = (positive ? '+' : '') + chgNum.toFixed(2)
        const isFav = favs.includes(p.symbol)
        return (
          <button
            key={p.symbol}
            className="li"
            onClick={() => nav(routeFor('route.trading.spot', { pair: p.symbol }))}
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span
              role="button"
              aria-label={isFav ? `Remove ${p.symbol} from favorites` : `Add ${p.symbol} to favorites`}
              onClick={(e) => { e.stopPropagation(); toggleFav(p.symbol) }}
              style={{ color: isFav ? 'var(--gd)' : 'var(--text-mid-30)', fontSize: 16, cursor: 'pointer', padding: '4px 6px 4px 0' }}
            >{isFav ? '★' : '☆'}</span>
            <CoinIcon symbol={p.base} size={28} />
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{p.symbol}</div>
              <div className="li-s">${p.price}</div>
            </div>
            <div className="li-r">
              <span style={{ color: positive ? 'var(--gl)' : 'var(--r)', fontSize: 13, fontWeight: 700 }}>{chgDisplay}%</span>
            </div>
          </button>
        )
      })}
    </PhoneShell>
  )
}
