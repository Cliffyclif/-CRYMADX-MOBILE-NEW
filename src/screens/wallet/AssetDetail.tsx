import { useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { Balance, MarketPair, Transaction } from '../../api/endpoints'

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether USD', USDC: 'USD Coin',
  SOL: 'Solana', MATIC: 'Polygon', BNB: 'BNB', XRP: 'XRP', ADA: 'Cardano',
  DOGE: 'Dogecoin', DOT: 'Polkadot', AVAX: 'Avalanche', LINK: 'Chainlink',
  TRX: 'TRON', LTC: 'Litecoin', BCH: 'Bitcoin Cash', XLM: 'Stellar',
  POL: 'Polygon', DAI: 'Dai', BUSD: 'Binance USD', TUSD: 'TrueUSD',
  PYUSD: 'PayPal USD', FDUSD: 'First Digital USD',
}

// Stablecoins quote ≈$1 — they DO have a Binance pair (USDCUSDT etc.) and
// the chart's y-axis auto-zooms to the local range, so even 0.0002 movements
// render as full-height candles. We just need a different "quote currency"
// for the pair lookup (USDC pairs against USDT, USDT pairs against USDC,
// etc.) so we don't try to chart USDT/USDT.
const STABLECOINS = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'PYUSD', 'FDUSD'])
function quoteFor(asset: string): string {
  // For USDT we have to quote against USDC (USDT/USDC exists on Binance);
  // every other stablecoin and every regular asset quotes against USDT.
  if (asset === 'USDT') return 'USDC'
  return 'USDT'
}

const INTERVALS: Array<{ id: string; label: string; binance: string }> = [
  { id: '1H',  label: '1H',  binance: '1m' },
  { id: '1D',  label: '1D',  binance: '15m' },
  { id: '1W',  label: '1W',  binance: '1h' },
  { id: '1M',  label: '1M',  binance: '4h' },
  { id: '1Y',  label: '1Y',  binance: '1d' },
  { id: 'All', label: 'All', binance: '1w' },
]

interface Candle { t: number; o: number; h: number; l: number; c: number }

export function AssetDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { symbol = 'BTC' } = useParams()
  const upper = symbol.toUpperCase()
  const isStable = STABLECOINS.has(upper)

  // Use the list endpoint and filter — per-asset 404s when user has zero
  // balance (which is exactly when they'd want to view the asset detail
  // before depositing).
  const { data: balRes } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const bal = balRes?.items?.find(b => b.asset.toUpperCase() === upper)

  // Trading pair against the appropriate quote — USDT for nearly everything,
  // USDC for USDT itself (so we can still chart USDT against another stable).
  const pairKey = `${upper}/${quoteFor(upper)}`
  const { data: pair } = useEndpoint<MarketPair>('api.markets.pair', {
    pathParams: { pair: pairKey },
  }, { refetchInterval: 10_000 })

  const [intervalId, setIntervalId] = useState('1D')
  const intervalDef = INTERVALS.find(i => i.id === intervalId) ?? INTERVALS[1]
  const { data: candleRes } = useEndpoint<{ items: Candle[] }>('api.markets.candles', {
    pathParams: { pair: pairKey }, query: { interval: intervalDef.binance },
  })
  const candles = candleRes?.items ?? []

  const { data: txs } = useEndpoint<{ items: Transaction[] }>('api.tx.list')
  const positive = pair && !pair.change24h?.startsWith('-')

  const recent = useMemo(() => {
    const all = txs?.items ?? []
    return all.filter(tx =>
      tx.asset?.toUpperCase() === upper ||
      (tx.assetTo && tx.assetTo.toUpperCase() === upper),
    ).slice(0, 4)
  }, [txs?.items, upper])

  // For stablecoins we display "$1" prominently (they're meant to be ≈1
  // anyway) but we still pull live values for the market-stats rows so the
  // user sees real volume + the tiny intraday range.
  const priceDisplay = isStable ? '$1.00' : (pair ? `$${pair.price}` : '—')
  const change24h    = pair?.change24h ?? '—'
  const vol24        = pair ? `$${formatBig(pair.volume24h)}` : '—'
  const high24       = pair ? `$${pair.high24h}` : '—'
  const low24        = pair ? `$${pair.low24h}`  : '—'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={ASSET_NAMES[upper] ?? upper} actions={<Icon name="star" size={16} color="var(--gd)" />} />

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CoinIcon symbol={upper} size={36} />
          <div style={{ flex: 1 }}>
            <div className="t3">{t('wallet.yourBalance')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)' }}>{bal?.amount ?? '0.0'} {upper}</div>
            <div className="t3">≈ ${bal?.usdValue ?? '0.00'}</div>
          </div>
          {!isStable && pair && (
            <span className={`badge badge-${positive ? 'g' : 'r'}`} style={{ fontSize: 11 }}>
              {positive ? '+' : ''}{pair.change24h}% {positive ? '↑' : '↓'}
            </span>
          )}
          {isStable && (
            <span className="badge badge-g" style={{ fontSize: 11 }}>≈ $1.00</span>
          )}
        </div>
      </div>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.withdraw'].path)}><Icon name="send" size={16} /><span>{t('home.send')}</span></button>
        <button className="qa-b" onClick={() => nav(routeFor('route.wallet.deposit', { asset: upper }))}><Icon name="dl" size={16} /><span>{t('home.receive')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.convert'].path)}><Icon name="swap" size={16} /><span>{t('wallet.swap')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.fiat.buy'].path)}><Icon name="dollar" size={16} /><span>{t('home.buy')}</span></button>
      </div>

      <div className="tabs" style={{ fontSize: 11, marginTop: 4 }}>
        {INTERVALS.map(i => (
          <button key={i.id} className={`tab ${intervalId === i.id ? 'a' : ''}`} onClick={() => setIntervalId(i.id)}>{i.label}</button>
        ))}
      </div>

      <CandleChart candles={candles} positive={!!positive} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div className="t3">{priceDisplay} <span className={positive ? 'grn' : 'red'}>{positive ? '↑' : '↓'}</span></div>
        <div className="t3">
          24h: <span className={positive ? 'grn' : 'red'}>{change24h}%</span>
          {isStable && <span className="t3" style={{ marginLeft: 6, fontSize: 10 }}>vs {quoteFor(upper)}</span>}
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('wallet.marketStats')}</h3>
      <div className="g" style={{ padding: 10 }}>
        {[
          [t('wallet.price'), priceDisplay],
          [t('wallet.vol24'), vol24],
          [t('wallet.high24'), high24],
          [t('wallet.low24'), low24],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 8 }}>{t('wallet.recentActivity')}</h3>
      {recent.length > 0 ? recent.map(tx => (
        <button key={tx.id} className="li" onClick={() => nav(routeFor('route.wallet.tx-detail', { txId: tx.id }))} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none' }}>
          <div className="li-i" style={{ background: 'rgba(0,200,83,.1)' }}>
            <Icon name={tx.type === 'deposit' ? 'dl' : tx.type === 'withdraw' ? 'arrow' : 'swap'} size={14} />
          </div>
          <div className="li-c">
            <div className="li-n">{capitalize(tx.type)}</div>
            <div className="li-s">{new Date(tx.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="li-r">
            <div className="li-v" style={{ fontSize: 13 }}>{tx.amount} {tx.asset}</div>
          </div>
        </button>
      )) : <div className="t3" style={{ padding: 12, textAlign: 'center' }}>{t('wallet.noActivityYet')}</div>}
    </PhoneShell>
  )
}

// Real SVG candle chart — same approach as Spot Trading's simple-mode chart.
function CandleChart({ candles, positive }: { candles: Array<{ t: number; o: number; h: number; l: number; c: number }>; positive: boolean }) {
  if (!candles || candles.length === 0) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-soft)', borderRadius: 8, color: 'var(--text-mid-30)', fontSize: 12, marginTop: 4 }}>
        Loading chart…
      </div>
    )
  }
  const W = 360, H = 140, padX = 6, padY = 8
  const minLow = Math.min(...candles.map(c => c.l))
  const maxHigh = Math.max(...candles.map(c => c.h))
  const range = maxHigh - minLow || 1
  const cw = (W - padX * 2) / candles.length
  const y = (v: number) => padY + ((maxHigh - v) / range) * (H - padY * 2)

  return (
    <div style={{ marginTop: 4, background: 'var(--surface-soft)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
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
              <rect x={x - cw * 0.35} y={top} width={cw * 0.7} height={Math.max(1, bot - top)} fill={color} stroke={color} strokeWidth="0.5" />
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

function formatBig(s: string): string {
  const n = parseFloat(s)
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return s
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
