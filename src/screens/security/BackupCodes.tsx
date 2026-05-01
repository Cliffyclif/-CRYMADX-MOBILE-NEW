import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { haptics } from '../../lib/haptics'

/**
 * Backup codes screen.
 *
 * Backend behaviour: POST /api/2fa/backup-codes regenerates codes and
 * returns { backupCodes: string[] }. Codes are only shown ONCE — there's
 * no "list my codes" endpoint, so previous codes become invalid the
 * moment new ones are minted.
 *
 * The old screen called the regenerate endpoint on mount, silently
 * invalidating the user's saved codes every visit. Now it's an explicit
 * user action behind a confirmation, with a 2FA-required gate.
 */
export function BackupCodes() {
  const nav = useNavigate()
  const { data: profile, isLoading: profileLoading } = useEndpoint<any>('api.user.profile.get')
  const regen = useEndpointMutation<unknown, { message?: string; backupCodes?: string[]; codes?: string[] }>(
    'api.security.backup-codes',
  )

  const [codes, setCodes] = useState<string[] | null>(null)
  const [acked, setAcked] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const profileShape = profile?.profile ?? profile ?? null
  const twoFAEnabled = !!(profileShape?.is2FAEnabled ?? profileShape?.is_2fa_enabled)

  // Reset acknowledgement when fresh codes appear.
  useEffect(() => {
    if (codes) setAcked(false)
  }, [codes])

  const generate = async () => {
    try {
      const r = await regen.mutateAsync({})
      const list = r?.backupCodes ?? r?.codes ?? []
      if (!Array.isArray(list) || list.length === 0) {
        toast.error('No codes returned by server')
        return
      }
      setCodes(list)
      setConfirmRegen(false)
      haptics.success()
    } catch (e: any) {
      haptics.error()
      toast.error(e?.message ?? 'Could not generate codes')
    }
  }

  const copyAll = async () => {
    if (!codes) return
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      toast.success('All codes copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const downloadTxt = () => {
    if (!codes) return
    const lines = [
      'CrymadX backup codes',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Store these somewhere safe. Each can be used ONCE to sign in if you',
      'lose access to your authenticator app.',
      '',
      ...codes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`),
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crymadx-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Loading profile ────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title="Backup codes" />
        <div className="g" style={{ padding: 24, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">Loading…</div>
        </div>
      </PhoneShell>
    )
  }

  // ── 2FA not enabled — backup codes are only useful WITH 2FA ────────
  if (!twoFAEnabled) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title="Backup codes" />
        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div
            className="ic"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              background: 'rgba(255,193,7,.15)',
            }}
          >
            <Icon name="lock" size={28} color="var(--gd)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginTop: 12 }}>
            Enable 2FA first
          </div>
          <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            Backup codes are only useful when 2FA is enabled — they give you a
            way back in if you lose your authenticator app.
          </div>
          <button
            className="btn btn-g"
            style={{ marginTop: 14 }}
            onClick={() => nav(ROUTES['route.security.2fa'].path)}
          >
            <Icon name="shield" size={14} color="#fff" />
            Set up 2FA
          </button>
        </div>
      </PhoneShell>
    )
  }

  // ── No codes generated yet — show the CTA ──────────────────────────
  if (!codes && !confirmRegen) {
    return (
      <PhoneShell noTabs balanced>
        <ScreenHeader title="Backup codes" />

        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div
            className="ic"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              background: 'rgba(0,200,83,.15)',
            }}
          >
            <Icon name="key" size={28} color="var(--gl)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginTop: 12 }}>
            Generate backup codes
          </div>
          <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            One-time use codes you can use to sign in if you lose access to
            your authenticator app.
          </div>
        </div>

        <div className="g" style={{ padding: 12, marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>
            How they work
          </div>
          {[
            'You\'ll get 10 codes. Each works ONCE.',
            'Save them in a password manager or print them.',
            'You can regenerate any time — but old codes stop working.',
            'We can\'t recover lost codes for you.',
          ].map(line => (
            <div key={line} style={{ display: 'flex', gap: 8, margin: '4px 0', fontSize: 12 }}>
              <span style={{ color: 'var(--gl)' }}>•</span>
              <span style={{ color: 'var(--text-mid)' }}>{line}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-g"
          style={{ marginTop: 12 }}
          onClick={generate}
          disabled={regen.isPending}
        >
          <Icon name="key" size={14} color="#fff" />
          {regen.isPending ? 'Generating…' : 'Generate codes'}
        </button>
      </PhoneShell>
    )
  }

  // ── Confirm regenerate — destructive action ────────────────────────
  if (confirmRegen) {
    return (
      <PhoneShell noTabs balanced>
        <ScreenHeader title="Regenerate codes" />

        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div
            className="ic"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              background: 'rgba(255,82,82,.15)',
            }}
          >
            <Icon name="refresh" size={28} color="var(--r)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginTop: 12 }}>
            Replace your backup codes?
          </div>
          <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            Generating new codes invalidates the previous ones immediately.
            If you've lost the old codes this is fine — just make sure you
            save the new ones.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            className="btn btn-o"
            style={{ flex: 1 }}
            onClick={() => setConfirmRegen(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-g"
            style={{ flex: 1 }}
            onClick={generate}
            disabled={regen.isPending}
          >
            {regen.isPending ? 'Generating…' : 'Yes, regenerate'}
          </button>
        </div>
      </PhoneShell>
    )
  }

  // ── Codes shown (one-time view) ────────────────────────────────────
  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title="Backup codes" />

      <div
        className="g"
        style={{
          padding: 12,
          marginTop: 8,
          borderLeft: '3px solid var(--gd)',
          background: 'rgba(255,193,7,.06)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Icon name="shield" size={18} color="var(--gd)" />
        <div className="t3" style={{ lineHeight: 1.5, fontSize: 12 }}>
          <strong style={{ color: 'var(--gd)' }}>Save these now — we won't show them again.</strong>{' '}
          Each code can be used <strong>once</strong> to sign in if you lose your
          authenticator.
        </div>
      </div>

      <div
        className="g"
        style={{
          padding: 14,
          marginTop: 10,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {codes!.map((c, i) => (
            <div
              key={i}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(0,200,83,.06)',
                border: '1px solid rgba(0,200,83,.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <div style={{ fontSize: 9, color: 'var(--text-mid)', fontWeight: 700 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  letterSpacing: '.5px',
                  color: 'var(--text-strong)',
                  fontWeight: 700,
                }}
              >
                {c}
              </div>
            </div>
          ))}
        </div>
        <div className="t3" style={{ marginTop: 10, textAlign: 'center', fontSize: 11 }}>
          {codes!.length} codes generated · all unused
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          className="btn btn-o"
          style={{ flex: 1, padding: 10, margin: 0, fontSize: 12 }}
          onClick={copyAll}
        >
          <Icon name="copy" size={12} color="var(--gl)" /> Copy all
        </button>
        <button
          className="btn btn-o"
          style={{ flex: 1, padding: 10, margin: 0, fontSize: 12 }}
          onClick={downloadTxt}
        >
          <Icon name="dl" size={12} color="var(--gl)" /> Download
        </button>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          marginTop: 12,
          borderRadius: 10,
          border: `1px solid ${acked ? 'var(--gl)' : 'var(--divider)'}`,
          background: acked ? 'rgba(0,200,83,.06)' : 'transparent',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <input
          type="checkbox"
          checked={acked}
          onChange={e => setAcked(e.target.checked)}
          style={{ accentColor: 'var(--gl)', marginTop: 3 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-strong)', lineHeight: 1.4 }}>
          I've saved my backup codes somewhere safe. I understand I won't see them again.
        </span>
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          className="btn btn-o"
          style={{ flex: 1 }}
          onClick={() => setConfirmRegen(true)}
        >
          <Icon name="refresh" size={12} color="var(--gl)" /> Regenerate
        </button>
        <button
          className="btn btn-g"
          style={{ flex: 1 }}
          disabled={!acked}
          onClick={() => nav(ROUTES['route.security.hub'].path, { replace: true })}
        >
          Done
        </button>
      </div>
    </PhoneShell>
  )
}
