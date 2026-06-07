import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { usePinGate } from '../../components/PinGate'
import { ROUTES } from '../../routes'
import type { Balance } from '../../api/endpoints'
import type { CardSettings } from '../../mock/db'

export function CardTopUp() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const requirePin = usePinGate()
  const { data: card } = useEndpoint<CardSettings>('api.card.get')
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [amount, setAmount] = useState('100')
  const [fromAsset, setFromAsset] = useState('USDC')
  const m = useEndpointMutation('api.card.topup', { invalidates: ['api.card.get', 'api.wallet.balances.list'] })

  const stables = bal?.items?.filter(b => ['USDC', 'USDT', 'BTC'].includes(b.asset)) ?? []

  const submit = async () => {
    if (!(await requirePin())) return // transaction-PIN gate (opt-in)
    await m.mutateAsync({ body: { amount, fromAsset } })
    nav(ROUTES['route.card.hub'].path, { replace: true })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('card.topupTitle')} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="t3">{t('card.cardBalance')}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>${card?.balance ?? '0.00'} USD</div>
        <div className="t2">{t('card.cardHash', { last4: card?.cardLast4 ?? '----', name: card?.cardholderName ?? '' })}</div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('card.amountTitle')}</h3>
      <div className="g" style={{ padding: 14 }}>
        <div className="inp" style={{ padding: 10 }}>
          <span style={{ color: 'var(--text-mid-40)', fontSize: 14 }}>$</span>
          <input
            type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginLeft: 4 }}
          />
          <span style={{ marginLeft: 'auto', color: 'var(--text-strong)' }}>USD</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {['25', '50', '100', '250', '500'].map(p => (
            <button key={p} className={`badge ${amount === p ? 'badge-g' : ''}`} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', background: amount === p ? 'var(--g)' : 'var(--surface-soft)', color: amount === p ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: 4 }} onClick={() => setAmount(p)}>${p}</button>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('card.fromTitle')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {stables.map(b => {
          const active = fromAsset === b.asset
          return (
            <button key={b.id} onClick={() => setFromAsset(b.asset)} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: active ? 'rgba(0,200,83,.04)' : 'transparent', width: '100%', textAlign: 'left' }}>
              <div className="li-i" style={{ background: active ? 'rgba(38,161,123,.15)' : undefined }}>
                <div style={{ fontSize: 14, color: '#26A17B', fontWeight: 700 }}>{b.asset}</div>
              </div>
              <div className="li-c">
                <div className="li-n">{b.asset}</div>
                <div className="li-s">{t('common.available')}: {b.amount} {b.asset}</div>
              </div>
              <div className="grn">{active ? '●' : <span className="t3">○</span>}</div>
            </button>
          )
        })}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('card.topUpRow'), `${amount}.00 ${fromAsset}`],
          [t('card.conversionFee'), `0.50 ${fromAsset}`],
          [t('card.cardCredit'), `$${(parseFloat(amount || '0') - 0.5).toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={m.isPending || !amount || parseFloat(amount) <= 0}>
        {m.isPending ? t('card.processing') : t('card.topUpPin')}
      </button>
    </PhoneShell>
  )
}
