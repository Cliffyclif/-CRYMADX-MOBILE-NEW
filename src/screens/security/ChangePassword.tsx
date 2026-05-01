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

export function ChangePassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Per-field visibility toggles — independent so the user can reveal one at
  // a time without exposing the others.
  const [showCur, setShowCur] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const m = useEndpointMutation<{ body: { currentPassword: string; newPassword: string } }, { message: string }>(
    'api.security.password.change',
  )

  // Same 4 rules as the main website RegisterScreen — keeps the bar
  // consistent across web + mobile. Backend (auth-service /change-password)
  // enforces minLength 8 too, so 8 is the truth.
  const checks: Array<[boolean, string]> = [
    [pw.length >= 8,            'At least 8 characters'],
    [/[A-Z]/.test(pw),          'Contains an uppercase letter'],
    [/[0-9]/.test(pw),          'Contains a number'],
    [/[^A-Za-z0-9]/.test(pw),   'Contains a special character'],
  ]
  // Strength: 1 weak (< 8), then +1 per extra rule satisfied beyond length.
  const passedRulesBeyondLen = checks.slice(1).filter(([ok]) => ok).length
  const strength = pw.length === 0
    ? 0
    : pw.length < 8
    ? 1
    : Math.min(4, 1 + passedRulesBeyondLen)
  const allChecksPass = checks.every(([ok]) => ok)
  const matchesCurrent = pw.length > 0 && pw === cur

  const submit = async () => {
    setError(null)
    if (!cur) {
      setError('Enter your current password')
      return
    }
    if (pw !== confirm) {
      setError(t('security.passwordsDontMatch') || "New passwords don't match")
      return
    }
    if (pw.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (matchesCurrent) {
      setError('New password must be different from your current one')
      return
    }
    try {
      await m.mutateAsync({ body: { currentPassword: cur, newPassword: pw } })
      haptics.success()
      toast.success(t('security.passwordChanged') || 'Password changed successfully')
      nav(ROUTES['route.security.hub'].path, { replace: true })
    } catch (err) {
      haptics.error()
      const msg = (err as any)?.message ?? 'Could not change password'
      setError(msg)
    }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.changePassword') || 'Change Password'} />

      <div className="t2" style={{ marginTop: 4 }}>
        Choose a new password that's different from any you've used before.
      </div>

      {/* Current password */}
      <div style={{ marginTop: 14 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>
          {t('security.passwordOld') || 'Current password'}
        </div>
        <PasswordField
          value={cur}
          onChange={setCur}
          show={showCur}
          onToggle={() => setShowCur(s => !s)}
          placeholder={t('security.enterCurrent') || 'Enter your current password'}
          autoFocus
        />
      </div>

      {/* New password */}
      <div style={{ marginTop: 10 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>
          {t('security.passwordNew') || 'New password'}
        </div>
        <PasswordField
          value={pw}
          onChange={setPw}
          show={showPw}
          onToggle={() => setShowPw(s => !s)}
          placeholder={t('security.chooseStrong') || 'Choose a strong password'}
        />
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i <= strength
                    ? strength <= 1
                      ? 'var(--r)'
                      : strength === 2
                      ? 'var(--gd)'
                      : strength === 3
                      ? '#f59e0b'
                      : 'var(--gl)'
                    : 'rgba(255,255,255,.08)',
                transition: 'background .15s',
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            marginTop: 4,
            color:
              strength >= 4
                ? 'var(--gl)'
                : strength === 3
                ? '#f59e0b'
                : strength === 2
                ? 'var(--gd)'
                : 'var(--r)',
            fontWeight: 600,
          }}
        >
          {strength >= 4
            ? 'Strong'
            : strength === 3
            ? 'Good'
            : strength === 2
            ? 'Fair'
            : pw.length === 0
            ? ' '
            : 'Too weak'}
        </div>
      </div>

      {/* Confirm */}
      <div style={{ marginTop: 10 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>
          {t('security.passwordConfirm') || 'Confirm new password'}
        </div>
        <PasswordField
          value={confirm}
          onChange={setConfirm}
          show={showConfirm}
          onToggle={() => setShowConfirm(s => !s)}
          placeholder={t('security.reEnterNew') || 'Re-enter your new password'}
        />
        {confirm.length > 0 && confirm !== pw && (
          <div style={{ fontSize: 11, color: 'var(--r)', marginTop: 4 }}>
            {t('security.passwordsDontMatch') || "Passwords don't match"}
          </div>
        )}
        {confirm.length > 0 && confirm === pw && pw.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--gl)', marginTop: 4 }}>
            ✓ Match
          </div>
        )}
      </div>

      <div className="g" style={{ padding: 12, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>
          {t('security.requirements') || 'Requirements'}
        </div>
        {checks.map(([ok, label]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '4px 0',
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: ok ? 'rgba(0,200,83,.18)' : 'rgba(255,255,255,.06)',
                color: ok ? 'var(--gl)' : 'var(--text-mid)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                flexShrink: 0,
              }}
            >
              {ok ? '✓' : '○'}
            </span>
            <span
              style={{
                color: ok ? 'var(--text-strong)' : 'var(--text-mid)',
                textDecoration: 'none',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="g"
        style={{
          padding: 10,
          marginTop: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
          borderLeft: '3px solid var(--gd)',
          background: 'rgba(255,193,7,.05)',
        }}
      >
        <Icon name="shield" size={16} color="var(--gd)" />
        <div className="t3" style={{ lineHeight: 1.4, fontSize: 12 }}>
          {t('security.allSignOut') ||
            'For your safety, you\'ll be signed out from all other devices after changing your password.'}
        </div>
      </div>

      {error && (
        <div
          className="g"
          style={{
            padding: 10,
            marginTop: 6,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.06)',
            color: 'var(--r)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-g"
        style={{ marginTop: 12 }}
        onClick={submit}
        disabled={
          m.isPending ||
          !cur ||
          !pw ||
          !confirm ||
          pw !== confirm ||
          !allChecksPass ||
          matchesCurrent
        }
      >
        <Icon name="lock" size={14} color="#fff" />
        {m.isPending
          ? (t('security.changing') || 'Changing…')
          : (t('security.changePassword') || 'Change password')}
      </button>
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable password field with eye-toggle.
// ─────────────────────────────────────────────────────────────────────────
function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoFocus = false,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="inp">
      <Icon name="lock" size={14} />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={show ? 'off' : 'new-password'}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          background: show ? 'rgba(0,200,83,.16)' : 'rgba(255,255,255,.06)',
          border: 'none',
          padding: 8,
          marginLeft: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          width: 32,
          height: 32,
          flexShrink: 0,
          transition: 'background .15s',
        }}
      >
        {show ? (
          // Eye-with-slash composition (no eye-off icon in the bundle).
          <span style={{ position: 'relative', display: 'flex', width: 18, height: 18 }}>
            <Icon name="eye" size={18} color="var(--gl)" />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: -2,
                right: -2,
                top: '50%',
                height: 2,
                background: 'var(--gl)',
                transform: 'rotate(-22deg)',
                borderRadius: 2,
                boxShadow: '0 0 0 1.5px #0a160d',
              }}
            />
          </span>
        ) : (
          <Icon name="eye" size={18} color="rgba(255,255,255,.85)" />
        )}
      </button>
    </div>
  )
}
