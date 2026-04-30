import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { MarketPair } from '../../api/endpoints'

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const

export function SpotTrading() {
  const nav = useNavigate()
  const { pair: pairParam = 'BTC/USDT' } = useParams()
  const pairStr = decodeURIComponent(pairParam)

  const { data: pair } = useEndpoint<MarketPair>('api.markets.pair', { pathParams: { pair: pairStr } })
  const { data: book } = useEndpoint<{ bids: Array<{ price: string; amount: string }>; asks: Array<{ price: string; amount: string }> }>('api.markets.orderbook', { pathParams: { pair: pairStr } })

  const [interval, setInterval] = useState<typeof INTERVALS[number]>('15m')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop-limit'>('limit')
  const [price, setPrice] = useState(pair?.price ?? '')
  const [amount, setAmount] = useState('')

  const positive = pair && !pair.change24h.startsWith('-')

  const placeOrder = () => {
    nav(ROUTES['route.trading.confirm'].path, {
      state: { pair: pairStr, side, type: orderType, price: orderType === 'market' ? pair?.price ?? price : price, amount },
    })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
            <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
          </button>
          <span style={{ color: 'var(--text-mid-30)', fontSize: 16 }}>★</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>{pairStr}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>{pair?.price ?? '—'}</div>
          <div style={{ fontSize: 13, color: positive ? 'var(--gl)' : 'var(--r)' }}>{pair?.change24h ?? '—'}%</div>
        </div>
      </div>

      <div className="stats" style={{ marginTop: 4, gap: 3 }}>
        <Stat label="24h High" value={pair?.high24h ?? '—'} />
        <Stat label="24h Low" value={pair?.low24h ?? '—'} />
        <Stat label="Volume" value={pair ? formatBig(pair.volume24h) : '—'} />
      </div>

      <div className="tabs" style={{ fontSize: 10 }}>
        {INTERVALS.map(i => <button key={i} className={`tab ${interval === i ? 'a' : ''}`} onClick={() => setInterval(i)}>{i}</button>)}
      </div>

      <FakeChart seed={interval} />

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
        <h3 style={{ fontSize: 14 }}>Order Book</h3>
        <div className="t3">Spread: 0.01%</div>
      </div>

      <div className="ob">
        <div className="ob-c">
          {book?.bids?.map((r, i) => (
            <div key={i} className="ob-r bid"><span>{r.price}</span><span>{r.amount}</span></div>
          ))}
        </div>
        <div className="ob-c">
          {book?.asks?.map((r, i) => (
            <div key={i} className="ob-r ask"><span>{r.price}</span><span>{r.amount}</span></div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, margin: '6px 0' }}>
        <button className="btn btn-g" style={{ flex: 1, padding: 9, margin: 0, fontSize: 15, opacity: side === 'buy' ? 1 : 0.5 }} onClick={() => setSide('buy')}>BUY</button>
        <button className="btn btn-r" style={{ flex: 1, padding: 9, margin: 0, fontSize: 15, opacity: side === 'sell' ? 1 : 0.5 }} onClick={() => setSide('sell')}>SELL</button>
      </div>

      <div className="tabs" style={{ fontSize: 11 }}>
        {(['limit', 'market', 'stop-limit'] as const).map(t => (
          <button key={t} className={`tab ${orderType === t ? 'a' : ''}`} onClick={() => setOrderType(t)}>
            {t === 'stop-limit' ? 'Stop-Limit' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 3, margin: '4px 0' }}>
        <div style={{ flex: 1 }}>
          <div className="t3">Price</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input type="number" inputMode="decimal" placeholder={pair?.price ?? '0'} value={orderType === 'market' ? '' : price} onChange={e => setPrice(e.target.value)} disabled={orderType === 'market'} style={{ flex: 1, color: 'var(--text-strong)' }} step="any" />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{pairStr.split('/')[1]}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="t3">Amount</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1 }} step="any" />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{pairStr.split('/')[0]}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, margin: '4px 0' }}>
        {['25%', '50%', '75%', '100%'].map(p => (
          <button key={p} className="badge" style={{ flex: 1, padding: 4, background: 'var(--surface-soft)', border: '1px solid var(--divider)', cursor: 'pointer', fontSize: 11 }}>{p}</button>
        ))}
      </div>

      <button className="btn btn-g" style={{ marginTop: 4 }} onClick={placeOrder} disabled={!amount || (orderType !== 'market' && !price)}>
        {side === 'buy' ? 'Buy' : 'Sell'} {pairStr.split('/')[0]}
      </button>
    </PhoneShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat" style={{ padding: 4 }}>
      <div className="stat-v" style={{ fontSize: 11 }}>{value}</div>
      <div className="stat-l" style={{ fontSize: 8 }}>{label}</div>
    </div>
  )
}

function FakeChart({ seed }: { seed: string }) {
  const candles = Array.from({ length: 38 }, (_, i) => {
    const v = 25 + ((seed.charCodeAt(0) + i * 7) % 50)
    const isGreen = i % 3 !== 0
    return { v, isGreen }
  })
  return (
    <div className="chart">
      {candles.map((c, i) => (
        <div key={i} className="candle" style={{ height: `${c.v}%`, background: c.isGreen ? 'var(--gl)' : 'var(--r)' }} />
      ))}
    </div>
  )
}

function formatBig(s: string): string {
  const n = parseFloat(s)
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
  return s
}
