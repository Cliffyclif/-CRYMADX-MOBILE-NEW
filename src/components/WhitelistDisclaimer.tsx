import { useState, useEffect } from 'react'
import { Icon } from './Icon'

/**
 * Disclaimer modal shown before any address is added to the user's
 * withdrawal whitelist. The user must tick the agreement box before the
 * "I Agree" button is enabled. Closing the modal cancels the action.
 */
export function WhitelistDisclaimer({
  open,
  onAgree,
  onCancel,
}: {
  open: boolean
  onAgree: () => void
  onCancel: () => void
}) {
  const [checked, setChecked] = useState(false)

  // Reset the checkbox each time the modal opens.
  useEffect(() => {
    if (open) setChecked(false)
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wl-title"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a160d',
          border: '1px solid rgba(0, 200, 83, .25)',
          borderRadius: 16,
          padding: 18,
          width: '100%',
          maxWidth: 380,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          color: 'var(--text-strong)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            paddingBottom: 12,
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,193,7,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="shield" size={20} color="var(--gd)" />
          </div>
          <h3
            id="wl-title"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-strong)',
              lineHeight: 1.3,
            }}
          >
            Before you whitelist this address
          </h3>
        </div>

        {/* Body */}
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13,
            lineHeight: 1.55,
            color: 'var(--text-mid)',
          }}
        >
          Whitelisting means future withdrawals to this address are sent without
          any extra verification.
        </p>

        <ul
          style={{
            margin: '0 0 14px',
            paddingLeft: 18,
            fontSize: 13,
            lineHeight: 1.55,
            color: 'var(--text-mid)',
          }}
        >
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-strong)' }}>No email code, no 2FA.</strong>{' '}
            Once active, withdrawals to this address are processed instantly with no challenge.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-strong)' }}>24-hour activation.</strong>{' '}
            New addresses become active 24 hours after they're added. We email a link if
            you want to confirm sooner.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-strong)' }}>Check the address.</strong>{' '}
            Crypto withdrawals are irreversible. Verify the address character-by-character —
            copy-paste, don't retype.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-strong)' }}>If your account is compromised,</strong>{' '}
            an attacker could withdraw to this address without further checks. Use a
            hardware wallet you control.
          </li>
          <li>
            <strong style={{ color: 'var(--text-strong)' }}>You can remove it any time.</strong>{' '}
            Saved Addresses → trash icon. Removal takes effect immediately.
          </li>
        </ul>

        {/* Liability strip */}
        <div
          style={{
            padding: '10px 12px',
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.08)',
            borderRadius: '0 8px 8px 0',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-strong)',
            marginBottom: 14,
          }}
        >
          CrymadX cannot recover funds sent to a wrong or malicious whitelisted address.
          By whitelisting, you accept full responsibility for transfers to it.
        </div>

        {/* Acknowledgement checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 10,
            borderRadius: 10,
            border: `1px solid ${checked ? 'var(--gl)' : 'var(--divider)'}`,
            background: checked ? 'rgba(0,200,83,.08)' : 'transparent',
            cursor: 'pointer',
            marginBottom: 14,
            transition: 'all .15s',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{
              marginTop: 3,
              accentColor: 'var(--gl)',
              cursor: 'pointer',
              width: 16,
              height: 16,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-strong)',
              lineHeight: 1.4,
            }}
          >
            I understand the risks and agree that withdrawals to this address will not
            require email or 2FA verification.
          </span>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-o"
            onClick={() => {
              setChecked(false)
              onCancel()
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-g"
            disabled={!checked}
            onClick={() => {
              setChecked(false)
              onAgree()
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              opacity: checked ? 1 : 0.5,
              cursor: checked ? 'pointer' : 'not-allowed',
            }}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  )
}
