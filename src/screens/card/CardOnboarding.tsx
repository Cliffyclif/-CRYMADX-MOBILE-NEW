import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { CardFace } from '../../components/CardFace'
import { CardKYCModal } from '../../components/CardKYCModal'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { useAuth } from '../../stores/auth'
import { ROUTES } from '../../routes'

export function CardOnboarding() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)

  const { data: kyc } = useEndpoint<{ status?: string }>('api.card.kyc.status', {}, { refetchOnWindowFocus: false })
  const initKyc = useEndpointMutation<{ body?: unknown }, { kycUrl?: string; success?: boolean; error?: string }>('api.card.kyc.init')
  const create = useEndpointMutation('api.card.apply', { invalidates: ['api.card.get', 'api.card.kyc.status'] })

  const [kycUrl, setKycUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const verified = ['COMPLETED', 'APPROVED'].includes((kyc?.status || '').toUpperCase())

  const PERKS = [
    ['💳', t('card.perk1'), t('card.perk1Sub')],
    ['🎁', t('card.perk2'), t('card.perk2Sub')],
    ['🚫', t('card.perk3'), t('card.perk3Sub')],
    ['⚡', t('card.perk4'), t('card.perk4Sub')],
  ]

  // Step 1: open AlchemyPay KYC (PageMode) in the in-app modal.
  const startKyc = async () => {
    try {
      const res = await initKyc.mutateAsync({})
      if (!res?.kycUrl) throw new Error(res?.error || 'No verification URL returned')
      setKycUrl(res.kycUrl)
      setModalOpen(true)
    } catch (e) {
      toast.error((e as Error).message || 'Could not start verification. Please try again.')
    }
  }

  // Step 2 (after KYC): issue the card.
  const createCard = async () => {
    try {
      await create.mutateAsync({
        body: {
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          depositAmount: 10,
        },
      })
      toast.success('Card created!')
      nav(ROUTES['route.card.hub'].path, { replace: true })
    } catch (e) {
      toast.error((e as Error).message || 'Could not create the card.')
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('card.cardName')} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ margin: '8px 0 14px' }}>
          <CardFace last4="••••" cardholderName={(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().toUpperCase()) || 'CARDHOLDER NAME'} size="medium" />
        </div>

        <div className="t2" style={{ textAlign: 'center', lineHeight: 1.5, padding: '0 16px' }}>
          {t('card.spendAnywhere')}
        </div>

        <div className="g" style={{ padding: 12, marginTop: 14, width: '100%' }}>
          {PERKS.map(([e, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, margin: '7px 0', alignItems: 'center' }}>
              <span style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 16, lineHeight: 1 }}>{e}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 700 }}>{title}</div>
                <div className="t3">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {verified ? (
          <>
            <div className="g" style={{ padding: 10, marginTop: 8, width: '100%', borderLeft: '3px solid var(--gl)', background: 'rgba(0,200,83,.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="grn">✓</span>
              <div className="t3" style={{ lineHeight: 1.4 }}>
                Identity verified. A one-time <strong style={{ color: 'var(--text-strong)' }}>$20 issuance fee</strong> + <strong style={{ color: 'var(--text-strong)' }}>$10</strong> starting balance applies.
              </div>
            </div>
            <button className="btn btn-g" style={{ width: '100%', marginTop: 8 }} onClick={createCard} disabled={create.isPending}>
              {create.isPending ? t('card.applying') : 'Create my card'}
            </button>
          </>
        ) : (
          <>
            <div className="g" style={{ padding: 8, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)', width: '100%' }}>
              <span className="gld">⚠</span>
              <div className="t3" style={{ lineHeight: 1.4 }}>
                <span className="gld">{t('card.kycRequired')}</span> {t('card.kycInfo')}
              </div>
            </div>
            <button className="btn btn-g" style={{ width: '100%', marginTop: 8 }} onClick={startKyc} disabled={initKyc.isPending}>
              {initKyc.isPending ? t('card.applying') : t('card.applyForCard')}
            </button>
          </>
        )}
      </div>

      <CardKYCModal
        isOpen={modalOpen}
        kycUrl={kycUrl || ''}
        onClose={() => setModalOpen(false)}
        onComplete={() => { /* status poll flips the screen to the create step */ }}
        onRejected={() => { /* modal shows the rejected state */ }}
      />
    </PhoneShell>
  )
}
