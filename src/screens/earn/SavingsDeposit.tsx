import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { fmt } from '../../lib/format'
import type { Balance } from '../../api/endpoints'
import type { SavingsProduct } from '../../mock/db'

export function SavingsDeposit() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { productId = '' } = useParams()
  const { data: products } = useEndpoint<{ items: SavingsProduct[] }>('api.earn.savings.products')
  const product = products?.items?.find(p => p.id === productId)
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.earn.savings.deposit', { invalidates: ['api.earn.savings.positions', 'api.wallet.balances.list'] })

  if (!product) {
    return <PhoneShell noTabs><ScreenHeader title={t('earn.depositBtn')} /><div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('earn.productNotFound')}</div></div></PhoneShell>
  }

  const balance = bal?.items?.find(b => b.asset === product.asset)
  const dailyRate = parseFloat(product.apy) / 100 / 365
  const days = product.termDays || 30
  const reward = parseFloat(amount || '0') * dailyRate * days
  const final = parseFloat(amount || '0') + reward

  const submit = async () => {
    setError(null)
    try {
      await m.mutateAsync({ body: { productId, amount } })
      nav(ROUTES['route.earn.savings'].path, { replace: true })
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('earn.depositTitle', { asset: product.asset })} />

      <div className="steps">
        <div className="step"><div className="sn d">✓</div><div className="st">{t('earn.stepProduct')}</div></div>
        <div className="step"><div className="sn a">2</div><div className="st">{t('earn.stepAmountLabel')}</div></div>
        <div className="step"><div className="sn">3</div><div className="st">{t('earn.stepConfirm')}</div></div>
      </div>

      <div className="g" style={{ padding: 14, textAlign: 'center', marginTop: 8 }}>
        <div className="t3">{product.asset} {product.type === 'locked' ? t('earn.lockedNDay', { days: product.termDays }) : t('earn.flexibleSuffix')}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--gl)', margin: '4px 0' }}>{product.apy}%</div>
        <div className="t2">{product.type === 'locked' ? t('earn.lockedNDayLong', { days: product.termDays }) : t('earn.withdrawAnytime')}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('earn.stepAmountLabel')}</h3>
      <div className="g" style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Outfit' }}
            step="any"
          />
          <div style={{ marginLeft: 'auto', color: 'var(--gl)', fontWeight: 700 }}>{product.asset}</div>
        </div>
        <div className="t3" style={{ marginTop: 2 }}>{t('earn.availPrefix')} {balance?.amount ?? '—'} {product.asset}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {[0.25, 0.5, 0.75, 1].map((p, i) => (
            <button key={i} className="badge badge-g" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: 'none' }} onClick={() => balance && setAmount((parseFloat(balance.amount) * p).toFixed(8))}>
              {p === 1 ? t('common.max') : `${p * 100}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('earn.dailyReward'), `${fmt(parseFloat(amount || '0') * dailyRate)} ${product.asset}`],
          [t('earn.totalAtMaturity'), `${fmt(final)} ${product.asset}`],
          [t('earn.profit'), `+${fmt(reward)} ${product.asset}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span className="grn">{v}</span>
          </div>
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <button className="btn btn-g" style={{ marginTop: 10 }} onClick={submit} disabled={!amount || parseFloat(amount) <= 0 || m.isPending}>
        {m.isPending ? t('earn.depositing') : t('earn.depositBtn')}
      </button>
    </PhoneShell>
  )
}
