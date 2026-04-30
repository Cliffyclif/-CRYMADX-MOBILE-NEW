import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { fmt } from '../../lib/format'
import type { StakingPosition, StakingProduct } from '../../mock/db'

export function Unstake() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const positionId = (loc.state as { positionId?: string } | null)?.positionId
  const { data: positions } = useEndpoint<{ items: StakingPosition[] }>('api.earn.staking.positions')
  const { data: products } = useEndpoint<{ items: StakingProduct[] }>('api.earn.staking.products')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.earn.staking.unstake', { invalidates: ['api.earn.staking.positions', 'api.wallet.balances.list'] })

  const position = positions?.items?.find(p => p.id === positionId) ?? positions?.items?.[0]
  const product = products?.items?.find(p => p.id === position?.productId)

  if (!position) {
    return <PhoneShell noTabs><ScreenHeader title={t('earn.unstake')} /><div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('earn.noActiveStaking')}</div></div></PhoneShell>
  }

  const submit = async () => {
    setError(null)
    if (!amount) { setError(t('earn.enterAmount')); return }
    try {
      await m.mutateAsync({ body: { positionId: position.id, amount } })
      nav(ROUTES['route.earn.staking'].path, { replace: true })
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('earn.unstakeTitle', { asset: position.asset })} />

      <div className="g" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="t3">{t('earn.stakedLabel')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 2 }}>{position.liquidAmount} {product?.liquidToken ?? position.asset}</div>
            <div className="t3">{product?.protocol ?? 'Native'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="t3">{t('earn.totalEarned')}</div>
            <div className="grn" style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>+{position.earned}</div>
          </div>
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('earn.unstakeAmount')}</div>
        <div className="inp" style={{ padding: 10 }}>
          <input
            type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }} step="any"
          />
          <span style={{ marginLeft: 'auto', color: 'var(--text-strong)', fontWeight: 700 }}>{product?.liquidToken ?? position.asset}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {[0.25, 0.5, 0.75, 1].map((p, i) => (
            <button key={i} className="badge badge-g" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: 'none' }} onClick={() => setAmount((parseFloat(position.liquidAmount) * p).toFixed(8))}>
              {p === 1 ? t('common.max') : `${p * 100}%`}
            </button>
          ))}
        </div>
      </div>

      {(product?.unbondingDays ?? 0) > 0 && (
        <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
          <span className="gld">⏱</span>
          <div className="t3" style={{ lineHeight: 1.4 }}>
            <span className="gld">{t('earn.unbondingPeriod')}</span> {t('earn.unbondingDaysText', { n: product?.unbondingDays })}
          </div>
        </div>
      )}

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('earn.rowAsset'), position.asset],
          [t('earn.rowProtocol'), product?.protocol ?? '—'],
          [t('earn.rowUnstaking'), `${amount || '0'} ${product?.liquidToken ?? position.asset}`],
          [t('earn.rowYouReceiveEst'), `${fmt(parseFloat(amount || '0') * 1.0024)} ${position.asset}`],
          [t('earn.rowCooldown'), (product?.unbondingDays ?? 0) === 0 ? t('earn.instant') : `${product?.unbondingDays}d`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1, padding: 10, margin: 0 }} disabled={m.isPending || !amount}>
          <Icon name="fp" size={12} color="#fff" />
          {m.isPending ? t('earn.unstaking') : t('earn.unstakeBtn')}
        </button>
      </div>
    </PhoneShell>
  )
}
