import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { FiatOrder } from '../../mock/db'

type State = { fiatAmount: string; fiatCurrency: string; cryptoAmount: string; cryptoAsset: string; rate: string; fee: string; networkFee: string; quoteId: string }

export function FiatOrderConfirm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as State | null
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation<{ body: Partial<FiatOrder> }, FiatOrder>('api.fiat.order.create')

  if (!state) {
    nav(ROUTES['route.fiat.buy'].path, { replace: true })
    return null
  }

  const submit = async () => {
    setError(null)
    if (!agreed) { setError(t('buy.mustAgreeTerms')); return }
    try {
      const order = await m.mutateAsync({ body: {
        fiatAmount: state.fiatAmount, fiatCurrency: state.fiatCurrency,
        cryptoAmount: state.cryptoAmount, cryptoAsset: state.cryptoAsset,
        rate: state.rate, fee: state.fee, paymentMethod: 'visa-4821',
      } })
      nav(ROUTES['route.fiat.gateway'].path, { state: { orderId: order.id } })
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('buy.confirmOrder')} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="t3">{t('buy.youReceiveBig')}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gl)', margin: '6px 0' }}>{state.cryptoAmount} {state.cryptoAsset}</div>
        <div className="t2">{t('buy.inYourWallet', { usd: (parseFloat(state.fiatAmount) - parseFloat(state.fee)).toFixed(2) })}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('buy.orderIdLabel'), t('buy.orderIdPending')],
          [t('buy.youPay'), `$${state.fiatAmount}.00 ${state.fiatCurrency}`],
          [t('common.asset'), state.cryptoAsset],
          [t('buy.networkLabel'), state.cryptoAsset === 'BTC' ? 'Bitcoin' : 'Ethereum'],
          [t('buy.serviceFee'), `$${state.fee}`],
          [t('buy.networkFee'), `~$${state.networkFee}`],
          [t('buy.rateLabel'), `1 ${state.cryptoAsset} = $${state.rate}`],
          [t('buy.youReceiveBig'), `${state.cryptoAmount} ${state.cryptoAsset}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('buy.paymentMethodLabel')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, #1a4c9f, #0d47a1)' }} />
          <div>
            <div style={{ fontSize: 15, color: 'var(--text-strong)', fontWeight: 700 }}>Visa **** 4821</div>
            <div className="t3">Joseph Obasi</div>
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: 'var(--text-mid-50)', margin: '8px 0' }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: 'var(--g)' }} />
        {t('buy.iAgreeTo')} <span className="grn">{t('buy.agreeGuardarian')}</span>
      </label>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1.5, padding: 10, margin: 0 }} disabled={m.isPending || !agreed}>
          {m.isPending ? t('buy.confirmingDots') : t('buy.confirmPay', { amount: state.fiatAmount })}
        </button>
      </div>
    </PhoneShell>
  )
}
