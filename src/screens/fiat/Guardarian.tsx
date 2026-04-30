import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES, routeFor } from '../../routes'

export function Guardarian() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const orderId = (loc.state as { orderId?: string } | null)?.orderId

  useEffect(() => {
    if (!orderId) {
      nav(ROUTES['route.fiat.buy'].path, { replace: true })
      return
    }
    const tm = setTimeout(() => {
      nav(routeFor('route.fiat.status', { orderId }), { replace: true })
    }, 3500)
    return () => clearTimeout(tm)
  }, [orderId, nav])

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} color="var(--text-mid-50)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>guardarian.com</div>
          <div className="t3"><span className="grn">🔒</span> {t('buy.secureCheckout')}</div>
        </div>
        <Icon name="refresh" size={14} />
      </div>

      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,82,255,.08), rgba(27,140,62,.04))' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0066ff', letterSpacing: 2 }}>{t('buy.guardarianPay')}</div>
        <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 800, marginTop: 8 }}>{t('buy.orderHash', { id: orderId?.slice(-9) ?? '——' })}</div>
        <div className="t2">{t('buy.cryptoPurchase')}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('buy.cardDetails')}</h3>
      <div className="g" style={{ padding: 14 }}>
        <div className="t3">{t('buy.cardNumber')}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-strong)', marginTop: 4, letterSpacing: 2 }}>4821 •••• •••• ••••</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="t3">{t('buy.expires')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-strong)', marginTop: 2, fontWeight: 700 }}>12 / 28</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="t3">{t('buy.cvv')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-strong)', marginTop: 2, fontWeight: 700 }}>•••</div>
          </div>
        </div>
      </div>

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">🔐</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="grn">{t('buy.threeDSecure')}</span> {t('buy.processingPayment')}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, marginTop: 16 }}>
        <div className="ic" style={{ width: 60, height: 60, animation: 'orb-pulse 1.4s ease-in-out infinite alternate' }}>
          <Icon name="lock" size={28} />
        </div>
        <div className="t2" style={{ marginTop: 12 }}>{t('buy.authorizingPayment')}</div>
        <div className="bar" style={{ marginTop: 8, width: 120 }}>
          <div className="fl" style={{ width: '65%' }} />
        </div>
      </div>

      <div className="t3" style={{ textAlign: 'center', marginTop: 12 }}>{t('buy.poweredByGuardarian')}</div>
    </PhoneShell>
  )
}
