/**
 * Live market data via the api-gateway's Binance WS proxy.
 *
 * Endpoint: wss://backend.crymadx.io/ws/binance
 * Protocol:
 *   client → server: {action:"subscribe",   symbol:"BTCUSDT"}
 *   client → server: {action:"unsubscribe", symbol:"BTCUSDT"}
 *   server → client: {type:"ticker", symbol, data: <Binance @ticker payload>}
 *   server → client: {type:"depth",  symbol, data: {bids:[[p,q]…], asks:[[p,q]…]}}
 *   server → client: {type:"trade",  symbol, data: <Binance @trade payload>}
 *
 * Replaces the 2-5 second REST polling on SpotTrading. One upstream
 * Binance connection per symbol (the gateway fans out to N clients), so
 * even a noisy mobile audience won't cause a Binance IP ban.
 *
 * Reconnects with exponential backoff (max 5 attempts, then gives up).
 * Components can keep their REST useEndpoint as a fallback — the WS
 * data simply takes over when it arrives.
 */
import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')

export interface WsTicker {
  /** lastPrice */ c: string
  /** priceChangePercent */ P: string
  /** highPrice */ h: string
  /** lowPrice */ l: string
  /** baseVolume */ v: string
  /** quoteVolume */ q: string
}

export interface WsBook {
  bids: Array<[string, string]>
  asks: Array<[string, string]>
}

export interface WsTrade {
  /** trade id */ t: number
  /** price */ p: string
  /** quantity */ q: string
  /** trade time (ms) */ T: number
  /** isBuyerMaker */ m: boolean
}

export interface UseBinanceWSResult {
  ticker: WsTicker | null
  book: WsBook | null
  trades: WsTrade[]
  connected: boolean
}

/**
 * Subscribe to ticker / depth / trade frames for a Binance symbol.
 * Pass `null` to disable (e.g., when no pair is selected yet).
 */
export function useBinanceWS(symbol: string | null): UseBinanceWSResult {
  const [ticker, setTicker] = useState<WsTicker | null>(null)
  const [book, setBook] = useState<WsBook | null>(null)
  const [trades, setTrades] = useState<WsTrade[]>([])
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const aliveRef = useRef(true)
  const attemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!symbol) return
    aliveRef.current = true
    attemptRef.current = 0
    setTicker(null); setBook(null); setTrades([])

    // Build WS URL — protocol matches host
    const baseHost = (() => {
      try { return new URL(API_BASE_URL).host } catch { return 'backend.crymadx.io' }
    })()
    const proto = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss' : 'ws'
    const wsUrl = `${proto}://${baseHost}/ws/binance`

    const connect = () => {
      if (!aliveRef.current) return
      let sock: WebSocket
      try { sock = new WebSocket(wsUrl) } catch { return }
      wsRef.current = sock

      sock.onopen = () => {
        if (!aliveRef.current) return
        attemptRef.current = 0
        setConnected(true)
        try { sock.send(JSON.stringify({ action: 'subscribe', symbol })) } catch { /* */ }
      }

      sock.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data)
          if (!m || m.symbol !== symbol) return
          if (m.type === 'ticker') setTicker(m.data as WsTicker)
          else if (m.type === 'depth') setBook(m.data as WsBook)
          else if (m.type === 'trade') {
            setTrades(prev => [m.data as WsTrade, ...prev].slice(0, 30))
          }
        } catch { /* ignore */ }
      }

      sock.onerror = () => { /* close handler will retry */ }
      sock.onclose = () => {
        setConnected(false)
        if (!aliveRef.current) return
        const attempt = attemptRef.current++
        if (attempt >= 5) return // give up; caller's REST poll keeps things alive
        const delay = Math.min(30_000, 1000 * Math.pow(2, attempt))
        reconnectTimerRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      aliveRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      try { wsRef.current?.close() } catch { /* */ }
    }
  }, [symbol])

  return { ticker, book, trades, connected }
}
