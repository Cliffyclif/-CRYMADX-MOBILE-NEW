// Activity Snapshot — compact mobile equivalent of the main exchange's
// Net Deposits + Real Return + Swap Volume row. Computes everything
// client-side from the txn list and current market prices, so it works
// today without any backend snapshot job.
import { useMemo } from 'react'
import { useEndpoint } from '../api/hooks'
import type { Transaction, MarketPair } from '../api/endpoints'

type Wallet = { total: string }

const COMPLETED = new Set(['completed', 'confirmed'])

function priceFor(symbol: string, markets: MarketPair[] | undefined): number {
  if (!Array.isArray(markets)) return 0
  const up = symbol.toUpperCase()
  if (up === 'USDT' || up === 'USDC' || up === 'USD' || up === 'DAI' || up === 'BUSD') return 1
  // Match BASE/USDT pair first; fall back to BASE/USD.
  const usdt = markets.find((m) => m.base?.toUpperCase() === up && m.quote?.toUpperCase() === 'USDT')
  const usd = markets.find((m) => m.base?.toUpperCase() === up && m.quote?.toUpperCase() === 'USD')
  return parseFloat((usdt || usd)?.price || '0') || 0
}

function txUsd(tx: Transaction, markets: MarketPair[] | undefined): number {
  const amt = parseFloat(tx.amount || '0')
  if (!Number.isFinite(amt) || amt <= 0) return 0
  return amt * priceFor(tx.asset, markets)
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '$0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`
  return `${n < 0 ? '-' : ''}$${abs.toFixed(2)}`
}

export function ActivitySnapshot() {
  // Pull a generous slice of txns. ~365d worth.
  const { data: txData } = useEndpoint<{ items: Transaction[] }>('api.tx.list', { query: { limit: 1000 } })
  // api.markets.list returns { items: MarketPair[] }, not a bare array — unwrap it.
  const { data: marketsData } = useEndpoint<{ items: MarketPair[] }>('api.markets.list')
  const markets = marketsData?.items
  const { data: wallet } = useEndpoint<Wallet>('api.wallet.balances.list')

  const m = useMemo(() => {
    const txs = txData?.items ?? []
    const inWindow = txs.filter((t) => COMPLETED.has(t.status))
    let totalDeposits = 0
    let totalWithdrawals = 0
    let swapVolume = 0
    let swapCount = 0
    for (const t of inWindow) {
      const usd = txUsd(t, markets)
      if (t.type === 'deposit') totalDeposits += usd
      else if (t.type === 'withdraw') totalWithdrawals += usd
      else if (t.type === 'convert' || t.type === 'trade') {
        swapVolume += usd
        swapCount += 1
      }
    }
    const netDeposits = totalDeposits - totalWithdrawals
    const currentValue = parseFloat(wallet?.total || '0')
    let realReturnPct: number | null = null
    let realReturnUsd: number | null = null
    if (netDeposits > 0) {
      realReturnUsd = currentValue - netDeposits
      realReturnPct = (realReturnUsd / netDeposits) * 100
    }
    return {
      totalDeposits, totalWithdrawals, netDeposits,
      swapVolume, swapCount, currentValue,
      realReturnPct, realReturnUsd,
      hasData: inWindow.length > 0,
    }
  }, [txData, markets, wallet])

  if (!m.hasData) return null

  const returnColor = m.realReturnPct == null
    ? 'var(--text-strong)'
    : m.realReturnPct >= 0 ? 'var(--gl)' : 'var(--r)'

  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Your Activity</h3>
      <div className="g" style={{ padding: 14 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12,
        }}>
          <Stat label="Net Deposits" value={fmt(m.netDeposits)} sub="Capital committed" />
          <Stat
            label="Real Return"
            value={m.realReturnPct == null ? '—' : `${m.realReturnPct >= 0 ? '+' : ''}${m.realReturnPct.toFixed(1)}%`}
            sub={m.realReturnUsd == null ? 'Awaiting net deposits' : `${m.realReturnUsd >= 0 ? '+' : ''}${fmt(m.realReturnUsd)}`}
            color={returnColor}
          />
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          paddingTop: 12, borderTop: '1px solid var(--surface-soft)',
        }}>
          <Stat label="Swap Volume" value={fmt(m.swapVolume)} sub={`${m.swapCount} swap${m.swapCount === 1 ? '' : 's'}`} />
          <Stat label="Total Deposits" value={fmt(m.totalDeposits)} sub={m.totalWithdrawals > 0 ? `Out: ${fmt(m.totalWithdrawals)}` : 'No withdrawals yet'} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <div className="t3" style={{ fontSize: 11 }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 700, color: color || 'var(--text-strong)',
        fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
      }}>{value}</div>
      {sub && <div className="t3" style={{ fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
