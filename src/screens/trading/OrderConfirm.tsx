import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'

type State = { pair: string; side: 'buy' | 'sell'; type: 'limit' | 'market' | 'stop-limit'; price: string; amount: string }

export function OrderConfirm() {
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as State | null
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation<{ body: State & { pin: string } }, { id: string }>('api.trading.order.create', {
    invalidates: ['api.trading.orders.open', 'api.wallet.balances.list'],
  })

  if (!state) {
    nav(ROUTES['route.tab.markets'].path, { replace: true })
    return null
  }

  const total = (parseFloat(state.price || '0') * parseFloat(state.amount || '0')).toFixed(2)
  const fee = (parseFloat(total) * 0.001).toFixed(2)
  const totalCost = (parseFloat(total) + parseFloat(fee)).toFixed(2)

  const submit = async () => {
    setError(null)
    if (pin.length !== 6) { setError('Enter your 6-digit PIN'); return }
    try {
      const order = await m.mutateAsync({ body: { ...state, pin } })
      nav(routeFor('route.trading.detail', { tradeId: order.id }), { replace: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Confirm Order" />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="badge badge-g" style={{ fontSize: 11 }}>{state.type.toUpperCase()} {state.side.toUpperCase()} · {state.pair}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', margin: '8px 0' }}>{state.amount} {state.pair.split('/')[0]}</div>
        <div className="t3">@ {state.type === 'market' ? 'market price' : state.price + ' ' + state.pair.split('/')[1]}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          ['Order Type', `${state.type.charAt(0).toUpperCase() + state.type.slice(1)} ${state.side.charAt(0).toUpperCase() + state.side.slice(1)}`],
          ['Pair', state.pair],
          ['Price', `${state.price} ${state.pair.split('/')[1]}`],
          ['Amount', `${state.amount} ${state.pair.split('/')[0]}`],
          ['Total', `${total} ${state.pair.split('/')[1]}`],
          ['Fee (0.10%)', `${fee} ${state.pair.split('/')[1]}`],
          ['Time-in-force', 'Good-till-cancel'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
          <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>Total Cost</span>
          <span className="grn" style={{ fontWeight: 800 }}>{totalCost} {state.pair.split('/')[1]}</span>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>PIN to confirm</h3>
      <div className="pdots">
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}
      </div>

      <div className="kpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
          <button key={i} className="kk" onClick={() => {
            if (v === '⌫') setPin(p => p.slice(0, -1))
            else if (v !== '') setPin(p => p.length < 6 ? p + v : p)
          }} style={{ width: 40, height: 40, fontSize: 14, visibility: v === '' ? 'hidden' : 'visible' }}>{v}</button>
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>Cancel</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1, padding: 10, margin: 0 }} disabled={m.isPending}>
          {m.isPending ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </PhoneShell>
  )
}
