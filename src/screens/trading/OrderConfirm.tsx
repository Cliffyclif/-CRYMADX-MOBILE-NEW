import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'

type OrderType = 'limit' | 'market' | 'stop_loss' | 'take_profit' | 'oco'

interface State {
  pair: string
  side: 'buy' | 'sell'
  type: OrderType
  amount: string
  // limit / SL/TP send `price` as the active price (or empty for market)
  price?: string
  // SL/TP carry triggerPrice in addition to (empty) price
  triggerPrice?: string
  // OCO carries both legs
  ocoTakeProfit?: string
  ocoStopLoss?: string
}

const TYPE_LABELS: Record<OrderType, string> = {
  limit: 'Limit',
  market: 'Market',
  stop_loss: 'Stop-Loss',
  take_profit: 'Take-Profit',
  oco: 'OCO',
}

export function OrderConfirm() {
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as State | null
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createOrder = useEndpointMutation<{ body: any }, { id: string }>('api.trading.order.create', {
    invalidates: ['api.trading.orders.open', 'api.wallet.balances.list'],
  })
  const createOco = useEndpointMutation<{ body: any }, { ocoGroupId: string; takeProfitOrderId: string; stopLossOrderId: string }>('api.trading.order.oco', {
    invalidates: ['api.trading.orders.open', 'api.wallet.balances.list'],
  })

  if (!state) {
    nav(ROUTES['route.tab.markets'].path, { replace: true })
    return null
  }

  const [base, quote] = state.pair.split('/')
  const isOco = state.type === 'oco'
  const isSlTp = state.type === 'stop_loss' || state.type === 'take_profit'
  const isLimit = state.type === 'limit'

  // For totals, use the most relevant price for this order type
  const refPrice = isOco ? (state.ocoTakeProfit || '0')
    : isSlTp ? (state.triggerPrice || '0')
    : (state.price || '0')
  const total = (parseFloat(refPrice) * parseFloat(state.amount || '0')).toFixed(2)
  const fee = (parseFloat(total) * 0.001).toFixed(2)
  const totalCost = (parseFloat(total) + parseFloat(fee)).toFixed(2)

  const submit = async () => {
    setError(null)
    if (pin.length !== 6) { setError('Enter your 6-digit PIN'); return }
    try {
      if (isOco) {
        // Backend: POST /spot/order/oco
        const result = await createOco.mutateAsync({
          body: {
            baseAsset: base.toUpperCase(),
            quoteAsset: quote.toUpperCase(),
            side: state.side,
            amount: state.amount,
            takeProfit: { triggerPrice: state.ocoTakeProfit },
            stopLoss:   { triggerPrice: state.ocoStopLoss },
            // chains: backend resolves from user wallet if not provided.
            // Mobile doesn't currently surface chain pickers — fall back
            // to most-recent on backend.
            fromChain: state.side === 'buy' ? quote.toUpperCase() : base.toUpperCase(),
            toChain:   state.side === 'buy' ? base.toUpperCase()  : quote.toUpperCase(),
            expiryType: 'gtc',
            pin,
          },
        })
        nav(routeFor('route.trading.detail', { tradeId: result.takeProfitOrderId }), { replace: true })
      } else {
        // Backend: POST /spot/order
        const order = await createOrder.mutateAsync({
          body: {
            type: state.type,
            side: state.side,
            baseAsset: base.toUpperCase(),
            quoteAsset: quote.toUpperCase(),
            amount: state.amount,
            limitPrice: isLimit ? state.price : undefined,
            triggerPrice: isSlTp ? state.triggerPrice : undefined,
            fromChain: state.side === 'buy' ? quote.toUpperCase() : base.toUpperCase(),
            toChain:   state.side === 'buy' ? base.toUpperCase()  : quote.toUpperCase(),
            expiryType: state.type === 'market' ? undefined : 'gtc',
            pin,
          },
        })
        nav(routeFor('route.trading.detail', { tradeId: order.id }), { replace: true })
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Build the rows shown in the summary card. Differs slightly by type.
  const summaryRows: Array<[string, string]> = [
    ['Order Type', `${TYPE_LABELS[state.type]} ${state.side === 'buy' ? 'Buy' : 'Sell'}`],
    ['Pair', state.pair],
  ]
  if (isLimit) summaryRows.push(['Limit Price', `${state.price} ${quote}`])
  if (state.type === 'market') summaryRows.push(['Price', 'Market'])
  if (isSlTp) summaryRows.push(['Trigger Price', `${state.triggerPrice} ${quote}`])
  if (isOco) {
    summaryRows.push(['Take-profit', `${state.ocoTakeProfit} ${quote}`])
    summaryRows.push(['Stop-loss', `${state.ocoStopLoss} ${quote}`])
  }
  summaryRows.push(['Amount', `${state.amount} ${base}`])
  summaryRows.push(['Total', `${total} ${quote}`])
  summaryRows.push(['Fee (~0.10%)', `${fee} ${quote}`])
  summaryRows.push(['Time-in-force', state.type === 'market' ? 'Immediate' : 'Good-till-cancel'])

  const isPending = createOrder.isPending || createOco.isPending

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Confirm Order" />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="badge badge-g" style={{ fontSize: 11 }}>
          {TYPE_LABELS[state.type].toUpperCase()} {state.side.toUpperCase()} · {state.pair}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', margin: '8px 0' }}>
          {state.amount} {base}
        </div>
        <div className="t3">
          {isOco
            ? `TP @ ${state.ocoTakeProfit} · SL @ ${state.ocoStopLoss}`
            : isSlTp
              ? `Trigger @ ${state.triggerPrice} ${quote}`
              : isLimit
                ? `@ ${state.price} ${quote}`
                : 'at market price'}
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {summaryRows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
          <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>Total Cost</span>
          <span className="grn" style={{ fontWeight: 800 }}>{totalCost} {quote}</span>
        </div>
        {isOco && (
          <div className="t3" style={{ marginTop: 4, fontSize: 11 }}>
            Whichever leg fills first, the other auto-cancels.
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 10 }}>PIN to confirm</h3>
      <div className="pdots">
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}
      </div>

      <div className="kpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
          <button key={i} className="kk" onClick={() => {
            if (v === '⌫') setPin(p => p.slice(0, -1))
            else if (v !== '') setPin(p => p.length < 6 ? p + String(v) : p)
          }} style={{ width: 40, height: 40, fontSize: 14, visibility: v === '' ? 'hidden' : 'visible' }}>{v}</button>
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>Cancel</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1, padding: 10, margin: 0 }} disabled={isPending}>
          {isPending ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </PhoneShell>
  )
}
