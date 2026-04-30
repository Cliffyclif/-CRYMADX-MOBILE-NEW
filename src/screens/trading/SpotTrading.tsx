import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { ROUTES, routeFor } from '../../routes'
import { fmt } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import { checkReserveViolation } from '../../lib/chainReserves'
import { getActivePairs, type TradingPairConfig } from '../../config/tradingPairs'
import type { Balance, MarketPair, Transaction } from '../../api/endpoints'

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
type Interval = typeof INTERVALS[number]

interface Trade { id: string; price: number; amount: number; time: number; isBuyerMaker: boolean }
interface Candle { t: number; o: number; h: number; l: number; c: number }
interface OrderRow { id: string; pair: string; side: 'buy' | 'sell'; type: 'limit' | 'market' | 'stop-limit'; price: string; amount: string; filled?: string; status: string; createdAt: string }

const FAV_KEY = 'crymadx.trading.favorites'

/** "BTCUSDT" → "BTC/USDT" using the pair config so we display correctly. */
function configToDisplay(p: TradingPairConfig): string {
  return `${p.baseAsset}/${p.quoteAsset}`
}

function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] }
}
function saveFavs(list: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function SpotTrading() {
  const nav = useNavigate()
  const { pair: pairParam = 'BTC/USDT' } = useParams()
  const pairStr = useMemo(() => {
    try { return decodeURIComponent(pairParam) } catch { return pairParam }
  }, [pairParam])
  const [base, quote] = pairStr.split('/')

  // Live ticker — refetched periodically so the header price stays fresh
  const { data: pair } = useEndpoint<MarketPair>('api.markets.pair', {
    pathParams: { pair: pairStr },
  }, { refetchInterval: 5_000 })

  // Order book — refetched every 2s for the snappy feel of a real exchange
  const { data: book } = useEndpoint<{ bids: Array<{ price: string; amount: string }>; asks: Array<{ price: string; amount: string }> }>('api.markets.orderbook', {
    pathParams: { pair: pairStr },
  }, { refetchInterval: 2_000 })

  // Live trades feed — refetched every 3s
  const { data: tradesRes } = useEndpoint<{ items: Trade[] }>('api.markets.trades', {
    pathParams: { pair: pairStr }, query: { limit: 30 },
  }, { refetchInterval: 3_000 })
  const trades = tradesRes?.items ?? []

  // Candles — refetched on interval change
  const [interval, setInterval] = useState<Interval>('15m')
  const { data: candlesRes } = useEndpoint<{ items: Candle[] }>('api.markets.candles', {
    pathParams: { pair: pairStr }, query: { interval },
  }, { refetchInterval: 30_000 })
  const candles = candlesRes?.items ?? []

  // User wallet balances — used for % buttons + reserve check
  const { data: balRes } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list', {}, { refetchInterval: 15_000 })
  const balances = balRes?.items ?? []
  const baseBalance = parseFloat(balances.find(b => b.asset.toUpperCase() === base.toUpperCase())?.amount ?? '0') || 0
  const quoteBalance = parseFloat(balances.find(b => b.asset.toUpperCase() === quote.toUpperCase())?.amount ?? '0') || 0

  // Open orders & history (filtered to this pair)
  const { data: openRes, refetch: refetchOpen } = useEndpoint<{ items: OrderRow[] }>('api.trading.orders.open', {}, { refetchInterval: 10_000 })
  const { data: historyRes } = useEndpoint<{ items: OrderRow[] }>('api.trading.orders.history')
  const openOrders = (openRes?.items ?? []).filter(o => o.pair === pairStr)
  const orderHistory = (historyRes?.items ?? []).filter(o => o.pair === pairStr)

  const cancelOrder = useEndpointMutation<{ pathParams: { orderId: string } }, void>('api.trading.order.cancel', {
    invalidates: ['api.trading.orders.open', 'api.wallet.balances.list'],
  })

  // Form state
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop-limit'>('limit')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [bottomTab, setBottomTab] = useState<'open' | 'history'>('open')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())
  const isFav = favs.includes(pairStr)
  const toggleFav = () => {
    haptics.selection()
    const next = isFav ? favs.filter(p => p !== pairStr) : [pairStr, ...favs]
    setFavs(next); saveFavs(next)
  }

  // When the pair price ticks for the first time and the user hasn't typed
  // a price, pre-fill it so the limit form is immediately usable.
  useEffect(() => {
    if (!price && pair?.price) setPrice(pair.price)
  }, [pair?.price, price])

  const positive = pair && !pair.change24h.startsWith('-')

  /** Apply a percentage of the available balance to the amount field. */
  const applyPct = (pct: number) => {
    haptics.selection()
    if (side === 'buy') {
      // Buy: spend `pct` of QUOTE balance, divide by price for base amount
      const px = parseFloat(orderType === 'market' ? (pair?.price ?? '0') : (price || pair?.price || '0'))
      if (!px) return
      const spend = quoteBalance * pct
      // Reserve a tiny buffer for fee (0.1%)
      const buf = spend * 0.999
      setAmount((buf / px).toFixed(8).replace(/\.?0+$/, ''))
    } else {
      // Sell: a percentage of the BASE balance, capped by reserve.
      const reserveErr = checkReserveViolation(base.toLowerCase(), base, baseBalance, baseBalance * pct)
      if (pct === 1 && reserveErr) {
        // For 100% sell on a chain with reserve, use max-spendable instead
        const max = baseBalance - parseFloat(reserveErr.match(/Max:\s*([\d.]+)/)?.[1] || '0')
        setAmount(String(max))
      } else {
        setAmount((baseBalance * pct).toFixed(8).replace(/\.?0+$/, ''))
      }
    }
  }

  /** Submit goes through OrderConfirm where it actually hits the backend. */
  const placeOrder = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter an amount'); return
    }
    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      toast.error('Enter a price'); return
    }
    // Pre-flight: make sure the user has enough for what they typed
    if (side === 'buy') {
      const px = parseFloat(orderType === 'market' ? (pair?.price ?? '0') : price)
      const need = parseFloat(amount) * px * 1.001
      if (need > quoteBalance) {
        toast.error(`Insufficient ${quote} — have ${quoteBalance}, need ${need.toFixed(2)}`); return
      }
    } else {
      if (parseFloat(amount) > baseBalance) {
        toast.error(`Insufficient ${base} — have ${baseBalance}`); return
      }
      const reserveErr = checkReserveViolation(base.toLowerCase(), base, baseBalance, parseFloat(amount))
      if (reserveErr) { toast.error(reserveErr); return }
    }
    haptics.medium()
    nav(ROUTES['route.trading.confirm'].path, {
      state: { pair: pairStr, side, type: orderType, price: orderType === 'market' ? (pair?.price ?? price) : price, amount },
    })
  }

  const onCancelOrder = async (id: string) => {
    haptics.warning()
    try {
      await cancelOrder.mutateAsync({ pathParams: { orderId: id } })
      toast.success('Order cancelled')
      refetchOpen()
    } catch (e: any) { toast.error(e?.message ?? 'Cancel failed') }
  }

  return (
    <PhoneShell noTabs disableSwipeBack>
      {/* Header — pair, star, ticker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }}>
            <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
          </button>
          <button onClick={() => { haptics.selection(); setPickerOpen(true) }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 0 }}>
            <CoinIcon symbol={base} size={20} />
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>{pairStr}</span>
            <span style={{ color: 'var(--text-mid-30)', fontSize: 12 }}>▾</span>
          </button>
          <button onClick={toggleFav} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} aria-label={isFav ? 'Remove favorite' : 'Add favorite'}>
            <span style={{ fontSize: 16, color: isFav ? 'var(--gd)' : 'var(--text-mid-30)' }}>{isFav ? '★' : '☆'}</span>
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: positive ? 'var(--gl)' : 'var(--r)' }}>{pair?.price ?? '—'}</div>
          <div style={{ fontSize: 12, color: positive ? 'var(--gl)' : 'var(--r)' }}>{pair ? `${positive ? '+' : ''}${pair.change24h}%` : '—'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats" style={{ marginTop: 4, gap: 3 }}>
        <Stat label="24h High" value={pair?.high24h ?? '—'} />
        <Stat label="24h Low" value={pair?.low24h ?? '—'} />
        <Stat label="Volume" value={pair ? formatBig(pair.volume24h) : '—'} />
      </div>

      {/* Chart */}
      <div className="tabs" style={{ fontSize: 11, marginTop: 6 }}>
        {INTERVALS.map(i => (
          <button key={i} className={`tab ${interval === i ? 'a' : ''}`} onClick={() => { haptics.selection(); setInterval(i) }}>{i}</button>
        ))}
      </div>
      <CandleChart candles={candles} positive={!!positive} />

      {/* Order book + live trades — side-by-side on phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 13, margin: 0 }}>Order Book</h3>
          </div>
          <DepthBook book={book} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 13, margin: 0 }}>Trades</h3>
          </div>
          <TradesFeed trades={trades} />
        </div>
      </div>

      {/* Buy/Sell tabs */}
      <div style={{ display: 'flex', gap: 3, margin: '10px 0 6px' }}>
        <button className="btn btn-g" style={{ flex: 1, padding: 10, margin: 0, fontSize: 14, opacity: side === 'buy' ? 1 : 0.45 }} onClick={() => { haptics.selection(); setSide('buy') }}>BUY</button>
        <button className="btn btn-r" style={{ flex: 1, padding: 10, margin: 0, fontSize: 14, opacity: side === 'sell' ? 1 : 0.45 }} onClick={() => { haptics.selection(); setSide('sell') }}>SELL</button>
      </div>

      {/* Order type tabs */}
      <div className="tabs" style={{ fontSize: 11 }}>
        {(['limit', 'market', 'stop-limit'] as const).map(t => (
          <button key={t} className={`tab ${orderType === t ? 'a' : ''}`} onClick={() => { haptics.selection(); setOrderType(t) }}>
            {t === 'stop-limit' ? 'Stop-Limit' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Available balance display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid-40)', margin: '4px 2px 0' }}>
        <span>Avail: <span style={{ color: 'var(--text-strong)' }}>{(side === 'buy' ? quoteBalance : baseBalance).toFixed(6)}</span> {side === 'buy' ? quote : base}</span>
        <span>≈ ${(side === 'buy' ? quoteBalance : baseBalance * (parseFloat(pair?.price ?? '0') || 0)).toFixed(2)}</span>
      </div>

      {/* Price + Amount inputs */}
      <div style={{ display: 'flex', gap: 4, margin: '4px 0' }}>
        <div style={{ flex: 1 }}>
          <div className="t3">Price</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input
              type="number" inputMode="decimal" placeholder={pair?.price ?? '0'}
              value={orderType === 'market' ? '' : price}
              onChange={e => setPrice(e.target.value)}
              disabled={orderType === 'market'}
              style={{ flex: 1, color: 'var(--text-strong)' }} step="any"
            />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{quote}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="t3">Amount</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input
              type="number" inputMode="decimal" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={{ flex: 1 }} step="any"
            />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{base}</span>
          </div>
        </div>
      </div>

      {/* Quick % buttons — wired */}
      <div style={{ display: 'flex', gap: 3, margin: '4px 0' }}>
        {[0.25, 0.5, 0.75, 1].map(p => (
          <button
            key={p}
            className="badge"
            style={{ flex: 1, padding: 6, background: 'var(--surface-soft)', border: '1px solid var(--divider)', cursor: 'pointer', fontSize: 11, color: 'var(--text-strong)' }}
            onClick={() => applyPct(p)}
          >
            {Math.round(p * 100)}%
          </button>
        ))}
      </div>

      {/* Total preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid-40)', margin: '6px 2px' }}>
        <span>Total</span>
        <span style={{ color: 'var(--text-strong)' }}>
          {(parseFloat(orderType === 'market' ? (pair?.price ?? '0') : price || '0') * parseFloat(amount || '0')).toFixed(2)} {quote}
        </span>
      </div>

      <button
        className={side === 'buy' ? 'btn btn-g' : 'btn btn-r'}
        style={{ marginTop: 4 }}
        onClick={placeOrder}
        disabled={!amount || (orderType !== 'market' && !price)}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {base}
      </button>

      {/* Open Orders / History */}
      <div className="tabs" style={{ fontSize: 12, marginTop: 12 }}>
        <button className={`tab ${bottomTab === 'open' ? 'a' : ''}`} onClick={() => setBottomTab('open')}>
          Open Orders ({openOrders.length})
        </button>
        <button className={`tab ${bottomTab === 'history' ? 'a' : ''}`} onClick={() => setBottomTab('history')}>
          History
        </button>
      </div>

      {bottomTab === 'open' && (
        openOrders.length === 0 ? (
          <div className="g" style={{ padding: 12, textAlign: 'center', marginTop: 4 }}>
            <div className="t3">No open orders for {pairStr}</div>
          </div>
        ) : openOrders.map(o => (
          <div key={o.id} className="li" style={{ width: '100%' }}>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 13 }}>
                <span style={{ color: o.side === 'buy' ? 'var(--gl)' : 'var(--r)' }}>{o.side.toUpperCase()}</span> {o.amount} {o.pair.split('/')[0]} @ {o.price}
              </div>
              <div className="li-s">{o.type} · {new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="li-r">
              <button onClick={() => onCancelOrder(o.id)} className="badge badge-r" style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', cursor: 'pointer', fontSize: 11 }}>
                Cancel
              </button>
            </div>
          </div>
        ))
      )}
      {bottomTab === 'history' && (
        orderHistory.length === 0 ? (
          <div className="g" style={{ padding: 12, textAlign: 'center', marginTop: 4 }}>
            <div className="t3">No filled orders for {pairStr}</div>
          </div>
        ) : orderHistory.slice(0, 30).map(o => (
          <button key={o.id} className="li" onClick={() => nav(routeFor('route.trading.detail', { tradeId: o.id }))} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none' }}>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 13 }}>
                <span style={{ color: o.side === 'buy' ? 'var(--gl)' : 'var(--r)' }}>{o.side.toUpperCase()}</span> {o.amount} {o.pair.split('/')[0]} @ {o.price}
              </div>
              <div className="li-s">{o.type} · {new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="li-r">
              <span className={`badge badge-${o.status === 'filled' ? 'g' : o.status === 'cancelled' ? 'r' : 'gd'}`} style={{ fontSize: 9 }}>
                {o.status}
              </span>
            </div>
          </button>
        ))
      )}

      {pickerOpen && <PairPicker current={pairStr} favs={favs} setFavs={(f) => { setFavs(f); saveFavs(f) }} onPick={(p) => { setPickerOpen(false); nav(routeFor('route.trading.spot', { pair: p })) }} onClose={() => setPickerOpen(false)} />}
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat" style={{ padding: 4 }}>
      <div className="stat-v" style={{ fontSize: 11 }}>{value}</div>
      <div className="stat-l" style={{ fontSize: 8 }}>{label}</div>
    </div>
  )
}

function CandleChart({ candles, positive }: { candles: Array<{ t: number; o: number; h: number; l: number; c: number }>; positive: boolean }) {
  if (!candles || candles.length === 0) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-soft)', borderRadius: 8, color: 'var(--text-mid-30)', fontSize: 12, marginTop: 4 }}>
        Loading chart…
      </div>
    )
  }
  const W = 360
  const H = 140
  const padX = 6
  const padY = 8
  const minLow = Math.min(...candles.map(c => c.l))
  const maxHigh = Math.max(...candles.map(c => c.h))
  const range = maxHigh - minLow || 1
  const cw = (W - padX * 2) / candles.length
  const y = (v: number) => padY + ((maxHigh - v) / range) * (H - padY * 2)

  return (
    <div style={{ marginTop: 4, background: 'var(--surface-soft)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {/* Subtle grid */}
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" x2={W} y1={padY + p * (H - padY * 2)} y2={padY + p * (H - padY * 2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {candles.map((c, i) => {
          const x = padX + i * cw + cw / 2
          const isUp = c.c >= c.o
          const color = isUp ? 'var(--gl)' : 'var(--r)'
          const top = y(Math.max(c.o, c.c))
          const bot = y(Math.min(c.o, c.c))
          return (
            <g key={c.t}>
              <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
              <rect
                x={x - cw * 0.35} y={top} width={cw * 0.7} height={Math.max(1, bot - top)}
                fill={color} stroke={color} strokeWidth="0.5"
              />
            </g>
          )
        })}
      </svg>
      <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 9, color: positive ? 'var(--gl)' : 'var(--r)', opacity: 0.7 }}>
        {candles.length} candles
      </div>
    </div>
  )
}

function DepthBook({ book }: { book?: { bids: Array<{ price: string; amount: string }>; asks: Array<{ price: string; amount: string }> } }) {
  const bids = (book?.bids ?? []).slice(0, 8)
  const asks = (book?.asks ?? []).slice(0, 8).reverse()
  const allAmounts = [...bids, ...asks].map(r => parseFloat(r.amount) || 0)
  const max = Math.max(0.0001, ...allAmounts)
  return (
    <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 4, fontSize: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid-30)', padding: '0 4px 2px', fontSize: 9 }}>
        <span>Price</span><span>Amount</span>
      </div>
      {asks.map((r, i) => {
        const w = ((parseFloat(r.amount) || 0) / max) * 100
        return (
          <div key={`a${i}`} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '1px 4px', color: 'var(--r)' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 auto', width: `${w}%`, background: 'rgba(239,68,68,.12)' }} />
            <span style={{ position: 'relative' }}>{r.price}</span>
            <span style={{ position: 'relative', color: 'var(--text-mid-50)' }}>{r.amount}</span>
          </div>
        )
      })}
      {/* Spread row */}
      {asks.length > 0 && bids.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0', color: 'var(--text-mid-30)', fontSize: 9, borderTop: '1px solid rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          Spread {(parseFloat(asks[asks.length - 1].price) - parseFloat(bids[0].price)).toFixed(2)}
        </div>
      )}
      {bids.map((r, i) => {
        const w = ((parseFloat(r.amount) || 0) / max) * 100
        return (
          <div key={`b${i}`} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '1px 4px', color: 'var(--gl)' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 auto', width: `${w}%`, background: 'rgba(0,200,83,.12)' }} />
            <span style={{ position: 'relative' }}>{r.price}</span>
            <span style={{ position: 'relative', color: 'var(--text-mid-50)' }}>{r.amount}</span>
          </div>
        )
      })}
    </div>
  )
}

function TradesFeed({ trades }: { trades: Trade[] }) {
  if (!trades || trades.length === 0) {
    return <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 12, fontSize: 11, color: 'var(--text-mid-30)', textAlign: 'center' }}>No recent trades</div>
  }
  return (
    <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 4, fontSize: 10, maxHeight: 200, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid-30)', padding: '0 4px 2px', fontSize: 9 }}>
        <span>Price</span><span>Amount</span><span>Time</span>
      </div>
      {trades.slice(0, 14).map(t => (
        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: t.isBuyerMaker ? 'var(--r)' : 'var(--gl)' }}>{fmt(t.price, { grouping: false })}</span>
          <span style={{ color: 'var(--text-mid-50)' }}>{fmt(t.amount, { grouping: false })}</span>
          <span style={{ color: 'var(--text-mid-30)' }}>{new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pair picker bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

type PickerTab = 'all' | 'favs' | string

function PairPicker({ current, favs, setFavs, onPick, onClose }: { current: string; favs: string[]; setFavs: (f: string[]) => void; onPick: (p: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const dismiss = useSheetDismiss({ onDismiss: onClose })

  // The full list of active trading pairs comes from the same shared config
  // the production website uses (src/config/tradingPairs.ts — 146 pairs).
  const allConfigured = useMemo(() => {
    return getActivePairs().map(p => ({
      display: configToDisplay(p),
      base: p.baseAsset,
      name: p.baseName,
      category: p.category,
    }))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(allConfigured.map(p => p.category))
    return Array.from(set).sort()
  }, [allConfigured])

  const [tab, setTab] = useState<PickerTab>(favs.length > 0 ? 'favs' : 'all')

  const visible = useMemo(() => {
    let list = allConfigured
    if (tab === 'favs') list = list.filter(p => favs.includes(p.display))
    else if (tab !== 'all') list = list.filter(p => p.category === tab)
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter(p =>
        p.display.toLowerCase().includes(needle) ||
        p.base.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle),
      )
    }
    // Star’d pairs first
    return list.slice().sort((a, b) => {
      const af = favs.includes(a.display) ? 0 : 1
      const bf = favs.includes(b.display) ? 0 : 1
      return af - bf
    })
  }, [allConfigured, tab, favs, q])

  return (
    <div
      role="dialog" aria-modal="true" data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '85vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 6px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ flex: 1, margin: 0 }}>Select pair</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="inp" style={{ marginBottom: 8 }}>
          <Icon name="search" size={13} color="var(--text-mid-30)" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search pairs (e.g. BTC, ETH/USDT)" style={{ flex: 1 }} />
        </div>
        <div className="tabs" style={{ fontSize: 11, marginBottom: 4, overflowX: 'auto', flexWrap: 'nowrap' }}>
          <button className={`tab ${tab === 'favs' ? 'a' : ''}`} onClick={() => setTab('favs')}>★ ({favs.length})</button>
          <button className={`tab ${tab === 'all' ? 'a' : ''}`} onClick={() => setTab('all')}>All ({allConfigured.length})</button>
          {categories.map(c => (
            <button key={c} className={`tab ${tab === c ? 'a' : ''}`} onClick={() => setTab(c)} style={{ textTransform: 'capitalize' }}>{c}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {visible.length === 0 && (
            <div className="g" style={{ padding: 16, textAlign: 'center' }}>
              <div className="t3">{tab === 'favs' ? 'No favorites yet — star a pair to add' : `No matches for "${q}"`}</div>
            </div>
          )}
          {visible.map(p => {
            const isFav = favs.includes(p.display)
            const isActive = p.display === current
            return (
              <div key={p.display} className="li" style={{ width: '100%', cursor: 'pointer', background: isActive ? 'rgba(0,200,83,.06)' : undefined, border: isActive ? '1px solid rgba(0,200,83,.35)' : 'none' }}>
                <button onClick={() => onPick(p.display)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', textAlign: 'left' }}>
                  <CoinIcon symbol={p.base} size={28} />
                  <div className="li-c">
                    <div className="li-n">{p.display} {isActive && <span className="grn" style={{ fontSize: 13 }}>✓</span>}</div>
                    <div className="li-s">{p.name}</div>
                  </div>
                  <span className="badge" style={{ fontSize: 8, marginRight: 4, opacity: 0.6, textTransform: 'capitalize' }}>{p.category}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); haptics.selection(); setFavs(isFav ? favs.filter(x => x !== p.display) : [p.display, ...favs]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: isFav ? 'var(--gd)' : 'var(--text-mid-30)', fontSize: 18 }}
                  aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                >
                  {isFav ? '★' : '☆'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBig(s: string): string {
  const n = parseFloat(s)
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
  return s
}

// Re-export Transaction type so the file's imports stay tree-shakeable
export type { Transaction }
