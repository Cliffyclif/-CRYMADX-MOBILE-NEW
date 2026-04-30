import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import type { Balance } from '../../api/endpoints'

const TABS = ['all', 'favorites', 'holdings', 'defi', 'l1', 'l2'] as const

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', USDC: 'USD Coin',
  SOL: 'Solana', BNB: 'BNB', XRP: 'XRP', DOGE: 'Dogecoin', DOT: 'Polkadot',
  AVAX: 'Avalanche', MATIC: 'Polygon', LINK: 'Chainlink', ADA: 'Cardano',
  TRX: 'TRON', LTC: 'Litecoin', BCH: 'Bitcoin Cash', XLM: 'Stellar',
  ATOM: 'Cosmos', ETC: 'Ethereum Classic', NEAR: 'NEAR Protocol',
}

import { fmt } from '../../lib/format'
function formatPrice(p: number): string { return fmt(p) }

export function AssetSelector() {
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const { data: priceData } = useEndpoint<{ prices: Array<{ symbol: string; price: number; change24h: number }> }>('api.prices.list')

  const heldSet = new Set(bal?.items?.map(b => b.asset) ?? [])

  const allAssets = (priceData?.prices ?? []).map(p => ({
    symbol: p.symbol.toUpperCase(),
    name: ASSET_NAMES[p.symbol.toUpperCase()] ?? p.symbol,
    price: formatPrice(p.price),
    change: (p.change24h >= 0 ? '+' : '') + p.change24h.toFixed(2) + '%',
  }))

  const items = allAssets.filter(a => {
    if (tab === 'all') return true
    if (tab === 'holdings') return heldSet.has(a.symbol)
    return true
  })

  return (
    <PhoneShell noTabs>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto 10px' }} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>Select Asset</h2>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="inp" style={{ marginTop: 6 }}>
        <Icon name="search" size={14} />
        <input placeholder={`Search ${allAssets.length} assets...`} style={{ flex: 1 }} />
      </div>
      <div className="tabs" style={{ marginTop: 4, fontSize: 10 }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'a' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : t === 'favorites' ? '★ Favs' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {items.map(a => {
        const myBal = bal?.items?.find(b => b.asset === a.symbol)
        return (
          <div key={a.symbol} className="li">
            <span style={{ color: 'var(--text-mid-30)', fontSize: 15 }}>★</span>
            <CoinIcon symbol={a.symbol} size={30} />
            <div className="li-c">
              <div className="li-n">{a.symbol} <span className="t3" style={{ fontSize: 11 }}>{a.name}</span></div>
              <div className="li-s">${a.price} · <span style={{ color: a.change.startsWith('-') ? 'var(--r)' : 'var(--gl)' }}>{a.change}</span></div>
            </div>
            <div className="li-r"><div className="li-v" style={{ fontSize: 14 }}>{myBal?.amount ?? '0'} {a.symbol}</div></div>
          </div>
        )
      })}
    </PhoneShell>
  )
}
