import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { TradingOrder, Trade } from '../../mock/db'

const TABS = ['open', 'history', 'trades'] as const

export function Activity() {
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('open')

  const open = useEndpoint<{ items: TradingOrder[] }>('api.trading.orders.open', {}, { enabled: tab === 'open' })
  const history = useEndpoint<{ items: TradingOrder[] }>('api.trading.orders.history', {}, { enabled: tab === 'history' })
  // Completed swaps are part of order history on the web exchange — merge them here too.
  const swaps = useEndpoint<{ items: TradingOrder[] }>('api.trading.swaps.history', { query: { limit: '30' } }, { enabled: tab === 'history' })
  const trades = useEndpoint<{ items: Trade[] }>('api.trading.trades', {}, { enabled: tab === 'trades' })
  const cancel = useEndpointMutation('api.trading.order.cancel', { invalidates: ['api.trading.orders.open', 'api.trading.orders.history'] })

  const openCount = open.data?.items?.length ?? 0

  // Order history = spot orders + completed swaps, newest first, de-duped by id.
  const seen = new Set<string>()
  const histItems = [...(history.data?.items ?? []), ...(swaps.data?.items ?? [])]
    .filter(o => o.id && !seen.has(o.id) && seen.add(o.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const histLoading = history.isLoading || swaps.isLoading

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Activity" rightIcons={['search']} />

      <div className="tabs" style={{ marginTop: 6 }}>
        <button className={`tab ${tab === 'open' ? 'a' : ''}`} onClick={() => setTab('open')}>Open Orders ({openCount})</button>
        <button className={`tab ${tab === 'history' ? 'a' : ''}`} onClick={() => setTab('history')}>Order History</button>
        <button className={`tab ${tab === 'trades' ? 'a' : ''}`} onClick={() => setTab('trades')}>Trade History</button>
      </div>

      {tab === 'open' && (open.data?.items?.length ?? 0) === 0 && (
        <Empty text="No open orders" />
      )}

      {tab === 'open' && open.data?.items?.map(o => {
        const filledPct = (parseFloat(o.filled) / parseFloat(o.amount)) * 100
        return (
          <div key={o.id} className="g" style={{ padding: 10, margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {o.pair} <span className="t3" style={{ fontWeight: 400 }}>· {o.type} {o.side}</span>
                </div>
                <div className="t3">{o.amount} @ {o.price}</div>
              </div>
              <span className="badge badge-g" style={{ fontSize: 9 }}>{o.status.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
              <span className="t3">{filledPct.toFixed(0)}% filled</span>
              <button className="grn" onClick={() => cancel.mutate({ pathParams: { orderId: o.id } })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 11 }}>
                Cancel
              </button>
            </div>
            <div className="bar" style={{ marginTop: 4 }}><div className="fl" style={{ width: `${filledPct}%` }} /></div>
          </div>
        )
      })}

      {tab === 'history' && histItems.map(o => {
        const failed = o.status === 'cancelled'
        return (
          <div key={o.id} className="li">
            <div className="li-i" style={{ background: failed ? 'rgba(239,68,68,.1)' : 'rgba(0,200,83,.1)', width: 28, height: 28 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: failed ? 'var(--r)' : 'var(--gl)' }}>{o.side[0].toUpperCase()}</span>
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{o.pair}</div>
              <div className="li-s">{o.amount} @ {o.price}</div>
            </div>
            <div className="li-r">
              <div className="li-v" style={{ fontSize: 13, color: failed ? 'var(--r)' : 'var(--gl)' }}>{o.total} {o.pair.split('/')[1]}</div>
              <div className="li-d"><span className={`badge badge-${failed ? 'r' : 'g'}`} style={{ fontSize: 8 }}>{o.status}</span></div>
            </div>
          </div>
        )
      })}

      {tab === 'history' && histItems.length === 0 && !histLoading && <Empty text="No order history" />}

      {tab === 'trades' && trades.data?.items?.map(t => (
        <button key={t.id} className="li" onClick={() => nav(routeFor('route.trading.detail', { tradeId: t.id }))} style={{ width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ background: t.side === 'buy' ? 'rgba(0,200,83,.1)' : 'rgba(239,68,68,.1)', width: 28, height: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.side === 'buy' ? 'var(--gl)' : 'var(--r)' }}>{t.side[0].toUpperCase()}</span>
          </div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>{t.pair}</div>
            <div className="li-s">{t.amount} @ {t.price}</div>
          </div>
          <div className="li-r">
            <div className="li-v" style={{ color: t.side === 'buy' ? 'var(--gl)' : 'var(--r)', fontSize: 13 }}>{t.total} {t.pair.split('/')[1]}</div>
            <div className="li-d">{new Date(t.createdAt).toLocaleDateString()}</div>
          </div>
        </button>
      ))}

      {tab === 'trades' && (trades.data?.items?.length ?? 0) === 0 && <Empty text="No trades yet" />}
    </PhoneShell>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
      <div className="t3">{text}</div>
    </div>
  )
}
