/**
 * Advanced trading chart powered by `lightweight-charts` (TradingView's free
 * OSS charting library — NOT the embedded iframe widget). The iframe widget
 * makes a "sheriff" check against widget-sheriff.tradingview-widget.com on
 * load, which fails in geos where TradingView is blocked. The OSS library
 * has no external network calls — it's just a renderer. We feed it the same
 * Binance candles we already proxy through our backend.
 *
 * Indicators are computed locally in src/lib/indicators.ts and rendered as
 * additional series (overlays for trend indicators, pinned price scales for
 * oscillators).
 */
import { useEffect, useRef } from 'react'
import {
  createChart, CandlestickSeries, LineSeries, HistogramSeries,
  type IChartApi, type ISeriesApi, type Time,
} from 'lightweight-charts'
import { useEndpoint } from '../api/hooks'
import {
  type Bar, sma, ema, bb, rsi, macd, stochastic, atr, cci, obv, vwap,
  awesomeOscillator, ichimoku, pivotPoints,
} from '../lib/indicators'

interface RawCandle { t: number; o: number; h: number; l: number; c: number; v?: number }

interface Props {
  /** "BTC/USDT" or "BTCUSDT" — used for the pair query. */
  symbol: string
  /** Internal interval id like "15m", "1h", "1d". */
  interval: string
  /** Active TradingView-style study IDs (we map them to local indicators). */
  studies?: string[]
  height?: number
  theme?: 'dark' | 'light'
}

export function TradingViewChart({ symbol, interval, studies = [], height = 360, theme = 'dark' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const overlaySeriesRef = useRef<ISeriesApi<any>[]>([])

  // Raw candles — lightweight-charts wants `time` in seconds, not ms
  const { data: candleRes } = useEndpoint<{ items: RawCandle[] }>('api.markets.candles', {
    pathParams: { pair: symbol }, query: { interval },
  }, { refetchInterval: 30_000 })
  const rawCandles = candleRes?.items ?? []

  // Convert to lightweight-charts shape
  const bars: Bar[] = rawCandles.map(c => ({
    time: Math.floor(c.t / 1000),
    open: c.o, high: c.h, low: c.l, close: c.c,
    volume: c.v ?? 0,
  }))

  // ── Initial chart construction ─────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const isDark = theme === 'dark'

    // Guard against 0-width on first render (React 19 strict-mode + flex
    // parent + lazy mount): fall back to a sensible width so the chart
    // doesn't render invisible. ResizeObserver below catches up once the
    // real layout finishes.
    const initialWidth = Math.max(el.clientWidth, 320)

    let chart: IChartApi
    try {
      chart = createChart(el, {
        width: initialWidth,
        height,
        autoSize: true,
        layout: {
          background: { color: 'transparent' },
          textColor: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)',
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' },
          horzLines: { color: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' },
        },
        timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
        rightPriceScale: { borderVisible: false },
        crosshair: { mode: 1 },
      })
    } catch (e) {
      console.error('[chart] createChart failed', e)
      return
    }
    chartRef.current = chart

    let candleSeries: ISeriesApi<'Candlestick'>
    try {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00C853', downColor: '#EF4444',
        wickUpColor: '#00C853', wickDownColor: '#EF4444',
        borderVisible: false,
      })
    } catch (e) {
      console.error('[chart] addSeries(Candlestick) failed', e)
      try { chart.remove() } catch { /* noop */ }
      return
    }
    candleSeriesRef.current = candleSeries

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        const w = containerRef.current.clientWidth
        if (w > 0) chartRef.current.applyOptions({ width: w })
      }
    })
    ro.observe(el)

    // Belt-and-suspenders: schedule a manual resize on next frame in case
    // the parent layout finishes after our useEffect.
    const raf = requestAnimationFrame(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth || initialWidth })
        chartRef.current.timeScale().fitContent()
      }
    })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      try { chart.remove() } catch { /* noop */ }
      chartRef.current = null
      candleSeriesRef.current = null
      overlaySeriesRef.current = []
    }
  }, [theme, height])

  // ── Update candles when bars change ────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || bars.length === 0) return
    candleSeriesRef.current.setData(bars.map(b => ({
      time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close,
    })))
  }, [bars.length, bars[0]?.time, bars[bars.length - 1]?.time])

  // ── Apply / re-apply indicators when studies or bars change ────────────
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || bars.length === 0) return

    // Tear down previous overlay series
    for (const s of overlaySeriesRef.current) {
      try { chart.removeSeries(s) } catch { /* noop */ }
    }
    overlaySeriesRef.current = []

    const add = (s: ISeriesApi<any>) => { overlaySeriesRef.current.push(s) }

    for (const studyId of studies) {
      const id = studyId.split('@')[0] // strip the @tv-basicstudies suffix

      if (id === 'MASimple') {
        const data = sma(bars, 20).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#FFA726', lineWidth: 2, title: 'SMA(20)', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
      }
      else if (id === 'MAExp') {
        const data = ema(bars, 21).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#42A5F5', lineWidth: 2, title: 'EMA(21)', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
      }
      else if (id === 'BB') {
        const data = bb(bars, 20, 2)
        const upper = chart.addSeries(LineSeries, { color: 'rgba(187,134,252,.7)', lineWidth: 1, title: 'BB upper', priceLineVisible: false, lastValueVisible: false })
        upper.setData(data.map(p => ({ time: p.time as Time, value: p.upper }))); add(upper)
        const mid = chart.addSeries(LineSeries, { color: 'rgba(187,134,252,.4)', lineWidth: 1, lineStyle: 2, title: 'BB mid', priceLineVisible: false, lastValueVisible: false })
        mid.setData(data.map(p => ({ time: p.time as Time, value: p.mid }))); add(mid)
        const lower = chart.addSeries(LineSeries, { color: 'rgba(187,134,252,.7)', lineWidth: 1, title: 'BB lower', priceLineVisible: false, lastValueVisible: false })
        lower.setData(data.map(p => ({ time: p.time as Time, value: p.lower }))); add(lower)
      }
      else if (id === 'RSI') {
        const data = rsi(bars, 14).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#FFD54F', lineWidth: 2, title: 'RSI(14)', priceScaleId: 'rsi', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
        chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'MACD') {
        const data = macd(bars, 12, 26, 9)
        const macdLine = chart.addSeries(LineSeries, { color: '#42A5F5', lineWidth: 2, title: 'MACD', priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false })
        macdLine.setData(data.map(p => ({ time: p.time as Time, value: p.macd }))); add(macdLine)
        const sig = chart.addSeries(LineSeries, { color: '#FFA726', lineWidth: 2, title: 'Signal', priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false })
        sig.setData(data.map(p => ({ time: p.time as Time, value: p.signal }))); add(sig)
        const hist = chart.addSeries(HistogramSeries, { color: '#666', priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false })
        hist.setData(data.map(p => ({ time: p.time as Time, value: p.hist, color: p.hist >= 0 ? 'rgba(0,200,83,.7)' : 'rgba(239,68,68,.7)' }))); add(hist)
        chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'Stochastic') {
        const data = stochastic(bars, 14, 3)
        const k = chart.addSeries(LineSeries, { color: '#42A5F5', lineWidth: 1, title: '%K', priceScaleId: 'stoch', priceLineVisible: false, lastValueVisible: false })
        k.setData(data.map(p => ({ time: p.time as Time, value: p.k }))); add(k)
        const d = chart.addSeries(LineSeries, { color: '#FFA726', lineWidth: 1, title: '%D', priceScaleId: 'stoch', priceLineVisible: false, lastValueVisible: false })
        d.setData(data.map(p => ({ time: p.time as Time, value: p.d }))); add(d)
        chart.priceScale('stoch').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'Volume') {
        const data = bars.map(b => ({
          time: b.time as Time,
          value: b.volume,
          color: b.close >= b.open ? 'rgba(0,200,83,.5)' : 'rgba(239,68,68,.5)',
        }))
        const s = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol', priceLineVisible: false, lastValueVisible: false, title: 'Volume' })
        s.setData(data); add(s)
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'ATR') {
        const data = atr(bars, 14).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#9CCC65', lineWidth: 1, title: 'ATR(14)', priceScaleId: 'atr', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
        chart.priceScale('atr').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      }
      else if (id === 'CCI') {
        const data = cci(bars, 20).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#26A69A', lineWidth: 1, title: 'CCI(20)', priceScaleId: 'cci', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
        chart.priceScale('cci').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'OBV') {
        const data = obv(bars).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#80DEEA', lineWidth: 1, title: 'OBV', priceScaleId: 'obv', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
        chart.priceScale('obv').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      }
      else if (id === 'VWAP') {
        const data = vwap(bars).map(p => ({ time: p.time as Time, value: p.value }))
        const s = chart.addSeries(LineSeries, { color: '#FFEE58', lineWidth: 2, title: 'VWAP', priceLineVisible: false, lastValueVisible: false })
        s.setData(data); add(s)
      }
      else if (id === 'AwesomeOscillator') {
        const data = awesomeOscillator(bars)
        const s = chart.addSeries(HistogramSeries, { priceScaleId: 'ao', priceLineVisible: false, lastValueVisible: false, title: 'AO' })
        s.setData(data.map(p => ({ time: p.time as Time, value: p.value, color: p.value >= 0 ? 'rgba(0,200,83,.7)' : 'rgba(239,68,68,.7)' }))); add(s)
        chart.priceScale('ao').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      }
      else if (id === 'IchimokuCloud') {
        const data = ichimoku(bars)
        const tenkan = chart.addSeries(LineSeries, { color: '#42A5F5', lineWidth: 1, title: 'Tenkan', priceLineVisible: false, lastValueVisible: false })
        tenkan.setData(data.filter(p => p.tenkan !== undefined).map(p => ({ time: p.time as Time, value: p.tenkan! }))); add(tenkan)
        const kijun = chart.addSeries(LineSeries, { color: '#EF4444', lineWidth: 1, title: 'Kijun', priceLineVisible: false, lastValueVisible: false })
        kijun.setData(data.filter(p => p.kijun !== undefined).map(p => ({ time: p.time as Time, value: p.kijun! }))); add(kijun)
        const a = chart.addSeries(LineSeries, { color: 'rgba(0,200,83,.5)', lineWidth: 1, title: 'Senkou A', priceLineVisible: false, lastValueVisible: false })
        a.setData(data.filter(p => p.senkouA !== undefined).map(p => ({ time: p.time as Time, value: p.senkouA! }))); add(a)
        const b = chart.addSeries(LineSeries, { color: 'rgba(239,68,68,.5)', lineWidth: 1, title: 'Senkou B', priceLineVisible: false, lastValueVisible: false })
        b.setData(data.filter(p => p.senkouB !== undefined).map(p => ({ time: p.time as Time, value: p.senkouB! }))); add(b)
      }
      else if (id === 'PivotPointsHighLow') {
        const data = pivotPoints(bars)
        const p = chart.addSeries(LineSeries, { color: '#FFEB3B', lineWidth: 1, lineStyle: 2, title: 'P', priceLineVisible: false, lastValueVisible: false })
        p.setData(data.map(d => ({ time: d.time as Time, value: d.p }))); add(p)
        const r1 = chart.addSeries(LineSeries, { color: 'rgba(0,200,83,.6)', lineWidth: 1, lineStyle: 2, title: 'R1', priceLineVisible: false, lastValueVisible: false })
        r1.setData(data.map(d => ({ time: d.time as Time, value: d.r1 }))); add(r1)
        const s1 = chart.addSeries(LineSeries, { color: 'rgba(239,68,68,.6)', lineWidth: 1, lineStyle: 2, title: 'S1', priceLineVisible: false, lastValueVisible: false })
        s1.setData(data.map(d => ({ time: d.time as Time, value: d.s1 }))); add(s1)
      }
    }
  }, [JSON.stringify(studies), bars.length, bars[bars.length - 1]?.time])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface-soft)',
        width: '100%',
        height,
        minHeight: height,    // hard-locks height; flex parents can't squish it
        marginTop: 4,
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      {bars.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid-30)', fontSize: 12, pointerEvents: 'none' }}>
          Loading chart…
        </div>
      )}
    </div>
  )
}
