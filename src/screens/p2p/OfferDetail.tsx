import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { P2POffer, P2POrder } from '../../mock/db'

export function OfferDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { offerId = '' } = useParams()
  const { data: offer } = useEndpoint<P2POffer>('api.p2p.offer.get', { pathParams: { offerId } })
  const [fiatAmount, setFiatAmount] = useState('')
  const create = useEndpointMutation<{ body: { offerId: string; fiatAmount: string } }, P2POrder>('api.p2p.order.create', { invalidates: ['api.p2p.offers.list'] })

  if (!offer) return <PhoneShell noTabs><ScreenHeader title={t('p2p.offerDetailTitle')} /><div className="g" style={{ padding: 16 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const cryptoAmount = fiatAmount ? (parseFloat(fiatAmount) / parseFloat(offer.price)).toFixed(2) : '0'
  const valid = fiatAmount && parseFloat(fiatAmount) >= parseFloat(offer.minLimit) * parseFloat(offer.price) && parseFloat(fiatAmount) <= parseFloat(offer.maxLimit) * parseFloat(offer.price)

  const placeOrder = async () => {
    const order = await create.mutateAsync({ body: { offerId, fiatAmount } })
    nav(routeFor('route.p2p.order', { orderId: order.id }))
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('p2p.offerDetailTitle')} />

      <div className="g" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: 'linear-gradient(135deg, var(--g), var(--gl))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{offer.sellerInitial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 18, color: 'var(--text-strong)', fontWeight: 800 }}>
              {offer.sellerName}
              {offer.verified && <span className="badge badge-g" style={{ fontSize: 8 }}>{t('p2p.verifiedBadge')}</span>}
            </div>
            <div className="t3">{t('p2p.stats', { rep: offer.reputationPct, trades: offer.reputationCount, minutes: offer.avgReleaseMin })}</div>
            <div className="t3">{offer.online ? <><span className="grn">●</span> {t('p2p.onlineNow')}</> : t('p2p.offline')}</div>
          </div>
          <Icon name="share" size={14} />
        </div>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="t3">{t('p2p.buyAt', { asset: offer.asset })}</div>
            <div className="grn" style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>₦{offer.price}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="t3">{t('p2p.available')}</div>
            <div style={{ color: 'var(--text-strong)', fontSize: 18, fontWeight: 700, marginTop: 2 }}>{offer.available} {offer.asset}</div>
          </div>
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('p2p.limit'), `${offer.minLimit} - ${offer.maxLimit} ${offer.asset}`],
          [t('p2p.timeLimit'), t('p2p.fifteenMinutes')],
          [t('p2p.trades'), t('p2p.tradesSummary', { count: offer.reputationCount, pct: offer.reputationPct })],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 8 }}>{t('p2p.paymentMethodsTitle')}</h3>
      {offer.paymentMethods.map(p => (
        <div key={p} className="li" style={{ padding: 8 }}>
          <div className="li-i" style={{ width: 26, height: 26, background: 'rgba(0,200,83,.1)' }}><Icon name="card" size={12} /></div>
          <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{p}</div></div>
        </div>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('p2p.amountHeader')}</h3>
      <div className="g" style={{ padding: 12 }}>
        <div className="inp" style={{ padding: 10 }}>
          <span className="t3">₦</span>
          <input type="number" inputMode="decimal" value={fiatAmount} onChange={e => setFiatAmount(e.target.value)} placeholder={`${parseFloat(offer.minLimit) * parseFloat(offer.price)} - ${parseFloat(offer.maxLimit) * parseFloat(offer.price)}`} style={{ flex: 1, color: 'var(--text-strong)', fontSize: 14, fontWeight: 700 }} />
        </div>
        <div className="t3" style={{ marginTop: 4 }}>{t('p2p.youReceiveAmount', { amount: cryptoAmount, asset: offer.asset })}</div>
      </div>

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={placeOrder} disabled={!valid || create.isPending}>
        {create.isPending ? t('p2p.placing') : t('p2p.buyAmount', { amount: cryptoAmount, asset: offer.asset })}
      </button>
    </PhoneShell>
  )
}
