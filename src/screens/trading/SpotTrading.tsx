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
import { getActivePairs, getPairBySymbol, type TradingPairConfig } from '../../config/tradingPairs'
import { useBinanceWS } from '../../hooks/useBinanceWS'
import { TradingViewChart } from '../../components/TradingViewChart'
import type { Balance, MarketPair, Transaction } from '../../api/endpoints'

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
type Interval = typeof INTERVALS[number]

interface Trade { id: string; price: number; amount: number; time: number; isBuyerMaker: boolean }
interface Candle { t: number; o: number; h: number; l: number; c: number }
interface OrderRow { id: string; pair: string; side: 'buy' | 'sell'; type: 'limit' | 'market' | 'stop-limit'; price: string; amount: string; filled?: string; status: string; createdAt: string }

const FAV_KEY = 'crymadx.trading.favorites'
const STUDIES_KEY = 'crymadx.trading.studies'      // selected indicator IDs
const CHART_MODE_KEY = 'crymadx.trading.chartMode' // 'simple' | 'advanced'

/** TradingView indicator catalog — what we expose as toggleable chips.
 *  IDs are TradingView's built-in study identifiers. */
const INDICATORS: Array<{ id: string; label: string; short: string }> = [
  { id: 'MASimple@tv-basicstudies',      label: 'Moving Average (SMA)', short: 'MA' },
  { id: 'MAExp@tv-basicstudies',         label: 'Exponential MA',       short: 'EMA' },
  { id: 'BB@tv-basicstudies',            label: 'Bollinger Bands',      short: 'BB' },
  { id: 'RSI@tv-basicstudies',           label: 'RSI',                  short: 'RSI' },
  { id: 'MACD@tv-basicstudies',          label: 'MACD',                 short: 'MACD' },
  { id: 'Stochastic@tv-basicstudies',    label: 'Stochastic',           short: 'STOCH' },
  { id: 'Volume@tv-basicstudies',        label: 'Volume',               short: 'VOL' },
  { id: 'IchimokuCloud@tv-basicstudies', label: 'Ichimoku Cloud',       short: 'ICHI' },
  { id: 'AwesomeOscillator@tv-basicstudies', label: 'Awesome Oscillator', short: 'AO' },
  { id: 'ATR@tv-basicstudies',           label: 'Average True Range',   short: 'ATR' },
  { id: 'CCI@tv-basicstudies',           label: 'CCI',                  short: 'CCI' },
  { id: 'OBV@tv-basicstudies',           label: 'On-Balance Volume',    short: 'OBV' },
  { id: 'VWAP@tv-basicstudies',          label: 'VWAP',                 short: 'VWAP' },
  { id: 'PivotPointsHighLow@tv-basicstudies', label: 'Pivot Points',    short: 'PIV' },
]

function loadStudies(): string[] {
  try { return JSON.parse(localStorage.getItem(STUDIES_KEY) || '[]') } catch { return [] }
}
function saveStudies(list: string[]) {
  try { localStorage.setItem(STUDIES_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}
function loadChartMode(): 'simple' | 'advanced' {
  try { return localStorage.getItem(CHART_MODE_KEY) === 'advanced' ? 'advanced' : 'simple' } catch { return 'simple' }
}
function saveChartMode(m: 'simple' | 'advanced') {
  try { localStorage.setItem(CHART_MODE_KEY, m) } catch { /* ignore */ }
}

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
  const { data: rawPair } = useEndpoint<MarketPair>('api.markets.pair', {
    pathParams: { pair: pairStr },
  }, { refetchInterval: 5_000 })

  // USDC price synthesis. Some pairs (XRPUSDC, ADAUSDC, LINKUSDC, etc.)
  // have no native Binance USDC market — they fall back to the matching
  // USDT ticker. To express prices in true USDC terms we divide by the
  // live USDC/USDT rate. Falls back to 1.0 (assume peg) if unavailable.
  const pairCfg = useMemo(() => getPairBySymbol(`${base}${quote}`.toUpperCase()), [base, quote])
  const isUsdcSynth = quote.toUpperCase() === 'USDC' && pairCfg?.binanceSymbol?.endsWith('USDT') === true
  const { data: usdcRateRaw } = useEndpoint<MarketPair>(
    'api.markets.pair',
    { pathParams: { pair: 'USDC/USDT' } },
    { refetchInterval: isUsdcSynth ? 30_000 : false, enabled: isUsdcSynth }
  )
  const usdcRate = (() => {
    const r = parseFloat(usdcRateRaw?.price ?? '1')
    return r > 0 ? r : 1
  })()
  const synth = isUsdcSynth ? 1 / usdcRate : 1

  // ---------------------------------------------------------------------
  // Live market data via WebSocket (api-gateway proxies Binance combined
  // stream). Sub-second updates, replaces what used to be 2-5s polling.
  // The REST `useEndpoint` calls above remain as a warm-start + fallback
  // when WS is briefly down — we just prefer WS data when it's flowing.
  // ---------------------------------------------------------------------
  const wsSymbol = pairCfg?.binanceSymbol ?? null
  const { ticker: wsTicker, book: wsBook, trades: wsTrades } = useBinanceWS(wsSymbol)

  // Prefer WS data when present; fall back to REST shapes that match
  // what the rest of this screen already consumes.
  const book = useMemo(() => {
    if (wsBook) {
      return {
        bids: wsBook.bids.map(([p, a]) => ({ price: p, amount: a })),
        asks: wsBook.asks.map(([p, a]) => ({ price: p, amount: a })),
      }
    }
    return bookRest
  }, [wsBook, bookRest])

  const trades: Trade[] = useMemo(() => {
    if (wsTrades.length > 0) {
      return wsTrades.map(t => ({
        id: String(t.t),
        price: parseFloat(t.p),
        amount: parseFloat(t.q),
        time: t.T,
        isBuyerMaker: t.m,
      }))
    }
    return restTrades
  }, [wsTrades, restTrades])

  const pair: MarketPair | undefined = useMemo(() => {
    // Prefer WS ticker when available — it carries the freshest fields.
    if (wsTicker) {
      const sym = `${base}/${quote}`
      return {
        symbol: sym, base, quote,
        price: (parseFloat(wsTicker.c) * synth).toString(),
        change24h: wsTicker.P,
        volume24h: wsTicker.v,
        high24h: (parseFloat(wsTicker.h) * synth).toString(),
        low24h: (parseFloat(wsTicker.l) * synth).toString(),
      } as MarketPair
    }
    if (!rawPair) return rawPair
    if (synth === 1) return rawPair
    return {
      ...rawPair,
      price: (parseFloat(rawPair.price) * synth).toString(),
      high24h: rawPair.high24h ? (parseFloat(rawPair.high24h) * synth).toString() : rawPair.high24h,
      low24h: rawPair.low24h ? (parseFloat(rawPair.low24h) * synth).toString() : rawPair.low24h,
    }
  }, [wsTicker, rawPair, synth, base, quote])

  // Order book — fetched at limit=100 for the aggregation slider. Used
  // as warm-start while the WS handshake is in flight, and as a fallback
  // when WS is unavailable. Polling slowed from 2s → 10s now that WS
  // pushes book updates every ~100ms.
  const { data: bookRest } = useEndpoint<{ bids: Array<{ price: string; amount: string }>; asks: Array<{ price: string; amount: string }> }>('api.markets.orderbook', {
    pathParams: { pair: pairStr }, query: { limit: 100 },
  }, { refetchInterval: 10_000 })

  // Live trades feed — REST is warm-start only; WS streams individual
  // trades into wsTrades below.
  const { data: tradesRes } = useEndpoint<{ items: Trade[] }>('api.markets.trades', {
    pathParams: { pair: pairStr }, query: { limit: 30 },
  }, { refetchInterval: 30_000 })
  const restTrades = tradesRes?.items ?? []

  // Candles — refetched on interval change
  const [interval, setInterval] = useState<Interval>('15m')
  const { data: candlesRes } = useEndpoint<{ items: Candle[] }>('api.markets.candles', {
    pathParams: { pair: pairStr }, query: { interval },
  }, { refetchInterval: 30_000 })
  const candles = candlesRes?.items ?? []

  // User wallet balances — used for % buttons + reserve check.
  // The mobile balance endpoint returns per-chain entries (each row carries
  // a `network` field). A ChangeNow swap uses ONE chain, so the "available"
  // balance shown to the user must be the MAX single-chain balance, not the
  // cross-chain sum (matches the web app's per-chain logic).
  const { data: balRes } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list', {}, { refetchInterval: 15_000 })
  const balances = (balRes?.items ?? []) as Array<Balance & { network?: string }>
  const balancesByAsset = useMemo(() => {
    const map: Record<string, Array<{ network: string; amount: number }>> = {}
    for (const b of balances) {
      const a = b.asset?.toUpperCase()
      const amt = parseFloat(b.amount || '0') || 0
      if (!a || amt <= 0) continue
      ;(map[a] ||= []).push({ network: b.network || 'eth', amount: amt })
    }
    for (const a of Object.keys(map)) map[a].sort((x, y) => y.amount - x.amount)
    return map
  }, [balances])
  // Best single-chain balance for each side of this pair
  const baseBalance = (balancesByAsset[base.toUpperCase()]?.[0]?.amount ?? 0)
  const quoteBalance = (balancesByAsset[quote.toUpperCase()]?.[0]?.amount ?? 0)
  const baseChainPicked = balancesByAsset[base.toUpperCase()]?.[0]?.network
  const quoteChainPicked = balancesByAsset[quote.toUpperCase()]?.[0]?.network
  const baseSpread = balancesByAsset[base.toUpperCase()] ?? []
  const quoteSpread = balancesByAsset[quote.toUpperCase()] ?? []

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
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop_loss' | 'take_profit' | 'oco'>('limit')
  const [price, setPrice] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')
  // OCO (one-cancels-other) needs two trigger prices.
  const [ocoTakeProfit, setOcoTakeProfit] = useState('')
  const [ocoStopLoss, setOcoStopLoss] = useState('')
  const [amount, setAmount] = useState('')
  const [bottomTab, setBottomTab] = useState<'open' | 'history'>('open')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())
  const [depthAgg, setDepthAgg] = useState<number>(0)

  // Chart mode (persisted): 'simple' = our SVG candles, 'advanced' = TradingView
  // Studies (persisted): TV indicator IDs that apply to ALL pairs the user views.
  const [chartMode, setChartMode] = useState<'simple' | 'advanced'>(() => loadChartMode())
  const [studies, setStudies] = useState<string[]>(() => loadStudies())
  const [studiesOpen, setStudiesOpen] = useState(false)
  const toggleChartMode = () => {
    haptics.selection()
    const next = chartMode === 'simple' ? 'advanced' : 'simple'
    setChartMode(next); saveChartMode(next)
  }
  const toggleStudy = (id: string) => {
    haptics.selection()
    const next = studies.includes(id) ? studies.filter(s => s !== id) : [...studies, id]
    setStudies(next); saveStudies(next)
  }
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
    // Order-type-specific price/trigger validation
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      toast.error('Enter a limit price'); return
    }
    if ((orderType === 'stop_loss' || orderType === 'take_profit') && (!triggerPrice || parseFloat(triggerPrice) <= 0)) {
      toast.error('Enter a trigger price'); return
    }
    if (orderType === 'oco') {
      const tp = parseFloat(ocoTakeProfit), sl = parseFloat(ocoStopLoss)
      if (!tp || tp <= 0 || !sl || sl <= 0) { toast.error('Enter both take-profit and stop-loss prices'); return }
      const cur = parseFloat(pair?.price ?? '0')
      if (cur > 0) {
        if (side === 'sell') {
          if (tp <= cur) { toast.error('Take-profit must be ABOVE current price for a sell OCO'); return }
          if (sl >= cur) { toast.error('Stop-loss must be BELOW current price for a sell OCO'); return }
        } else {
          if (tp >= cur) { toast.error('Take-profit must be BELOW current price for a buy OCO'); return }
          if (sl <= cur) { toast.error('Stop-loss must be ABOVE current price for a buy OCO'); return }
        }
      }
    }
    // Pre-flight: make sure the user has enough for what they typed.
    // SL/TP/OCO reserve at the trigger price (worst-case execution).
    const reservePrice = orderType === 'limit' ? parseFloat(price)
      : (orderType === 'stop_loss' || orderType === 'take_profit') ? parseFloat(triggerPrice)
      : orderType === 'oco' ? Math.max(parseFloat(ocoTakeProfit), parseFloat(ocoStopLoss))
      : parseFloat(pair?.price ?? '0')
    if (side === 'buy') {
      const need = parseFloat(amount) * reservePrice * 1.001
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
      state: {
        pair: pairStr, side, type: orderType, amount,
        price: orderType === 'market' ? (pair?.price ?? price)
             : orderType === 'limit' ? price
             : (orderType === 'stop_loss' || orderType === 'take_profit') ? triggerPrice
             : '',
        triggerPrice: (orderType === 'stop_loss' || orderType === 'take_profit') ? triggerPrice : undefined,
        ocoTakeProfit: orderType === 'oco' ? ocoTakeProfit : undefined,
        ocoStopLoss:   orderType === 'oco' ? ocoStopLoss   : undefined,
      },
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

      {/* Chart — interval row with mode-toggle + studies button on the right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <div className="tabs" style={{ fontSize: 11, flex: 1 }}>
          {INTERVALS.map(i => (
            <button key={i} className={`tab ${interval === i ? 'a' : ''}`} onClick={() => { haptics.selection(); setInterval(i) }}>{i}</button>
          ))}
        </div>
        {chartMode === 'advanced' && (
          <button
            type="button"
            onClick={() => { haptics.selection(); setStudiesOpen(true) }}
            aria-label="Indicators"
            title="Indicators"
            style={{ background: studies.length > 0 ? 'rgba(0,200,83,.12)' : 'var(--surface-soft)', border: '1px solid var(--divider)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ƒₓ {studies.length > 0 && <span className="grn" style={{ fontSize: 10 }}>{studies.length}</span>}
          </button>
        )}
        <button
          type="button"
          onClick={toggleChartMode}
          aria-label={chartMode === 'simple' ? 'Advanced chart' : 'Simple chart'}
          title={chartMode === 'simple' ? 'Open advanced chart' : 'Switch to simple view'}
          style={{ background: chartMode === 'advanced' ? 'rgba(0,200,83,.12)' : 'var(--surface-soft)', border: '1px solid var(--divider)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChartGlyph active={chartMode === 'advanced'} />
        </button>
      </div>

      {chartMode === 'simple'
        ? <CandleChart candles={candles} positive={!!positive} />
        : <TradingViewChart symbol={pairStr} interval={interval} studies={studies} height={360} theme="dark" />
      }

      {studiesOpen && chartMode === 'advanced' && (
        <IndicatorsSheet
          selected={studies}
          onToggle={toggleStudy}
          onClear={() => { setStudies([]); saveStudies([]) }}
          onClose={() => setStudiesOpen(false)}
        />
      )}

      {/* Order book + live trades — side-by-side on phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
            <h3 style={{ fontSize: 13, margin: 0 }}>Order Book</h3>
            <select
              value={depthAgg}
              onChange={(e) => setDepthAgg(parseFloat(e.target.value))}
              aria-label="Aggregation precision"
              style={{
                background: 'var(--surface-soft)', color: 'var(--text-strong)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4,
                fontSize: 10, padding: '1px 4px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <option value={0}>raw</option>
              <option value={0.0001}>0.0001</option>
              <option value={0.001}>0.001</option>
              <option value={0.01}>0.01</option>
              <option value={0.1}>0.1</option>
              <option value={1}>1</option>
              <option value={10}>10</option>
              <option value={100}>100</option>
            </select>
          </div>
          <DepthBook book={book} aggregation={depthAgg} rows={14} />
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
      <div className="tabs" style={{ fontSize: 11, flexWrap: 'wrap' }}>
        {(['limit', 'market', 'stop_loss', 'take_profit', 'oco'] as const).map(t => {
          const labels: Record<typeof t, string> = {
            limit: 'Limit',
            market: 'Market',
            stop_loss: 'Stop',
            take_profit: 'Take',
            oco: 'OCO',
          }
          return (
          <button key={t} className={`tab ${orderType === t ? 'a' : ''}`} onClick={() => {
            haptics.selection()
            setOrderType(t)
            // Seed the relevant price input with current market price
            if ((t === 'stop_loss' || t === 'take_profit') && pair?.price) {
              setTriggerPrice(String(pair.price))
            }
            if (t === 'oco' && pair?.price) {
              const p = parseFloat(pair.price)
              setOcoTakeProfit((side === 'sell' ? p * 1.05 : p * 0.95).toString())
              setOcoStopLoss((side === 'sell' ? p * 0.95 : p * 1.05).toString())
            }
          }}>
            {labels[t]}
          </button>
          )
        })}
      </div>

      {/* Trigger price input — only for stop_loss / take_profit */}
      {(orderType === 'stop_loss' || orderType === 'take_profit') && (
        <div style={{ margin: '6px 0 4px' }}>
          <div className="t3" style={{ marginBottom: 2 }}>Trigger price ({quote})</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input
              type="number" inputMode="decimal" placeholder={pair?.price ?? '0'}
              value={triggerPrice} onChange={e => setTriggerPrice(e.target.value)}
              style={{ flex: 1 }} step="any"
            />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{quote}</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-mid-40)', marginTop: 2 }}>
            {orderType === 'stop_loss'
              ? (side === 'buy'
                  ? `Fires when price ≥ ${triggerPrice || '—'} (breakout buy)`
                  : `Fires when price ≤ ${triggerPrice || '—'} (cut losses)`)
              : (side === 'buy'
                  ? `Fires when price ≤ ${triggerPrice || '—'} (buy on dip)`
                  : `Fires when price ≥ ${triggerPrice || '—'} (lock gains)`)}
          </div>
        </div>
      )}

      {/* OCO dual-trigger inputs */}
      {orderType === 'oco' && (
        <div style={{ margin: '6px 0 4px' }}>
          <div className="t3" style={{ marginBottom: 2 }}>Take-profit ({quote})</div>
          <div className="inp" style={{ padding: 6, fontSize: 13, marginBottom: 6 }}>
            <input
              type="number" inputMode="decimal" placeholder="0.00"
              value={ocoTakeProfit} onChange={e => setOcoTakeProfit(e.target.value)}
              style={{ flex: 1 }} step="any"
            />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{quote}</span>
          </div>
          <div className="t3" style={{ marginBottom: 2 }}>Stop-loss ({quote})</div>
          <div className="inp" style={{ padding: 6, fontSize: 13 }}>
            <input
              type="number" inputMode="decimal" placeholder="0.00"
              value={ocoStopLoss} onChange={e => setOcoStopLoss(e.target.value)}
              style={{ flex: 1 }} step="any"
            />
            <span style={{ marginLeft: 'auto', color: 'var(--text-mid-40)' }}>{quote}</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-mid-40)', marginTop: 2 }}>
            {side === 'sell'
              ? 'Whichever fires first auto-cancels the other.'
              : 'Whichever fires first auto-cancels the other.'}
          </div>
        </div>
      )}

      {/* Available balance display — shows the chain that will actually
          be used by the ChangeNow swap (best single-chain balance), not
          the cross-chain sum. Tooltip on hover/tap reveals the breakdown. */}
      {(() => {
        const isBuy = side === 'buy'
        const bal = isBuy ? quoteBalance : baseBalance
        const chainTag = (isBuy ? quoteChainPicked : baseChainPicked) || ''
        const spread = isBuy ? quoteSpread : baseSpread
        const usd = isBuy ? bal : bal * (parseFloat(pair?.price ?? '0') || 0)
        return (
          <div style={{ margin: '4px 2px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid-40)' }}>
              <span>
                Avail: <span style={{ color: 'var(--text-strong)' }}>{bal.toFixed(6)}</span> {isBuy ? quote : base}
                {chainTag && (
                  <span style={{ marginLeft: 4, fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(0,200,83,.12)', color: 'var(--gl)' }}>
                    {chainTag.toUpperCase()}
                  </span>
                )}
              </span>
              <span>≈ ${usd.toFixed(2)}</span>
            </div>
            {spread.length > 1 && (
              <div className="t3" style={{ fontSize: 9, marginTop: 2 }}>
                Across chains: {spread.slice(0, 4).map(s => `${s.amount.toFixed(4)}@${s.network}`).join(' · ')}
              </div>
            )}
          </div>
        )
      })()}

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

      {/* Pre-trade summary — fee + slippage transparent for market orders.
          Mirrors the breakdown shown on the web exchange. */}
      {orderType === 'market' && parseFloat(amount) > 0 && pair?.price && (() => {
        const px = parseFloat(pair.price)
        const amt = parseFloat(amount)
        const slippagePct = 2 // matches backend buffer in spot-trading-service
        const feePct = 1 // ChangeNow ~0.5-1% spread; conservative estimate for display
        const youPay = side === 'buy' ? amt * px : amt
        const grossReceive = side === 'buy' ? amt : amt * px
        const youReceive = grossReceive * (1 - feePct / 100)
        const labelStyle = { color: 'var(--text-mid-50)' }
        const valStyle = { color: 'var(--text-strong)', fontFamily: "'JetBrains Mono', monospace" }
        return (
          <div style={{
            margin: '6px 2px', padding: '8px 10px',
            background: 'var(--surface-soft)', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.04)',
            fontSize: 11, lineHeight: 1.5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={labelStyle}>You pay</span>
              <span style={valStyle}>{youPay.toFixed(6)} {side === 'buy' ? quote : base}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={labelStyle}>Provider fee (ChangeNow)</span>
              <span style={valStyle}>~{(grossReceive - youReceive).toFixed(6)} {side === 'buy' ? base : quote}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={labelStyle}>Slippage buffer</span>
              <span style={valStyle}>{slippagePct}%</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 4, marginTop: 4,
              borderTop: '1px dashed rgba(255,255,255,0.1)',
              fontWeight: 600,
            }}>
              <span style={{ color: 'var(--text-strong)' }}>You receive (est.)</span>
              <span style={{ ...valStyle, color: 'var(--gl)' }}>~{youReceive.toFixed(6)} {side === 'buy' ? base : quote}</span>
            </div>
          </div>
        )
      })()}

      {/* Total preview (limit / SL / TP / OCO) */}
      {orderType !== 'market' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid-40)', margin: '6px 2px' }}>
          <span>Total</span>
          <span style={{ color: 'var(--text-strong)' }}>
            {(parseFloat(
              orderType === 'limit' ? (price || '0')
              : (orderType === 'stop_loss' || orderType === 'take_profit') ? (triggerPrice || '0')
              : orderType === 'oco' ? (ocoTakeProfit || '0')
              : (pair?.price ?? '0')
            ) * parseFloat(amount || '0')).toFixed(2)} {quote}
          </span>
        </div>
      )}

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

// Bucket prices into the requested grid. Asks round UP, bids round DOWN
// so the displayed spread can never collapse below real liquidity.
function aggregateLevels(
  levels: Array<{ price: string; amount: string }>,
  bucket: number,
  side: 'ask' | 'bid'
): Array<{ price: string; amount: string }> {
  if (!bucket || bucket <= 0) return levels
  const map = new Map<number, number>()
  for (const lvl of levels) {
    const p = parseFloat(lvl.price)
    const a = parseFloat(lvl.amount)
    if (!Number.isFinite(p) || !Number.isFinite(a)) continue
    const b = side === 'ask' ? Math.ceil(p / bucket) * bucket : Math.floor(p / bucket) * bucket
    map.set(b, (map.get(b) || 0) + a)
  }
  const sorted = Array.from(map.entries()).sort((a, b) => side === 'ask' ? a[0] - b[0] : b[0] - a[0])
  return sorted.map(([price, amount]) => ({
    price: price.toString(),
    amount: amount.toString(),
  }))
}

function DepthBook({
  book,
  aggregation = 0,
  rows = 14,
}: {
  book?: { bids: Array<{ price: string; amount: string }>; asks: Array<{ price: string; amount: string }> }
  aggregation?: number
  rows?: number
}) {
  const rawBids = book?.bids ?? []
  const rawAsks = book?.asks ?? []
  const bids = aggregation > 0 ? aggregateLevels(rawBids, aggregation, 'bid').slice(0, rows) : rawBids.slice(0, rows)
  const asks = aggregation > 0
    ? aggregateLevels(rawAsks, aggregation, 'ask').slice(0, rows).reverse()
    : rawAsks.slice(0, rows).reverse()
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
// Chart-mode toggle glyph + indicators sheet
// ─────────────────────────────────────────────────────────────────────────────

function ChartGlyph({ active }: { active: boolean }) {
  const c = active ? 'var(--gl)' : 'var(--text-mid-50)'
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M2 12V8h2v4H2zm3 0V4h2v8H5zm3 0V6h2v6H8zm3 0V2h2v10h-2z" fill={c} />
    </svg>
  )
}

function IndicatorsSheet({ selected, onToggle, onClear, onClose }: {
  selected: string[]
  onToggle: (id: string) => void
  onClear: () => void
  onClose: () => void
}) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  return (
    <div
      role="dialog" aria-modal="true" data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh',
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
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>Indicators</h3>
            <div className="t3" style={{ marginTop: 2 }}>Persists across all your charts. Tap to toggle.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 0' }}>
          {INDICATORS.map(ind => {
            const on = selected.includes(ind.id)
            return (
              <button
                key={ind.id}
                onClick={() => onToggle(ind.id)}
                style={{
                  background: on ? 'var(--gl)' : 'var(--surface-soft)',
                  color: on ? '#fff' : 'var(--text-strong)',
                  border: '1px solid ' + (on ? 'var(--gl)' : 'var(--divider)'),
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={ind.label}
              >
                {on && <span style={{ fontSize: 10 }}>✓</span>} {ind.short}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--divider-soft)' }}>
          <button
            onClick={onClear}
            disabled={selected.length === 0}
            className="btn btn-o"
            style={{ flex: 1, padding: 10, margin: 0, fontSize: 13, opacity: selected.length === 0 ? 0.5 : 1 }}
          >
            Clear all
          </button>
          <button onClick={onClose} className="btn btn-g" style={{ flex: 2, padding: 10, margin: 0, fontSize: 13 }}>
            Apply{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
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
