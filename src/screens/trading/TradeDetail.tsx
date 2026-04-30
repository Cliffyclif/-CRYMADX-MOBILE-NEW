import { useParams } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import type { Trade } from '../../mock/db'

export function TradeDetail() {
  const { tradeId = '' } = useParams()
  const { data: trade, isLoading } = useEndpoint<Trade>('api.trading.trade', { pathParams: { tradeId } })

  if (isLoading) return <PhoneShell noTabs><ScreenHeader title="Trade" /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}><div className="t3">Loading…</div></div></PhoneShell>
  if (!trade) return <PhoneShell noTabs><ScreenHeader title="Trade" /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center', color: 'var(--r)' }}>Trade not found</div></PhoneShell>

  const color = trade.side === 'buy' ? 'var(--gl)' : 'var(--r)'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Trade Detail" />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="badge badge-g" style={{ fontSize: 11 }}>FILLED · {trade.pair} {trade.side.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, margin: '8px 0' }}>
          {trade.side === 'buy' ? '+' : '-'}{trade.amount} {trade.pair.split('/')[0]}
        </div>
        <div className="t3">Cost {trade.total} {trade.pair.split('/')[1]} · Avg {trade.price}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          ['Trade ID', `#${trade.id.slice(-8)}`],
          ['Pair', trade.pair],
          ['Side', trade.side],
          ['Quantity', `${trade.amount} ${trade.pair.split('/')[0]}`],
          ['Avg Price', trade.price],
          ['Total', `${trade.total} ${trade.pair.split('/')[1]}`],
          ['Fee', `${trade.fee} ${trade.feeAsset}`],
          ['Time', new Date(trade.createdAt).toLocaleString()],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="refresh" size={10} /> Repeat</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="share" size={10} /> Share</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="help" size={10} /> Support</button>
      </div>
    </PhoneShell>
  )
}
