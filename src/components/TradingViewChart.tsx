/**
 * TradingView "Advanced Chart" embed.
 *
 * Loads tv.js once globally (cached), then mounts the widget into our div.
 * Initial studies (indicators) come from localStorage so the user's chosen
 * presets persist across pair switches and across page reloads.
 *
 * The free embedded widget does NOT auto-save user-added studies. Our own
 * indicator chip bar (mounted by the parent) is the source of truth — when
 * the user toggles a chip on/off, we save the new list to localStorage and
 * re-mount the widget with the updated `studies` array.
 */
import { useEffect, useRef } from 'react'

const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js'

declare global {
  interface Window { TradingView?: any }
}

let tvScriptLoading: Promise<void> | null = null
function loadTvScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.TradingView) return Promise.resolve()
  if (tvScriptLoading) return tvScriptLoading
  tvScriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TV_SCRIPT_SRC}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('TradingView script failed')))
      return
    }
    const s = document.createElement('script')
    s.src = TV_SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('TradingView script failed'))
    document.head.appendChild(s)
  })
  return tvScriptLoading
}

/** Map our internal interval ids ("15m", "1h", "1d") to TradingView interval format. */
export function toTvInterval(i: string): string {
  const map: Record<string, string> = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240', '6h': '360', '12h': '720',
    '1d': 'D', '1w': 'W', '1M': 'M',
  }
  return map[i] ?? '15'
}

interface Props {
  /** Either "BTCUSDT" or "BTC/USDT" — we normalize to BINANCE:BTCUSDT internally. */
  symbol: string
  /** App-internal interval id like "15m". */
  interval: string
  /** TradingView study IDs (e.g. "MACD@tv-basicstudies"). */
  studies?: string[]
  /** Pixel height of the chart. Defaults to 360. */
  height?: number
  /** Light or dark theme — pass 'dark' for our app. */
  theme?: 'dark' | 'light'
}

export function TradingViewChart({ symbol, interval, studies = [], height = 360, theme = 'dark' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  // Stable container id — must change between mounts so TV doesn't reuse a
  // dead container DOM node from a previous re-render of the same screen.
  const idRef = useRef<string>('tv-chart-' + Math.random().toString(36).slice(2, 10))

  useEffect(() => {
    let cancelled = false
    const id = idRef.current
    loadTvScript().then(() => {
      if (cancelled || !ref.current || !window.TradingView?.widget) return
      // Reset container — TV constructs its iframe inside this div using its id.
      ref.current.innerHTML = ''
      ref.current.id = id

      const tvSymbol = symbol.includes(':') ? symbol : `BINANCE:${symbol.replace('/', '').toUpperCase()}`
      try {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: toTvInterval(interval),
          timezone: 'Etc/UTC',
          theme,
          style: '1',                  // candles
          locale: 'en',
          toolbar_bg: 'rgba(0,0,0,0)',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          studies,
          save_image: false,
          backgroundColor: 'rgba(0,0,0,0)',
          gridColor: 'rgba(255,255,255,0.05)',
          container_id: id,
        })
      } catch (e) {
        console.warn('[tv] init failed', e)
      }
    }).catch(e => console.warn('[tv] script load failed', e))

    return () => {
      cancelled = true
      try { widgetRef.current?.remove?.() } catch { /* noop */ }
      widgetRef.current = null
    }
    // Re-mount on any input change. JSON.stringify ensures studies array
    // changes are observed (referential equality wouldn't catch chip toggles).
  }, [symbol, interval, JSON.stringify(studies), theme])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface-soft)',
      }}
    />
  )
}
