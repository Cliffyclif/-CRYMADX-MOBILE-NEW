import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { CardFace } from '../../components/CardFace'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { CardSettings } from '../../mock/db'

/**
 * CardHub — entry point for the card programme.
 *  • No card yet → send the user into the apply + AlchemyPay KYC flow.
 *  • Card exists → live hub: card face, balance, and actions.
 */
export function CardHub() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data, isLoading } = useEndpoint<{ hasCard?: boolean; card?: CardSettings } & Partial<CardSettings>>('api.card.get')

  if (isLoading && !data) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('card.cardName')} />
        <div className="g" style={{ padding: 24, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('common.loading') || 'Loading…'}</div>
        </div>
      </PhoneShell>
    )
  }

  // The backend returns either { hasCard, card } or a bare card object.
  const card = (data?.card ?? (data as CardSettings | undefined)) as CardSettings | undefined
  const hasCard = !!(
    data?.hasCard ??
    (card?.cardLast4 && card.cardLast4 !== '0000' && card.status && card.status !== 'awaiting-kyc')
  )

  // No card → apply flow (with the AlchemyPay KYC modal).
  if (!hasCard) return <Navigate to={ROUTES['route.card.onboarding'].path} replace />

  const frozen = card?.status === 'frozen'

  const actions: Array<{ icon: IconName; label: string; routeId: keyof typeof ROUTES; tone?: boolean }> = [
    { icon: 'zap', label: t('card.topupTitle') || 'Top up', routeId: 'route.card.topup', tone: true },
    { icon: 'clock', label: t('card.transactions') || 'Transactions', routeId: 'route.card.transactions' },
    { icon: 'settings', label: t('card.settings') || 'Settings', routeId: 'route.card.settings' },
  ]

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('card.cardName')} />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, position: 'relative' }}>
        <CardFace last4={card?.cardLast4 ?? '----'} cardholderName={card?.cardholderName ?? ''} size="medium" />
        {frozen && (
          <span style={{ position: 'absolute', top: 8, right: 18, fontSize: 9, padding: '4px 10px', borderRadius: 999, background: 'rgba(96,165,250,.18)', color: '#60a5fa', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid rgba(96,165,250,.35)' }}>
            Frozen
          </span>
        )}
      </div>

      {/* Balance */}
      <div className="g" style={{ padding: 16, marginTop: 14, textAlign: 'center' }}>
        <div className="t3">{t('card.cardBalance') || 'Card balance'}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>
          ${card?.balance ?? '0.00'} <span style={{ fontSize: 15, color: 'var(--text-mid-40)' }}>{card?.balanceCurrency ?? 'USD'}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        {actions.map(a => (
          <button
            key={a.routeId}
            onClick={() => nav(ROUTES[a.routeId].path)}
            className="g"
            style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 6, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: a.tone ? 'rgba(0,200,83,.08)' : undefined }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,200,83,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.icon} size={18} color="var(--gl)" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)' }}>{a.label}</div>
          </button>
        ))}
      </div>
    </PhoneShell>
  )
}
