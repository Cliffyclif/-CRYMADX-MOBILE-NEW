import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import { fmt } from '../../lib/format'
import type { Transaction } from '../../api/endpoints'

type WithdrawState = { asset: string; network: string; address: string; amount: string; fee: string }

export function WithdrawConfirm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as WithdrawState | null
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation<{ body: WithdrawState & { pin: string } }, Transaction>('api.wallet.withdraw.create', {
    invalidates: ['api.wallet.balances.list', 'api.tx.list'],
  })

  if (!state) {
    nav(ROUTES['route.wallet.withdraw'].path, { replace: true })
    return null
  }

  const total = fmt(parseFloat(state.amount) + parseFloat(state.fee))

  const submit = async () => {
    setError(null)
    if (pin.length !== 6) { setError(t('withdraw.enterSixDigitPin')); return }
    try {
      const tx = await m.mutateAsync({ body: { ...state, pin } })
      nav(routeFor('route.wallet.tx-detail', { txId: tx.id }), { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('withdraw.confirmTitle')} />

      <div className="steps">
        <div className="step"><div className="sn d">✓</div><div className="st">{t('withdraw.stepAsset')}</div></div>
        <div className="step"><div className="sn d">✓</div><div className="st">{t('withdraw.stepAmount')}</div></div>
        <div className="step"><div className="sn a">3</div><div className="st">{t('withdraw.stepConfirm')}</div></div>
      </div>

      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
        <div className="t3">{t('withdraw.youSend')}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '6px 0' }}>{state.amount} {state.asset}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('common.to'), shorten(state.address)],
          [t('common.network'), state.network],
          [t('common.amount'), `${state.amount} ${state.asset}`],
          [t('withdraw.networkFee'), `${state.fee} ${state.asset}`],
          [t('withdraw.totalDeducted'), `${total} ${state.asset}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('withdraw.withdrawalsIrreversible')}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('withdraw.enterPinTitle')}</h3>
      <div className="pdots">
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}
      </div>

      <div className="kpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
          <button key={i} className="kk" onClick={() => {
            if (v === '⌫') setPin(p => p.slice(0, -1))
            else if (v !== '') setPin(p => p.length < 6 ? p + v : p)
          }} style={{ width: 40, height: 40, fontSize: 14, visibility: v === '' ? 'hidden' : 'visible' }}>
            {v}
          </button>
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1, padding: 10, margin: 0 }} disabled={m.isPending}>
          <Icon name="fp" size={12} color="#fff" />
          {m.isPending ? t('withdraw.confirming') : t('common.confirm')}
        </button>
      </div>
    </PhoneShell>
  )
}

function shorten(addr: string): string {
  if (addr.length < 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
