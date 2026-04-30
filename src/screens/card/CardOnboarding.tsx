import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { CardFace } from '../../components/CardFace'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function CardOnboarding() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const apply = useEndpointMutation('api.card.apply', { invalidates: ['api.card.get'] })

  const PERKS = [
    ['💳', t('card.perk1'), t('card.perk1Sub')],
    ['🎁', t('card.perk2'), t('card.perk2Sub')],
    ['🚫', t('card.perk3'), t('card.perk3Sub')],
    ['⚡', t('card.perk4'), t('card.perk4Sub')],
  ]

  const onApply = async () => {
    await apply.mutateAsync({})
    nav(ROUTES['route.card.hub'].path, { replace: true })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ marginBottom: 14 }}>
          <CardFace last4="••••" cardholderName="CARDHOLDER NAME" size="medium" />
        </div>

        <h2>{t('card.cardName')}</h2>
        <div className="t2" style={{ textAlign: 'center', marginTop: 6, lineHeight: 1.5, padding: '0 16px' }}>
          {t('card.spendAnywhere')}
        </div>

        <div className="g" style={{ padding: 12, marginTop: 14, width: '100%' }}>
          {PERKS.map(([e, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 8, margin: '5px 0', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{e}</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 700 }}>{title}</div>
                <div className="t3">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="g" style={{ padding: 8, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)', width: '100%' }}>
          <span className="gld">⚠</span>
          <div className="t3" style={{ lineHeight: 1.4 }}>
            <span className="gld">{t('card.kycRequired')}</span> {t('card.kycInfo')}
          </div>
        </div>

        <button className="btn btn-g" style={{ width: '100%', marginTop: 8 }} onClick={onApply} disabled={apply.isPending}>
          {apply.isPending ? t('card.applying') : t('card.applyForCard')}
        </button>
      </div>
    </PhoneShell>
  )
}
