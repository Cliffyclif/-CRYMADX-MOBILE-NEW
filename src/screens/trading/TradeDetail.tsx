import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'

interface TradeRow {
  id?: string; _id?: string
  pair?: string; symbol?: string
  side?: 'buy' | 'sell'
  type?: string
  status?: string
  price?: string | number
  amount?: string | number
  filled?: string | number
  total?: string | number
  fee?: string | number
  feeAsset?: string; fee_asset?: string
  createdAt?: string; created_at?: string
  filledAt?: string; filled_at?: string
}

export function TradeDetail() {
  const nav = useNavigate()
  const { tradeId = '' } = useParams()
  const { data: tradeRaw, isLoading } = useEndpoint<TradeRow>('api.trading.trade', { pathParams: { tradeId } })

  if (isLoading) return <PhoneShell noTabs><ScreenHeader title="Trade" /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}><div className="t3">Loading…</div></div></PhoneShell>
  if (!tradeRaw) return <PhoneShell noTabs><ScreenHeader title="Trade" /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center', color: 'var(--r)' }}>Trade not found</div></PhoneShell>

  // Normalize so missing fields don't crash the render.
  const trade = {
    id:       String(tradeRaw.id ?? tradeRaw._id ?? tradeId),
    pair:     tradeRaw.pair ?? tradeRaw.symbol ?? '—',
    side:     tradeRaw.side ?? 'buy',
    type:     tradeRaw.type ?? 'market',
    status:   (tradeRaw.status ?? 'filled').toLowerCase(),
    price:    String(tradeRaw.price ?? '0'),
    amount:   String(tradeRaw.amount ?? tradeRaw.filled ?? '0'),
    total:    String(tradeRaw.total ?? (parseFloat(String(tradeRaw.price ?? 0)) * parseFloat(String(tradeRaw.amount ?? tradeRaw.filled ?? 0))).toFixed(2)),
    fee:      String(tradeRaw.fee ?? '0'),
    feeAsset: tradeRaw.feeAsset ?? tradeRaw.fee_asset ?? '',
    createdAt: tradeRaw.createdAt ?? tradeRaw.created_at ?? new Date().toISOString(),
    filledAt:  tradeRaw.filledAt ?? tradeRaw.filled_at ?? null,
  }
  const [base, quote] = trade.pair.split('/')
  const color = trade.side === 'buy' ? 'var(--gl)' : 'var(--r)'
  const badgeKind = trade.status === 'filled' ? 'g' : trade.status === 'cancelled' ? 'r' : 'gd'
  const safeDate = (s?: string | null) => { if (!s) return '—'; try { return new Date(s).toLocaleString() } catch { return '—' } }

  const repeat = () => {
    nav(routeFor('route.trading.spot', { pair: trade.pair }), { replace: false })
  }
  const share = async () => {
    const text = `${trade.side.toUpperCase()} ${trade.amount} ${base} @ ${trade.price} ${quote}`
    const nav: any = navigator
    try {
      if (typeof nav?.share === 'function') await nav.share({ title: 'CrymadX trade', text })
      else if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(text); toast.success('Copied to clipboard') }
    } catch { /* user cancelled */ }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Trade Detail" />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className={`badge badge-${badgeKind}`} style={{ fontSize: 11 }}>{trade.status.toUpperCase()} · {trade.pair} {trade.side.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, margin: '8px 0' }}>
          {trade.side === 'buy' ? '+' : '-'}{trade.amount} {base}
        </div>
        <div className="t3">Cost {trade.total} {quote} · Avg {trade.price}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          ['Trade ID', `#${String(trade.id).slice(-8)}`],
          ['Pair', trade.pair],
          ['Side', trade.side],
          ['Type', trade.type],
          ['Quantity', `${trade.amount} ${base}`],
          ['Avg Price', `${trade.price} ${quote}`],
          ['Total', `${trade.total} ${quote}`],
          ['Fee', trade.feeAsset ? `${trade.fee} ${trade.feeAsset}` : trade.fee],
          ['Created', safeDate(trade.createdAt)],
          ['Filled', safeDate(trade.filledAt)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={repeat} className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="refresh" size={10} /> Repeat</button>
        <button onClick={share} className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="share" size={10} /> Share</button>
        <button onClick={() => nav(ROUTES['route.support.tickets'].path)} className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="help" size={10} /> Support</button>
      </div>
    </PhoneShell>
  )
}
