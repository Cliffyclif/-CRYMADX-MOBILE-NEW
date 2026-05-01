import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { haptics } from '../../lib/haptics'

/**
 * Final step of registration: collect display name + phone + country
 * BEFORE the user lands on the dashboard. Hits the same endpoint the
 * website uses (PATCH /user/profile) — same shape (snake_case fields).
 *
 * The previous version hardcoded fake placeholder values ("Joseph Obasi",
 * "Nigeria", "+234 801 234 5678") that the user had to delete before
 * typing their own info. Defaults are now empty.
 */
export function CompleteProfile() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [referral, setReferral] = useState('')
  const [error, setError] = useState<string | null>(null)

  const update = useEndpointMutation<
    { body: { fullName: string; phone?: string; country?: string } },
    unknown
  >('api.user.profile.update')
  const applyReferral = useEndpointMutation<{ body: { referralCode: string } }, unknown>(
    'api.referral.apply',
  )

  const submit = async () => {
    setError(null)
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    try {
      await update.mutateAsync({
        body: {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          country: country.trim() || undefined,
        },
      })

      // Optionally apply a referral code — done as a separate call so a
      // bad referral doesn't roll back the profile update.
      if (referral.trim()) {
        try {
          await applyReferral.mutateAsync({ body: { referralCode: referral.trim() } })
        } catch (e: any) {
          // Non-fatal: profile saved, referral didn't apply.
          toast.error(e?.message ?? 'Referral code not applied')
        }
      }

      haptics.success()
      toast.success('Profile saved')
      nav(ROUTES['route.tab.home'].path, { replace: true })
    } catch (err: any) {
      haptics.error()
      setError(err?.message ?? 'Could not save profile')
    }
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

        <Field
          label={t('auth.fullName') || 'Full name'}
          value={fullName}
          onChange={setFullName}
          icon="user"
          placeholder="John Smith"
          autoFocus
          required
        />
        <Field
          label={t('auth.country') || 'Country'}
          value={country}
          onChange={setCountry}
          icon="globe"
          placeholder="Nigeria"
        />
        <Field
          label={t('auth.phone') || 'Phone (optional)'}
          value={phone}
          onChange={setPhone}
          icon="phone"
          placeholder="+234 901 686 1516"
        />
        <Field
          label={t('auth.referralPlaceholder') || 'Referral code (optional)'}
          value={referral}
          onChange={setReferral}
          icon="share"
          placeholder="ABC12345"
        />

        {error && (
          <div
            className="g"
            style={{
              padding: 10,
              marginTop: 10,
              borderLeft: '3px solid var(--r)',
              color: 'var(--r)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-g"
          style={{ marginTop: 14 }}
          onClick={submit}
          disabled={update.isPending || !fullName.trim()}
        >
          {update.isPending ? (t('auth.savingDots') || 'Saving…') : (t('common.continue') || 'Continue')}
        </button>
        <div className="t2" style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>
          <span
            className="grn"
            style={{ cursor: 'pointer' }}
            onClick={() => nav(ROUTES['route.tab.home'].path, { replace: true })}
          >
            {t('auth.skipForNow') || 'Skip for now'}
          </span>
        </div>
      </div>
    </PhoneShell>
  )
}

function Field({
  label,
  value,
  onChange,
  icon,
  placeholder,
  autoFocus,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: 'user' | 'globe' | 'phone' | 'share'
  placeholder?: string
  autoFocus?: boolean
  required?: boolean
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>
        {label}
        {required && <span style={{ color: 'var(--r)', marginLeft: 4 }}>*</span>}
      </div>
      <div className="inp">
        {icon && <Icon name={icon} size={14} />}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          style={{ flex: 1, color: 'var(--text-strong)' }}
        />
      </div>
    </div>
  )
}
