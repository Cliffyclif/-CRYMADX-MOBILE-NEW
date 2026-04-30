import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { FiatOrder } from '../../mock/db'

export function FiatOrderStatus() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { orderId = '' } = useParams()
  const { data: order, refetch, isFetching } = useEndpoint<FiatOrder>('api.fiat.order.status', { pathParams: { orderId } }, { refetchInterval: 1500 })

  if (!order) {
    return <PhoneShell noTabs><ScreenHeader title={t('buy.orderStatusTitle')} /><div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }

  // Defensive: backend may omit any of these. Use the URL :orderId as a final
  // fallback for the display id so we never crash on a missing field.
  const displayId = String(order.id ?? orderId ?? '').slice(-9) || '—'
  const status = order.status ?? 'pending'
  const cryptoAsset = order.cryptoAsset ?? ''
  const cryptoAmount = order.cryptoAmount ?? '0'
  const fiatAmount = order.fiatAmount ?? '0'
  const fiatCurrency = order.fiatCurrency ?? ''
  const fee = order.fee ?? '0'
  const createdAtIso = order.createdAt ?? new Date().toISOString()
  const completedAtIso = (order as any).completedAt as string | null | undefined

  const statusColor = status === 'completed' ? 'g' : status === 'failed' ? 'r' : 'gd'
  const statusIcon: IconName = status === 'completed' ? 'check' : status === 'failed' ? 'x' : 'clock'
  const statusBg = status === 'completed' ? 'rgba(0,200,83,.15)' : status === 'failed' ? 'rgba(239,68,68,.15)' : 'rgba(212,165,60,.15)'
  const statusGlow = status === 'completed' ? '0 0 20px rgba(0,200,83,.2)' : status === 'failed' ? '0 0 20px rgba(239,68,68,.2)' : '0 0 20px rgba(212,165,60,.2)'

  const safeDate = (s?: string | null): string => {
    if (!s) return '—'
    try { return new Date(s).toLocaleString() } catch { return '—' }
  }
  const timeline: Array<[boolean, string, string]> = [
    [true, t('buy.tlOrderPlaced'), safeDate(createdAtIso)],
    [status !== 'pending', t('buy.tlPayment'), status !== 'pending' ? safeDate(createdAtIso) : '—'],
    [status === 'completed', t('buy.tlSent', { asset: cryptoAsset }), safeDate(completedAtIso)],
    [status === 'completed', t('buy.tlConfirmed'), safeDate(completedAtIso)],
  ]
  const totalReceived = (() => {
    const f = parseFloat(fiatAmount) || 0
    const fe = parseFloat(fee) || 0
    return (f - fe).toFixed(2)
  })()

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('buy.orderStatusTitle')} />

      <div className="g" style={{ padding: 14, textAlign: 'center', background: order.status === 'completed' ? 'rgba(0,200,83,.05)' : 'transparent' }}>
        <div className="ic" style={{ width: 64, height: 64, margin: '0 auto', background: statusBg, boxShadow: statusGlow }}>
          <Icon name={statusIcon} size={32} />
        </div>
        <div className={`badge badge-${statusColor}`} style={{ marginTop: 8, fontSize: 11 }}>{status.toUpperCase()}</div>
        <h2 style={{ marginTop: 6 }}>{t('buy.orderHash', { id: displayId })}</h2>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gl)', marginTop: 6 }}>{cryptoAmount} {cryptoAsset}</div>
        <div className="t2">≈ ${totalReceived} {status === 'completed' ? t('buy.deliveredToWallet') : ''}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('buy.timeline')}</h3>
      {timeline.map(([done, label, d], i) => (
        <div key={i} className="li">
          <div className="li-i" style={{ background: done ? 'rgba(0,200,83,.1)' : 'var(--surface-soft)' }}>
            <Icon name={done ? 'check' : 'clock'} size={12} color={done ? 'var(--gl)' : 'var(--text-mid-30)'} />
          </div>
          <div className="li-c">
            <div className="li-n" style={{ color: done ? 'var(--text-strong)' : 'var(--text-mid-40)' }}>{label}</div>
            <div className="li-s">{d}</div>
          </div>
        </div>
      ))}

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('buy.orderIdLabel'), `#${displayId}`],
          [t('buy.youPaid'), `$${fiatAmount} ${fiatCurrency}`],
          [t('buy.serviceFeeShort'), `$${fee}`],
          [t('buy.totalReceived'), `${cryptoAmount} ${cryptoAsset}`],
          [t('common.date'), safeDate(createdAtIso)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      {status === 'pending' && (
        <button className="btn btn-o" style={{ marginTop: 8 }} onClick={() => refetch()} disabled={isFetching}>
          <Icon name="refresh" size={12} /> {isFetching ? t('buy.checkingDots') : t('common.refresh')}
        </button>
      )}

      {status === 'completed' && (
        <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => nav(ROUTES['route.fiat.buy'].path)}>{t('buy.buyMore')}</button>
      )}
    </PhoneShell>
  )
}
