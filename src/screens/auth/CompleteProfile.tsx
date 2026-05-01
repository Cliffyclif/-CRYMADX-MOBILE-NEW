import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { CountryPicker } from '../../components/CountryPicker'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { COUNTRIES, flagEmoji, type Country } from '../../data/countries'

export function CompleteProfile() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState<Country | null>(null)
  const [dialCountry, setDialCountry] = useState<Country | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState<null | 'country' | 'dial'>(null)
  const m = useEndpointMutation('api.user.profile.update')

  const submit = async () => {
    setError(null)
    const fullName = `${firstName} ${lastName}`.trim()
    const cleanedPhone = phone.replace(/[^\d]/g, '')
    const e164 = dialCountry && cleanedPhone ? `+${dialCountry.dial}${cleanedPhone}` : cleanedPhone
    const body: Record<string, string> = {}
    if (fullName.length >= 2) body.fullName = fullName
    if (e164) body.phone = e164
    if (country) body.country = country.name
    try {
      await m.mutateAsync({ body })
      nav(ROUTES['route.tab.home'].path, { replace: true })
    } catch (e) {
      setError((e as Error).message)
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

        <Field label={t('auth.firstName')} value={firstName} onChange={setFirstName} />
        <Field label={t('auth.lastName')}  value={lastName}  onChange={setLastName} />

        {/* Country dropdown */}
        <div style={{ marginTop: 6 }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('auth.country')}</div>
          <button
            type="button"
            onClick={() => setPickerOpen('country')}
            className="inp"
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {country ? (
              <>
                <span style={{ fontSize: 18 }}>{flagEmoji(country.code)}</span>
                <span style={{ flex: 1, color: 'var(--text-strong)' }}>{country.name}</span>
              </>
            ) : (
              <span style={{ flex: 1, color: 'var(--text-mid-40)' }}>Select country</span>
            )}
            <span style={{ color: 'var(--text-mid-40)', fontSize: 12 }}>▾</span>
          </button>
        </div>

        {/* Phone with dial-code prefix picker */}
        <div style={{ marginTop: 6 }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('auth.phone')}</div>
          <div className="inp" style={{ padding: 0, gap: 0 }}>
            <button
              type="button"
              onClick={() => setPickerOpen('dial')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 10px',
                background: 'transparent', border: 'none',
                borderRight: '1px solid rgba(255,255,255,.08)',
                cursor: 'pointer', color: 'var(--text-strong)',
                fontSize: 15,
              }}
            >
              {dialCountry ? (
                <>
                  <span style={{ fontSize: 16 }}>{flagEmoji(dialCountry.code)}</span>
                  <span>+{dialCountry.dial}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-mid-40)' }}>+--</span>
              )}
              <span style={{ color: 'var(--text-mid-40)', fontSize: 11 }}>▾</span>
            </button>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone number"
              style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-strong)', outline: 'none' }}
            />
          </div>
        </div>

        {error && <div className="g" style={{ padding: 10, marginTop: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <button className="btn btn-g" style={{ marginTop: 14 }} onClick={submit} disabled={m.isPending}>
          {m.isPending ? t('auth.savingDots') : t('common.continue')}
        </button>
        <div className="t2" style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>
          <span className="grn" style={{ cursor: 'pointer' }} onClick={() => nav(ROUTES['route.tab.home'].path, { replace: true })}>{t('auth.skipReferral')}</span>
        </div>
      </div>

      <CountryPicker
        open={pickerOpen === 'country'}
        onClose={() => setPickerOpen(null)}
        onSelect={c => {
          setCountry(c)
          // Auto-mirror dial code if user hasn't picked one yet — common case where
          // someone's home country matches their phone country.
          if (!dialCountry) setDialCountry(COUNTRIES.find(x => x.code === c.code) ?? null)
        }}
        selectedCode={country?.code}
        variant="name"
      />
      <CountryPicker
        open={pickerOpen === 'dial'}
        onClose={() => setPickerOpen(null)}
        onSelect={c => setDialCountry(c)}
        selectedCode={dialCountry?.code}
        variant="dial"
      />
    </PhoneShell>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <div className="inp">
        <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, color: 'var(--text-strong)' }} />
      </div>
    </div>
  )
}
