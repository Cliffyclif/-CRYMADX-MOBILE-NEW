import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function CompleteProfile() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [firstName, setFirstName] = useState('Joseph')
  const [lastName, setLastName] = useState('Obasi')
  const [country, setCountry] = useState('Nigeria')
  const [phone, setPhone] = useState('+234 801 234 5678')
  const [referral, setReferral] = useState('')
  const m = useEndpointMutation('api.auth.complete-profile')

  const submit = async () => {
    await m.mutateAsync({ body: { firstName, lastName, country, phone, referral } })
    nav(ROUTES['route.tab.home'].path, { replace: true })
  }

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <ScreenHeader title={t('auth.completeProfile')} onBack={() => nav(ROUTES['route.auth.verify-email'].path)} />
      <div className="auth-card" style={{ marginTop: 8 }}>
        <div className="t2" style={{ textAlign: 'center' }}>{t('auth.step3of3')}</div>

        <div className="steps" style={{ marginTop: 10 }}>
          <div className="step"><div className="sn d">✓</div><div className="st">{t('auth.stepEmail')}</div></div>
          <div className="step"><div className="sn d">✓</div><div className="st">{t('auth.stepVerify')}</div></div>
          <div className="step"><div className="sn a">3</div><div className="st">{t('auth.stepProfile')}</div></div>
        </div>

        <Field label={t('auth.firstName')} value={firstName} onChange={setFirstName} />
        <Field label={t('auth.lastName')}  value={lastName}  onChange={setLastName} />
        <Field label={t('auth.country')}   value={country}   onChange={setCountry}  icon="flag" />
        <Field label={t('auth.phone')}     value={phone}     onChange={setPhone} />
        <Field label={t('auth.referralPlaceholder')} value={referral} onChange={setReferral} icon="share" />

        <button className="btn btn-g" style={{ marginTop: 14 }} onClick={submit} disabled={m.isPending}>
          {m.isPending ? t('auth.savingDots') : t('common.continue')}
        </button>
        <div className="t2" style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.tab.home'].path, { replace: true })}>{t('auth.skipReferral')}</span>
        </div>
      </div>
    </PhoneShell>
  )
}

function Field({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: 'flag' | 'share' }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <div className="inp">
        {icon && <Icon name={icon} size={14} />}
        <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, color: 'var(--text-strong)' }} />
      </div>
    </div>
  )
}
