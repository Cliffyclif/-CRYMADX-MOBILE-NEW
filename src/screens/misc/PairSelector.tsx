import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { MarketPair } from '../../api/endpoints'

const TABS = ['USDT', 'USDC', 'BTC', 'ETH', '★'] as const

export function PairSelector() {
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('USDT')
  const { data } = useEndpoint<{ items: MarketPair[] }>('api.markets.list')

  const items = (data?.items ?? []).filter(p => tab === '★' ? false : p.quote === tab)

  return (
    <PhoneShell noTabs>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto 10px' }} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>Trading Pair</h2>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="inp" style={{ marginTop: 6 }}>
        <Icon name="search" size={14} />
        <input placeholder="Search pairs..." style={{ flex: 1 }} />
      </div>
      <div className="tabs" style={{ marginTop: 4, fontSize: 10 }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'a' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>Pair</span><span style={{ marginLeft: 'auto' }}>Price · Change</span>
      </div>

      {items.map(p => {
        const positive = !p.change24h.startsWith('-')
        return (
          <button key={p.symbol} onClick={() => nav(routeFor('route.trading.spot', { pair: p.symbol }))} className="li" style={{ width: '100%', textAlign: 'left' }}>
            <span style={{ color: 'var(--text-mid-30)', fontSize: 15 }}>★</span>
            <CoinIcon symbol={p.base} size={28} />
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{p.symbol}</div>
            </div>
            <div className="li-r">
              <div className="li-v" style={{ fontSize: 14 }}>{p.price}</div>
              <div style={{ color: positive ? 'var(--gl)' : 'var(--r)', fontSize: 11 }}>{p.change24h}%</div>
            </div>
          </button>
        )
      })}
    </PhoneShell>
  )
}
