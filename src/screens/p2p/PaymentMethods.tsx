import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import type { P2PPaymentMethod } from '../../mock/db'

const TYPE_ICON: Record<string, IconName> = {
  bank: 'card', wise: 'globe', 'mobile-money': 'phone', other: 'plus',
}

const ADD_OPTIONS: Array<[IconName, string]> = [
  ['card', 'Bank'], ['phone', 'OPay'], ['phone', 'PalmPay'],
  ['card', 'Wise'], ['globe', 'Revolut'], ['plus', 'Other'],
]

export function PaymentMethods() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ items: P2PPaymentMethod[] }>('api.p2p.payments.list')

  const items = data?.items ?? []
  const verified = items.filter(m => m.status === 'verified')
  const pending = items.filter(m => m.status === 'pending')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('p2p.paymentMethodsTitle')} actions={<Icon name="plus" size={16} color="var(--gl)" />} />
      <div className="t2">{t('p2p.forP2PWithdrawals')}</div>

      {verified.length > 0 && <>
        <div className="t3" style={{ margin: '8px 0 4px', fontWeight: 700 }}>{t('p2p.verifiedMethods')}</div>
        {verified.map(m => (
          <div key={m.id} className="li">
            <div className="li-i"><Icon name={TYPE_ICON[m.type] ?? 'card'} size={16} /></div>
            <div className="li-c">
              <div className="li-n">{m.label}</div>
              <div className="li-s">{m.accountName} · {m.fiatCurrency}</div>
            </div>
            <div className="li-r"><div className="badge badge-g" style={{ fontSize: 9 }}>{t('p2p.verifiedTickBadge')}</div></div>
          </div>
        ))}
      </>}

      {pending.length > 0 && <>
        <div className="t3" style={{ margin: '8px 0 4px', fontWeight: 700 }}>{t('p2p.pendingMethods')}</div>
        {pending.map(m => (
          <div key={m.id} className="li">
            <div className="li-i" style={{ background: 'rgba(212,165,60,.1)' }}><Icon name={TYPE_ICON[m.type] ?? 'card'} size={16} color="var(--gd)" /></div>
            <div className="li-c">
              <div className="li-n">{m.label}</div>
              <div className="li-s">{t('p2p.codeSentSms')}</div>
            </div>
            <div className="li-r"><div className="badge badge-gd" style={{ fontSize: 9 }}>{t('p2p.verifyBadge')}</div></div>
          </div>
        ))}
      </>}

      <h3 style={{ marginTop: 10 }}>{t('p2p.addMethodTitle')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 }}>
        {ADD_OPTIONS.map(([icon, name]) => (
          <button key={name} className="g" style={{ padding: 10, textAlign: 'center', cursor: 'pointer' }}>
            <div className="ic" style={{ width: 30, height: 30, margin: '0 auto' }}><Icon name={icon} size={14} /></div>
            <div className="t2" style={{ marginTop: 4 }}>{name}</div>
          </button>
        ))}
      </div>
    </PhoneShell>
  )
}
