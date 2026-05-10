import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon, type IconName } from '../../components/Icon'
import { CountryPicker } from '../../components/CountryPicker'
import { useAuth } from '../../stores/auth'
import { useTheme } from '../../stores/theme'
import { useDisplay } from '../../stores/display'
import { ROUTES } from '../../routes'
import { useEndpoint } from '../../api/hooks'
import { useEndpointMutation } from '../../api/hooks'
import { SUPPORTED_LANGUAGES } from '../../lib/i18n'
import { COUNTRIES, flagEmoji, type Country } from '../../data/countries'

// Parse a stored phone string ("+<dial> <digits>" or raw digits) into
// dial-country + digits, so the edit modal seeds correctly from user.phone.
function parseStoredPhone(raw: string): { country: Country | null; digits: string } {
  const m = (raw || '').match(/^\s*\+?(\d{1,4})[\s\-]*(.*)$/)
  if (!m) return { country: null, digits: raw || '' }
  const dial = m[1]
  const rest = (m[2] || '').replace(/[^0-9\-\s()]/g, '').trim()
  const country = COUNTRIES.find(c => c.dial === dial) || null
  return country ? { country, digits: rest } : { country: null, digits: raw || '' }
}

export function Profile() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const signOut = useAuth(s => s.signOut)
  const setUser = useAuth(s => s.setUser)

  // Edit-profile modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editFirst, setEditFirst] = useState('')
  const [editLast, setEditLast] = useState('')
  const [editCountry, setEditCountry] = useState<Country | null>(null)
  const [editDial, setEditDial] = useState<Country | null>(null)
  const [editPhoneDigits, setEditPhoneDigits] = useState('')
  const [pickerOpen, setPickerOpen] = useState<null | 'country' | 'dial'>(null)
  const updateProfile = useEndpointMutation<{ fullName?: string; phone?: string; country?: string }>('api.user.profile.update')

  const openEditModal = () => {
    setEditFirst(user?.firstName ?? '')
    setEditLast(user?.lastName ?? '')
    const initialCountry = user?.country ? (COUNTRIES.find(c => c.name === user.country) ?? null) : null
    setEditCountry(initialCountry)
    const parsed = parseStoredPhone(user?.phone ?? '')
    setEditDial(parsed.country ?? initialCountry)  // default dial to country if unknown
    setEditPhoneDigits(parsed.digits)
    setEditOpen(true)
  }

  const saveProfile = async () => {
    const fullName = [editFirst, editLast].filter(Boolean).join(' ').trim()
    const digits = editPhoneDigits.replace(/[^0-9]/g, '')
    const phone = digits ? (editDial ? `+${editDial.dial} ${digits}` : digits) : ''
    try {
      await updateProfile.mutateAsync({
        fullName,
        phone,
        country: editCountry?.name ?? '',
      } as any)
      if (user) {
        setUser({ ...user, firstName: editFirst, lastName: editLast, phone, country: editCountry?.name ?? '' })
      }
      toast.success('Profile updated')
      setEditOpen(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update profile')
    }
  }
  const theme = useTheme(s => s.theme)
  const toggleTheme = useTheme(s => s.toggle)
  const size = useDisplay(s => s.size)
  const { data: rewards } = useEndpoint<{ xp: number; tier: string; badges: number }>('api.rewards.summary', {}, { enabled: !!user })
  const { data: uidData } = useEndpoint<{ uid: string; status: string }>('api.user.uid', {}, { enabled: !!user })
  // Real KYC + API key counts so the row badges aren't hardcoded.
  const { data: kyc } = useEndpoint<{ status?: string }>('api.user.kyc.status', {}, { enabled: !!user })
  const { data: apiKeys } = useEndpoint<{ items?: any[] } | any[]>('api.settings.api-keys.list', {}, { enabled: !!user })
  const apiKeyCount = Array.isArray(apiKeys) ? apiKeys.length : (apiKeys?.items?.length ?? 0)
  const kycLabel = kycStatusLabel(kyc?.status)
  const logout = useEndpointMutation('api.auth.logout')

  const handleLogout = async () => {
    try { await logout.mutateAsync({}) } catch {}
    signOut()
    nav(ROUTES['route.auth.login'].path, { replace: true })
  }

  const langLabel = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.native ?? 'English'
  const sizeLabel = size === 'small' ? t('settings.small') : size === 'medium' ? t('settings.medium') : t('settings.large')

  // Each row carries its OWN destination — the previous version hardcoded
  // every Account row to /kyc, so tapping "API keys" or "Card" took the
  // user to KYC instead of the right screen.
  const account: Array<[IconName, string, string, () => void]> = [
    ['shield', t('profile.kyc'),               kycLabel,                     () => nav(ROUTES['route.kyc.status'].path)],
    ['lock',   t('profile.security'),          '',                           () => nav(ROUTES['route.security.hub'].path)],
    ['key',    t('settings.apiKeys'),          apiKeyCount > 0 ? String(apiKeyCount) : '', () => nav(ROUTES['route.settings.api-keys'].path)],
    ['card',   t('services.items.card'),       '',                           () => nav(ROUTES['route.card.hub'].path)],
  ]

  const rewardsRows: Array<[IconName, string, string, () => void]> = [
    ['trophy', t('services.items.rewardsHub'), `${rewards?.xp ?? 0} XP`,    () => nav(ROUTES['route.engage.rewards'].path)],
    ['gift',   t('profile.referral'),          '',                          () => nav(ROUTES['route.engage.referral'].path)],
    ['star',   t('rewards.tier'),              rewards?.tier ?? 'Bronze',   () => nav(ROUTES['route.engage.rewards'].path)],
  ]

  const prefs: Array<[IconName, string, string, () => void]> = [
    ['moon', t('profile.theme'), theme === 'dark' ? t('settings.themeDark') : t('settings.themeLight'), toggleTheme],
    ['settings', t('settings.displaySize'), sizeLabel, () => nav(ROUTES['route.settings.theme'].path)],
    ['globe', t('profile.language'), langLabel, () => nav(ROUTES['route.settings.language'].path)],
    ['dollar', t('profile.currency'), 'USD', () => nav(ROUTES['route.settings.currency'].path)],
    ['bell', t('profile.notifications'), t('common.online'), () => nav(ROUTES['route.settings.notifications'].path)],
  ]

  return (
    <PhoneShell bottomNav={<BottomNav />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/crymadx-mark.png" alt="" style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(27,140,62,.06)', padding: 6 }} />
        <div style={{ flex: 1 }}>
          <h2>{user ? `${user.firstName} ${user.lastName}` : 'Demo User'}</h2>
          <div className="t3">{user?.email ?? 'demo@crymadx.io'}</div>
          <span className="badge badge-gd" style={{ fontSize: 10, marginTop: 2 }}>🥉 Bronze · {rewards?.xp ?? 0} XP</span>
        </div>
        <button
          type="button"
          onClick={openEditModal}
          aria-label={t('profile.editProfile', { defaultValue: 'Edit profile' })}
          style={{
            background: 'rgba(27,140,62,.10)',
            border: '1px solid rgba(27,140,62,.25)',
            borderRadius: 999,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="edit" size={14} color="var(--gl)" />
        </button>
      </div>

      {/* CrymadX UID — share this code so other users can send you crypto instantly */}
      {uidData?.uid && (
        <div
          className="g"
          style={{
            padding: 14,
            marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(0,200,83,.08), rgba(0,200,83,.02))',
            border: '1px solid rgba(0,200,83,.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 18,
                background: 'rgba(0,200,83,.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="zap" size={18} color="var(--gl)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t3" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'var(--gl)' }}>
                Your CrymadX UID
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  letterSpacing: 4,
                  color: 'var(--text-strong)',
                  marginTop: 2,
                }}
              >
                {uidData.uid}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(uidData.uid)
                  toast.success('UID copied')
                } catch {
                  toast.error('Copy failed')
                }
              }}
              aria-label="Copy UID"
              style={{
                background: 'rgba(0,200,83,.12)',
                border: '1px solid rgba(0,200,83,.3)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 11,
                color: 'var(--gl)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Icon name="copy" size={12} color="var(--gl)" /> Copy
            </button>
            <button
              type="button"
              onClick={async () => {
                const text = `Send me crypto on CrymadX — UID: ${uidData.uid}`
                const nav: any = navigator
                if (typeof nav?.share === 'function') {
                  try { await nav.share({ title: 'My CrymadX UID', text }) } catch {}
                } else {
                  try { await navigator.clipboard.writeText(text); toast.success('Share text copied') } catch {}
                }
              }}
              aria-label="Share UID"
              style={{
                background: 'transparent',
                border: '1px solid var(--divider)',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <Icon name="share" size={12} color="var(--text-mid-40)" />
            </button>
          </div>
          <div className="t3" style={{ fontSize: 11, marginTop: 8, opacity: 0.75 }}>
            Friends with a CrymadX account can send you any crypto using just this code — instant, no fees.
          </div>
        </div>
      )}

      <Section title={t('profile.myAccount').toUpperCase()} rows={account.map(([i, n, r, fn]) => ({ icon: i, name: n, value: r, onClick: fn }))} />
      <Section title={t('profile.rewards').toUpperCase()} rows={rewardsRows.map(([i, n, r, fn]) => ({ icon: i, name: n, value: r, valueClass: 'grn', onClick: fn }))} />
      <Section title={t('common.settings').toUpperCase()} rows={prefs.map(([i, n, r, fn]) => ({ icon: i, name: n, value: r, onClick: fn }))} />

      <button className="btn btn-r" onClick={handleLogout} style={{ marginTop: 10 }} disabled={logout.isPending}>
        {logout.isPending ? t('auth.loggingOut') : t('profile.logout')}
      </button>

      {editOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('profile.editProfile', { defaultValue: 'Edit profile' })}
          onClick={() => !updateProfile.isPending && setEditOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--surface, #0f1611)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 16,
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 -8px 30px rgba(0,0,0,.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {t('profile.editProfile', { defaultValue: 'Edit profile' })}
              </h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={updateProfile.isPending}
                aria-label={t('common.close', { defaultValue: 'Close' })}
                style={{ background: 'none', border: 'none', color: 'var(--text-mid-40)', cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <Field label={t('profile.firstName', { defaultValue: 'First name' })}>
              <input
                value={editFirst}
                onChange={e => setEditFirst(e.target.value)}
                disabled={updateProfile.isPending}
                style={inputStyle}
              />
            </Field>

            <Field label={t('profile.lastName', { defaultValue: 'Last name' })}>
              <input
                value={editLast}
                onChange={e => setEditLast(e.target.value)}
                disabled={updateProfile.isPending}
                style={inputStyle}
              />
            </Field>

            <Field label={t('profile.country', { defaultValue: 'Country' })}>
              <button
                type="button"
                onClick={() => setPickerOpen('country')}
                disabled={updateProfile.isPending}
                style={{ ...inputStyle, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                {editCountry ? (
                  <>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{flagEmoji(editCountry.code)}</span>
                    <span style={{ flex: 1 }}>{editCountry.name}</span>
                    <span style={{ color: 'var(--text-mid-40)' }}>›</span>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, color: 'var(--text-mid-40)' }}>
                      {t('profile.selectCountry', { defaultValue: 'Select country' })}
                    </span>
                    <span style={{ color: 'var(--text-mid-40)' }}>›</span>
                  </>
                )}
              </button>
            </Field>

            <Field label={t('profile.phone', { defaultValue: 'Phone number' })}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPickerOpen('dial')}
                  disabled={updateProfile.isPending}
                  style={{
                    ...inputStyle,
                    width: 120,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  {editDial ? (
                    <>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(editDial.code)}</span>
                      <span style={{ flex: 1 }}>+{editDial.dial}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-mid-40)' }}>+--</span>
                  )}
                </button>
                <input
                  value={editPhoneDigits}
                  onChange={e => setEditPhoneDigits(e.target.value.replace(/[^0-9\-\s()]/g, ''))}
                  disabled={updateProfile.isPending}
                  inputMode="tel"
                  placeholder="555 123 4567"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </Field>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={updateProfile.isPending}
                className="btn"
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--divider)', color: 'var(--text-strong)' }}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={updateProfile.isPending}
                className="btn btn-g"
                style={{ flex: 1 }}
              >
                {updateProfile.isPending
                  ? t('common.saving', { defaultValue: 'Saving…' })
                  : t('common.save', { defaultValue: 'Save' })}
              </button>
            </div>
          </div>
        </div>
      )}

      <CountryPicker
        open={pickerOpen === 'country'}
        onClose={() => setPickerOpen(null)}
        onSelect={(c) => {
          setEditCountry(c)
          if (!editDial) setEditDial(c)
        }}
        variant="name"
        selectedCode={editCountry?.code}
      />
      <CountryPicker
        open={pickerOpen === 'dial'}
        onClose={() => setPickerOpen(null)}
        onSelect={(c) => setEditDial(c)}
        variant="dial"
        selectedCode={editDial?.code}
      />
    </PhoneShell>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 12,
  color: 'var(--text-strong)',
  fontSize: 15,
  outline: 'none',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div className="t3" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  )
}

interface Row {
  icon: IconName
  name: string
  value?: string
  valueClass?: string
  onClick?: () => void
}

function kycStatusLabel(status?: string): string {
  switch (status) {
    case 'approved':
      return '✓ Verified'
    case 'processing':
      return 'Processing'
    case 'pending':
      return 'Pending'
    case 'manual_review':
      return 'In review'
    case 'rejected':
      return 'Rejected'
    case 'none':
    default:
      return 'Not started'
  }
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="g" style={{ padding: 2, marginTop: 8 }}>
      <div className="t3" style={{ padding: '8px 10px', fontWeight: 700 }}>{title}</div>
      {rows.map((r, i) => (
        <button key={i} onClick={r.onClick} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', border: 'none', borderBottomColor: 'var(--divider-soft)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 28, height: 28 }}>
            <Icon name={r.icon} size={14} />
          </div>
          <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{r.name}</div></div>
          {r.value && <div className={`li-r ${r.valueClass ?? ''}`} style={{ fontSize: 13, color: r.valueClass === 'grn' ? 'var(--gl)' : 'var(--text-mid-40)' }}>{r.value} ›</div>}
        </button>
      ))}
    </div>
  )
}
