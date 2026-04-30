import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { getFavoriteSymbols, toggleFavoriteSymbol } from '../../api/client'
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
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  // Always pull the full list to compute the stats; tab filter is applied in client fallback handler
  const { data, refetch } = useEndpoint<{ items: MarketPair[] }>('api.markets.list', { query: { tab } })
  const { data: allData, refetch: refetchAll } = useEndpoint<{ items: MarketPair[] }>('api.markets.list')
  const [favs, setFavs] = useState<string[]>(() => getFavoriteSymbols())
  useEffect(() => { setFavs(getFavoriteSymbols()) }, [tab])
  const toggleFav = (sym: string) => setFavs(toggleFavoriteSymbol(sym))

  // Compute aggregate stats from the unfiltered list
  const allPairs = (allData?.items ?? []) as Array<MarketPair & { priceRaw?: number; volume24hRaw?: number }>
  const numOr = (n: number | undefined, fallback: number): number => (n ?? fallback) || fallback
  const totalVol = allPairs.reduce((s, p) => {
    const vol = numOr(p.volume24hRaw, parseFloat(String(p.volume24h).replace(/,/g, '')))
    const px  = numOr(p.priceRaw, parseFloat(String(p.price).replace(/,/g, '')))
    return s + (isFinite(vol) ? vol : 0) * (isFinite(px) ? px : 0)
  }, 0)
  const btcVol = (() => {
    const btc = allPairs.find(p => p.base === 'BTC')
    if (!btc) return 0
    const v = numOr(btc.volume24hRaw, parseFloat(String(btc.volume24h).replace(/,/g, '')))
    const p = numOr(btc.priceRaw, parseFloat(String(btc.price).replace(/,/g, '')))
    return (isFinite(v) ? v : 0) * (isFinite(p) ? p : 0)
  })()
  const btcDominance = totalVol > 0 ? ((btcVol / totalVol) * 100).toFixed(1) + '%' : '—'

  return (
    <PhoneShell bottomNav={<BottomNav />} onRefresh={async () => { await Promise.all([refetch(), refetchAll()]) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <h2 style={{ flex: 1 }}>{t('markets.title')}</h2>
        <Icon name="search" size={16} />
        <Icon name="star" size={16} />
      </div>
      <div className="t2">{t('markets.subtitle', { count: allPairs.length })}</div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 13 }}>{abbreviate(totalVol)}</div><div className="stat-l">24h Vol</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 13, color: 'var(--text-strong)' }}>{btcDominance}</div><div className="stat-l">BTC Vol Share</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 13 }}>{data?.items?.length ?? 0}</div><div className="stat-l">Showing</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 13, color: 'var(--text-strong)' }}>{favs.length}</div><div className="stat-l">★ Favs</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 4 }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'a' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : t === 'favorites' ? '★ Favs' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {data?.items?.map(p => {
        const chgNum = parseFloat(p.change24h) || 0
        const positive = chgNum >= 0
        const chgDisplay = (positive ? '+' : '') + chgNum.toFixed(2)
        const isFav = favs.includes(p.symbol)
        return (
          <div key={p.symbol} className="li">
            <span
              role="button"
              aria-label={isFav ? `Remove ${p.symbol} from favorites` : `Add ${p.symbol} to favorites`}
              onClick={(e) => { e.stopPropagation(); toggleFav(p.symbol) }}
              style={{ color: isFav ? 'var(--gl)' : 'var(--text-mid-30)', fontSize: 15, cursor: 'pointer' }}
            >★</span>
            <CoinIcon symbol={p.base} size={28} />
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{p.symbol}</div>
              <div className="li-s">${p.price}</div>
            </div>
            <div className="li-r">
              <span style={{ color: positive ? 'var(--gl)' : 'var(--r)', fontSize: 13, fontWeight: 700 }}>{chgDisplay}%</span>
            </div>
            <div className="badge badge-g" style={{ fontSize: 9, marginLeft: 4 }}>Trade</div>
          </div>
        )
      })}
    </PhoneShell>
  )
}
