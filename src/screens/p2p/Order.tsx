import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { P2POrder } from '../../mock/db'

export function Order() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { orderId = '' } = useParams()
  const { data: order } = useEndpoint<P2POrder>('api.p2p.order.get', { pathParams: { orderId } })
  const markPaid = useEndpointMutation('api.p2p.order.markpaid', { invalidates: ['api.p2p.order.get'] })
  const dispute = useEndpointMutation('api.p2p.order.dispute', { invalidates: ['api.p2p.order.get'] })
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!order) return
    const remaining = Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000))
    setSecondsLeft(remaining)
    const tm = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(tm)
  }, [order?.expiresAt, order])

  if (!order) return <PhoneShell noTabs><ScreenHeader title={t('p2p.ordersTitle')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const expired = secondsLeft <= 0

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('p2p.orderHash', { id: order.id.slice(-7) })} actions={<span className={`badge badge-${order.status === 'pending-payment' ? 'gd' : order.status === 'released' ? 'g' : 'r'}`} style={{ fontSize: 10 }}>{order.status === 'pending-payment' ? t('p2p.payNow') : order.status.toUpperCase().replace('-', ' ')}</span>} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="t3">{t('p2p.paySellerWithin')}</div>
        <div className={expired ? 'red' : 'grn'} style={{ fontSize: 30, fontWeight: 800, margin: '4px 0' }}>{mins}:{secs.toString().padStart(2, '0')}</div>
        <div className="t2">{t('p2p.willRelease', { name: order.counterpartyName })}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('p2p.youBuy'), `${order.cryptoAmount} ${order.cryptoAsset}`],
          [t('p2p.youPay'), `₦${order.fiatAmount}`],
          [t('p2p.rate'), `₦${order.rate} / ${order.cryptoAsset}`],
          [t('p2p.method'), order.paymentMethod],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      {order.bankName && (
        <div className="g" style={{ padding: 10, marginTop: 6, background: 'rgba(212,165,60,.06)', borderLeft: '3px solid var(--gd)' }}>
          <div className="gld" style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t('p2p.sendToAccount')}</div>
          {[
            [t('p2p.bank'), order.bankName],
            [t('p2p.account'), order.accountNumber!],
            [t('p2p.name'), order.accountName!],
            [t('p2p.reference'), order.reference],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '2px 0' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 10 }}>{t('p2p.orderTimeline')}</h3>
      {order.timeline.map((step, i) => {
        const tint = step.tone === 'g' ? '0,200,83' : step.tone === 'gd' ? '212,165,60' : step.tone === 'r' ? '239,68,68' : '255,255,255'
        const color = step.tone === 'g' ? 'var(--gl)' : step.tone === 'gd' ? 'var(--gd)' : step.tone === 'r' ? 'var(--r)' : 'var(--text-mid-40)'
        return (
          <div key={i} className="li" style={{ padding: 8 }}>
            <div className="li-i" style={{ width: 24, height: 24, background: `rgba(${tint},.1)` }}>
              <Icon name={step.icon as IconName} size={12} color={color} />
            </div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{step.title}</div>
              <div className="li-s">{step.detail}</div>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => nav(routeFor('route.p2p.chat', { orderId: order.id }))}>
          <Icon name="msg" size={12} /> {t('p2p.chatBtn')}
        </button>
        {order.status === 'pending-payment' && (
          <button className="btn btn-g" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => markPaid.mutate({ pathParams: { orderId: order.id } })} disabled={markPaid.isPending}>
            {markPaid.isPending ? t('p2p.marking') : t('p2p.ivePaid')}
          </button>
        )}
      </div>
      <button className="btn btn-r" style={{ marginTop: 6 }} onClick={() => dispute.mutate({ pathParams: { orderId: order.id } })} disabled={dispute.isPending}>
        {t('p2p.cancelDispute')}
      </button>
    </PhoneShell>
  )
}
