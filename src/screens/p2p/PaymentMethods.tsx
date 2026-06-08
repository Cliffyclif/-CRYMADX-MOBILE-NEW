import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import type { P2PPaymentMethod } from '../../mock/db'

const TYPE_ICON: Record<string, IconName> = {
  bank: 'card', wise: 'globe', 'mobile-money': 'phone', other: 'plus',
}

// Each add option maps to the backend's payment-method shape + the detail it needs.
type AddOption = {
  icon: IconName
  name: string
  type: string            // backend type
  detailLabel: string     // what to ask for
  detailKey: string       // details.<key> sent to backend
  bankName?: boolean      // bank-name field (banks)
  editableProvider?: boolean
}
const ADD_OPTIONS: AddOption[] = [
  { icon: 'card', name: 'Bank', type: 'bank_transfer', detailLabel: 'Account number', detailKey: 'accountNumber', bankName: true, editableProvider: true },
  { icon: 'phone', name: 'OPay', type: 'other', detailLabel: 'Phone number', detailKey: 'phoneNumber' },
  { icon: 'phone', name: 'PalmPay', type: 'other', detailLabel: 'Phone number', detailKey: 'phoneNumber' },
  { icon: 'card', name: 'Wise', type: 'wise', detailLabel: 'Email', detailKey: 'email' },
  { icon: 'globe', name: 'Revolut', type: 'revolut', detailLabel: 'Email or @username', detailKey: 'email' },
  { icon: 'plus', name: 'Other', type: 'other', detailLabel: 'Account details', detailKey: 'accountNumber', editableProvider: true },
]

export function PaymentMethods() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ items: P2PPaymentMethod[] }>('api.p2p.payments.list')
  const [adding, setAdding] = useState<AddOption | null>(null)

  const items = data?.items ?? []
  const verified = items.filter(m => m.status === 'verified')
  const pending = items.filter(m => m.status === 'pending')

  return (
    <PhoneShell noTabs>
      <ScreenHeader
        title={t('p2p.paymentMethodsTitle')}
        actions={
          <button onClick={() => setAdding(ADD_OPTIONS[0])} aria-label="Add payment method" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }}>
            <Icon name="plus" size={18} color="var(--gl)" />
          </button>
        }
      />
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
        {ADD_OPTIONS.map(opt => (
          <button key={opt.name} onClick={() => setAdding(opt)} className="g" style={{ padding: 10, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
            <div className="ic" style={{ width: 30, height: 30, margin: '0 auto' }}><Icon name={opt.icon} size={14} /></div>
            <div className="t2" style={{ marginTop: 4 }}>{opt.name}</div>
          </button>
        ))}
      </div>

      {adding && <AddMethodSheet option={adding} onClose={() => setAdding(null)} />}
    </PhoneShell>
  )
}

function AddMethodSheet({ option, onClose }: { option: AddOption; onClose: () => void }) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  const create = useEndpointMutation('api.p2p.payments.create', { invalidates: ['api.p2p.payments.list'] })

  const [provider, setProvider] = useState(option.editableProvider ? '' : option.name)
  const [holder, setHolder] = useState('')
  const [detail, setDetail] = useState('')
  const [currency, setCurrency] = useState('NGN')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const label = (provider || option.name).trim()
  const valid = label && holder.trim() && detail.trim()

  const submit = async () => {
    if (!valid) { toast.error('Please fill in all fields'); return }
    try {
      await create.mutateAsync({
        body: {
          type: option.type,
          label,
          fiatCurrency: currency,
          details: {
            accountHolderName: holder.trim(),
            [option.detailKey]: detail.trim(),
            ...(option.bankName ? { bankName: label } : {}),
          },
          isDefault: false,
        },
      })
      toast.success('Payment method added — pending verification')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Could not add payment method')
    }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Add ${option.name}`} data-no-swipe-back
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '88vh', background: 'var(--bg)',
          borderRadius: '20px 20px 0 0', padding: '12px 14px calc(16px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)', display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`, transition: dismiss.dragging ? 'none' : 'transform .18s ease-out', touchAction: 'pan-y',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="ic" style={{ width: 32, height: 32 }}><Icon name={option.icon} size={15} color="var(--gl)" /></div>
          <h3 style={{ flex: 1, margin: 0 }}>Add {option.name}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {option.editableProvider && (
            <Field label={option.bankName ? 'Bank name' : 'Provider'} value={provider} onChange={setProvider} placeholder={option.bankName ? 'e.g. Access Bank' : 'e.g. Skrill'} />
          )}
          <Field label="Account holder name" value={holder} onChange={setHolder} placeholder="As it appears on the account" />
          <Field label={option.detailLabel} value={detail} onChange={setDetail} placeholder={option.detailLabel} />
          <div>
            <div className="t3" style={{ marginBottom: 4 }}>Currency</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['NGN', 'USD', 'EUR', 'GBP'].map(c => (
                <button key={c} type="button" onClick={() => setCurrency(c)} className="badge" style={{ flex: 1, cursor: 'pointer', border: 'none', padding: 8, background: currency === c ? 'var(--g)' : 'var(--surface-soft)', color: currency === c ? '#fff' : 'var(--text-mid-50)' }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-g" style={{ marginTop: 14 }} onClick={submit} disabled={create.isPending || !valid}>
          {create.isPending ? 'Adding…' : 'Add Method'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div className="t3" style={{ marginBottom: 4 }}>{label}</div>
      <div className="inp"><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', minWidth: 0 }} /></div>
    </div>
  )
}
