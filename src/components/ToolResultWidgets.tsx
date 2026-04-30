/**
 * ToolResultWidgets — structured renderers for AI tool results.
 *
 * Mirrors src/screens/ai-chat/components/ToolResultWidgets.tsx from the
 * production website, restyled compact for the Bold Waves mobile theme.
 *
 * Each entry in toolName → component handles a specific tool emitted
 * by ai-gateway. When the AI calls e.g. get_deposit_address, the SSE
 * stream emits:
 *   event: tool_result
 *   data: { id, name: 'get_deposit_address', result: { chain, address, ... } }
 * AIChat.tsx attaches the result to the current assistant message and we
 * render the matching widget here.
 */
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Icon } from './Icon'
import { CoinIcon } from './CoinIcon'
import { fmt } from '../lib/format'
import { getToken } from '../api/client'

// ─── Chart fetcher (mirrors src/services/aiChatService.fetchChart) ───
type ChartPoint = { t: number; p: number }
type ChartResponse = { symbol: string; days: number; series: ChartPoint[] }

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')
const CHAT_BASE = `${API_BASE_URL.replace(/\/api$/, '')}/api/ai/web`

async function fetchChart(symbol: string, days: number): Promise<ChartResponse> {
  const token = getToken()
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${CHAT_BASE}/chart/${encodeURIComponent(symbol)}?days=${days}`, { headers })
  if (!res.ok) throw new Error(`Chart HTTP ${res.status}`)
  return (await res.json()) as ChartResponse
}

export type ToolResult = {
  id: string
  name: string
  result: any
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 12,
  margin: '6px 0',
}

const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-mid-50, rgba(255,255,255,0.5))',
  marginBottom: 8,
}

export function ToolResultWidget({ tool }: { tool: ToolResult }) {
  if (!tool || !tool.result || typeof tool.result !== 'object') return null
  const r = tool.result
  if (r.error) return <ErrorPill message={String(r.error)} />

  switch (tool.name) {
    case 'get_deposit_address': return <DepositAddressWidget data={r} />
    case 'get_balance':         return <BalanceWidget data={r} />
    case 'get_all_balances':    return <AllBalancesWidget data={r} />
    case 'get_portfolio':       return <PortfolioWidget data={r} />
    case 'get_price':           return <PriceWidget data={r} />
    default:                    return null
  }
}

function ErrorPill({ message }: { message: string }) {
  return (
    <div style={{ ...CARD, borderLeft: '3px solid var(--r, #ef4444)', color: 'var(--r, #ef4444)' }}>
      ⚠ {message}
    </div>
  )
}

// ───────── get_deposit_address ─────────
function DepositAddressWidget({ data }: { data: any }) {
  const [copied, setCopied] = useState(false)
  const addr = String(data.address || '')
  const chain = String(data.chain || data.network || '').toUpperCase()
  const memo = data.memo
  const tag = data.tag
  const qrPayload = memo ? `${addr}?memo=${memo}` : tag ? `${addr}?dt=${tag}` : addr
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }
  if (!addr) return null
  return (
    <div style={CARD}>
      <div style={KICKER}>{chain || 'CRYPTO'} deposit address</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <div style={{ background: '#fff', padding: 10, borderRadius: 10 }}>
          <QRCodeSVG value={qrPayload} size={150} level="M" />
        </div>
      </div>
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          wordBreak: 'break-all',
          padding: 8,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          marginBottom: 8,
          color: 'var(--text-strong, #fff)',
        }}
      >
        {addr}
      </div>
      {(memo || tag) && (
        <div style={{ marginBottom: 8, padding: 8, borderLeft: '3px solid var(--gd, #d4a53c)', background: 'rgba(212,165,60,.08)', borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gd, #d4a53c)' }}>
            {memo ? 'MEMO required' : 'DESTINATION TAG required'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-strong, #fff)', marginTop: 2 }}>{memo ?? tag}</div>
        </div>
      )}
      <button
        onClick={copy}
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 8,
          background: 'rgba(0,200,83,0.12)',
          border: '1px solid rgba(0,200,83,0.3)',
          color: 'var(--gl, #00C853)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={12} color="var(--gl)" />
        {copied ? 'Copied' : 'Copy address'}
      </button>
    </div>
  )
}

// ───────── get_balance ─────────
function BalanceWidget({ data }: { data: any }) {
  const symbol = String(data.symbol ?? data.token ?? data.asset ?? '').toUpperCase()
  const amount = String(data.balance ?? data.amount ?? '0')
  const usd = data.usdValue ?? data.value_usd ?? data.usd
  return (
    <div style={CARD}>
      <div style={KICKER}>Balance</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoinIcon symbol={symbol} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong, #fff)' }}>
            {fmt(amount, { grouping: false })} {symbol}
          </div>
          {usd != null && (
            <div style={{ fontSize: 14, color: 'var(--text-mid-50, rgba(255,255,255,0.6))' }}>
              ≈ ${fmt(usd)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ───────── get_all_balances / get_portfolio (with allocation bars) ─────────
const ASSET_TINTS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', USDC: '#2775CA',
  SOL: '#9945FF', BNB: '#F3BA2F', XRP: '#23292F', ADA: '#0033AD',
  DOGE: '#C2A633', DOT: '#E6007A', MATIC: '#8247E5', AVAX: '#E84142',
  LINK: '#2A5ADA', LTC: '#345D9D', TRX: '#EF0027', ATOM: '#2E3148',
  TIA: '#7B2BF9', SUI: '#4DA2FF', NEAR: '#00C08B', BCH: '#8DC351',
}

function PortfolioWidget({ data }: { data: any }) {
  const totalNum = parseFloat(String(data.total ?? data.total_usd ?? data.totalUsd ?? '0')) || 0
  const items = (data.balances ?? data.assets ?? data.holdings ?? data.items ?? []) as any[]
  if (!Array.isArray(items)) return null
  const rows = items
    .map(it => ({
      symbol: String(it.symbol ?? it.token ?? it.asset ?? '').toUpperCase(),
      chain: String(it.chain ?? it.network ?? ''),
      amount: String(it.balance ?? it.amount ?? '0'),
      usd: parseFloat(String(it.usdValue ?? it.value_usd ?? it.usd ?? '0')) || 0,
    }))
    .filter(r => r.symbol && (r.usd > 0 || parseFloat(r.amount) > 0))
    .sort((a, b) => b.usd - a.usd)
  if (rows.length === 0) return null

  const sumUsd = rows.reduce((s, r) => s + r.usd, 0)
  const total = totalNum > 0 ? totalNum : sumUsd
  const denom = total > 0 ? total : 1

  return (
    <div style={CARD}>
      <div style={KICKER}>Portfolio · {rows.length} {rows.length === 1 ? 'asset' : 'assets'}</div>
      {total > 0 && (
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-strong, #fff)', marginBottom: 4, letterSpacing: '-0.01em' }}>
          ${fmt(total)}
        </div>
      )}

      {/* Stacked allocation bar */}
      {sumUsd > 0 && (
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', margin: '6px 0 10px', background: 'rgba(255,255,255,0.04)' }}>
          {rows.slice(0, 8).map((r, i) => {
            const pct = (r.usd / denom) * 100
            if (pct < 0.5) return null
            return (
              <div
                key={i}
                title={`${r.symbol} · ${pct.toFixed(1)}%`}
                style={{ width: `${pct}%`, background: ASSET_TINTS[r.symbol] ?? `hsl(${(i * 47) % 360},70%,55%)` }}
              />
            )
          })}
        </div>
      )}

      {/* Holdings list with per-row USD bar */}
      {rows.map((r, i) => {
        const pct = total > 0 ? (r.usd / denom) * 100 : 0
        const tint = ASSET_TINTS[r.symbol] ?? '#1B8C3E'
        return (
          <div key={i} style={{ padding: '8px 0', borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CoinIcon symbol={r.symbol} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong, #fff)' }}>{r.symbol}</div>
                {r.chain && (
                  <div style={{ fontSize: 11, color: 'var(--text-mid-50, rgba(255,255,255,0.5))' }}>{r.chain}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong, #fff)' }}>{fmt(r.amount, { grouping: false })}</div>
                <div style={{ fontSize: 13, color: 'var(--gl, #00C853)' }}>${fmt(r.usd)} · {pct.toFixed(1)}%</div>
              </div>
            </div>
            {/* Per-asset bar */}
            <div style={{ height: 3, marginTop: 6, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: tint, transition: 'width .3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AllBalancesWidget({ data }: { data: any }) {
  return <PortfolioWidget data={data} />
}

// ───────── get_price (with sparkline chart) ─────────
function PriceWidget({ data }: { data: any }) {
  const symbol = String(data.symbol ?? data.token ?? data.asset ?? '').toUpperCase()
  const price = data.price ?? data.usd ?? '0'
  const change = data.change24h ?? data.change_24h ?? data.priceChangePercent
  const chgNum = parseFloat(String(change ?? '0')) || 0
  const positive = chgNum >= 0

  const [series, setSeries] = useState<ChartPoint[] | null>(null)
  const [days, setDays] = useState<7 | 30 | 90>(7)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setLoading(true)
    fetchChart(symbol, days)
      .then(r => { if (!cancelled) setSeries(r.series ?? []) })
      .catch(() => { if (!cancelled) setSeries([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [symbol, days])

  return (
    <div style={{ ...CARD, borderLeft: `3px solid ${positive ? 'var(--gl, #00C853)' : 'var(--r, #ef4444)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoinIcon symbol={symbol} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...KICKER, marginBottom: 2 }}>{symbol} · live price</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-strong, #fff)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            ${fmt(price)}
          </div>
          {change != null && (
            <div
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: 13,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 999,
                background: positive ? 'rgba(0,200,83,0.15)' : 'rgba(239,68,68,0.15)',
                color: positive ? 'var(--gl, #00C853)' : 'var(--r, #ef4444)',
              }}
            >
              {positive ? '+' : ''}{chgNum.toFixed(2)}% · 24h
            </div>
          )}
        </div>
        {/* Range tabs */}
        <div
          role="tablist"
          aria-label="Chart range"
          style={{
            display: 'flex',
            gap: 2,
            background: 'rgba(255,255,255,0.04)',
            padding: 2,
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={days === d}
              onClick={() => setDays(d)}
              style={{
                padding: '3px 7px',
                background: days === d ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: days === d ? 'var(--text-strong, #fff)' : 'var(--text-mid-50, rgba(255,255,255,0.55))',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && !series && (
        <div style={{ height: 100, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="t3">Loading chart…</span>
        </div>
      )}
      {series && series.length > 1 && (
        <Sparkline series={series} positive={positive} />
      )}
      {series && series.length === 0 && !loading && (
        <div style={{ marginTop: 10, padding: 8, textAlign: 'center', fontSize: 13, color: 'var(--text-mid-50)' }}>
          Chart unavailable for {symbol}
        </div>
      )}
    </div>
  )
}

// Inline SVG sparkline — no chart library dependency
function Sparkline({ series, positive }: { series: ChartPoint[]; positive: boolean }) {
  const w = 480
  const h = 100
  const pad = 4
  const prices = series.map(s => s.p)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const xStep = (w - pad * 2) / Math.max(1, series.length - 1)
  const points = series.map((s, i) => {
    const x = pad + i * xStep
    const y = pad + (h - pad * 2) * (1 - (s.p - min) / range)
    return [x, y] as const
  })
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaD = pathD +
    ` L${(pad + (series.length - 1) * xStep).toFixed(1)},${(h - pad).toFixed(1)}` +
    ` L${pad},${(h - pad).toFixed(1)} Z`
  const stroke = positive ? '#00C853' : '#ef4444'
  const fill = positive ? 'rgba(0,200,83,0.18)' : 'rgba(239,68,68,0.16)'
  return (
    <div style={{ marginTop: 10 }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Price chart" role="img">
        <path d={areaD} fill={fill} />
        <path d={pathD} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid-50, rgba(255,255,255,0.45))', marginTop: 4 }}>
        <span>${fmt(min)}</span>
        <span>${fmt(max)}</span>
      </div>
    </div>
  )
}
