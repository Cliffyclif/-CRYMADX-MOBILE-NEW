import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { SavingsProduct } from '../../mock/db'

export function SavingsDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { productId = '' } = useParams()
  const { data } = useEndpoint<{ items: SavingsProduct[] }>('api.earn.savings.products')
  const product = data?.items?.find(p => p.id === productId)
  const [calcAmount, setCalcAmount] = useState('1000')

  if (!product) {
    return <PhoneShell noTabs><ScreenHeader title={t('earn.savingsTitle')} /><div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('earn.productNotFound')}</div></div></PhoneShell>
  }

  const amt = parseFloat(calcAmount || '0')
  const days = product.termDays || 365
  const dailyRate = parseFloat(product.apy) / 100 / 365
  const dailyReward = amt * dailyRate
  const totalReward = dailyReward * days
  const finalAmount = amt + totalReward

  const typeLabel = product.type === 'locked' ? t('earn.lockedSuffix') : t('earn.flexibleSuffix')
  const termLabel = product.type === 'flexible' ? t('earn.flexibleSuffix') : t('earn.fixedSuffix', { days: product.termDays })

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={`${product.asset} ${typeLabel}`} actions={<span className={`badge badge-${product.type === 'locked' ? 'gd' : 'g'}`} style={{ fontSize: 10 }}>{product.type.toUpperCase()}</span>} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="t3">{t('earn.apy')}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--gl)', margin: '4px 0' }}>{product.apy}%</div>
        <div className="t3">{product.asset} · {termLabel}</div>
      </div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{product.termDays || 'Flex'}</div><div className="stat-l">{product.termDays ? t('earn.lockDays') : t('earn.term')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{product.minAmount}</div><div className="stat-l">{t('earn.minLabel', { asset: product.asset })}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{product.maxAmount}</div><div className="stat-l">{t('earn.maxLabel', { asset: product.asset })}</div></div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('earn.rewardCalc')}</h3>
      <div className="g" style={{ padding: 12 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('earn.depositAmount')}</div>
        <div className="inp" style={{ padding: 10 }}>
          <input
            type="number" inputMode="decimal" value={calcAmount} onChange={e => setCalcAmount(e.target.value)}
            style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}
            step="any"
          />
          <span style={{ marginLeft: 'auto', color: 'var(--text-strong)' }}>{product.asset}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
          {['100', '500', '1000', '5000'].map(v => (
            <button key={v} className={`badge ${calcAmount === v ? 'badge-g' : ''}`} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', background: calcAmount === v ? 'var(--g)' : 'var(--surface-soft)', color: calcAmount === v ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: 4 }} onClick={() => setCalcAmount(v)}>${v}</button>
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--divider)', margin: '8px 0' }} />
        {[
          [t('earn.dailyReward'), dailyReward.toFixed(4)],
          [t('earn.totalReward', { days: product.termDays || 365 }), totalReward.toFixed(4)],
          [t('earn.finalAmount'), finalAmount.toFixed(4)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span className="grn" style={{ fontWeight: 700 }}>{v} {product.asset}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('earn.termsTitle')}</h3>
      <div className="g" style={{ padding: 8 }}>
        <div className="t3" style={{ lineHeight: 1.5 }}>{product.description}</div>
      </div>

      <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => nav(routeFor('route.earn.savings.deposit', { productId: product.id }))}>
        {t('earn.depositEarnApy', { apy: product.apy })}
      </button>
    </PhoneShell>
  )
}
