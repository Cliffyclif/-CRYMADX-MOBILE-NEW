import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'

/**
 * Disclaimer modal shown before any address is added to the user's
 * withdrawal whitelist. The user must tick the agreement box before the
 * "I Agree" button is enabled. Closing the modal cancels the action.
 *
 * Props:
 *   open      — whether the modal is visible
 *   onAgree() — fired when the user agrees (you can then save the address)
 *   onCancel()— fired when the user dismisses the modal
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
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

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
        background: 'rgba(0,0,0,.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 18,
          width: '100%',
          maxWidth: 380,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid var(--divider)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,193,7,.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="shield" size={20} color="var(--gd)" />
          </div>
          <h3 id="wl-title" style={{ margin: 0, fontSize: 17 }}>
            {t('whitelist.disclaimerTitle') || 'Before you whitelist this address'}
          </h3>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-mid)' }}>
          <p style={{ margin: '0 0 10px' }}>
            {t('whitelist.disclaimerIntro') ||
              'Whitelisting an address means future withdrawals to it will be sent without any extra verification.'}
          </p>

          <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>{t('whitelist.bulletNoOtpTitle') || 'No email code, no 2FA.'}</strong>{' '}
              {t('whitelist.bulletNoOtpBody') ||
                'Once active, withdrawals to this address are processed instantly with no challenge.'}
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>{t('whitelist.bulletDelayTitle') || '24-hour activation.'}</strong>{' '}
              {t('whitelist.bulletDelayBody') ||
                'New addresses become active 24 hours after they\'re added. We\'ll email a link if you want to confirm sooner.'}
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>{t('whitelist.bulletCheckTitle') || 'Check the address.'}</strong>{' '}
              {t('whitelist.bulletCheckBody') ||
                'Crypto withdrawals are irreversible. Verify the address character-by-character — copy-paste, don\'t retype.'}
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>{t('whitelist.bulletCompromiseTitle') || 'If your account is compromised'}</strong>{' '}
              {t('whitelist.bulletCompromiseBody') ||
                'an attacker could withdraw to this address without further checks. Use a hardware wallet you control.'}
            </li>
            <li>
              <strong>{t('whitelist.bulletRevokeTitle') || 'You can remove it any time.'}</strong>{' '}
              {t('whitelist.bulletRevokeBody') ||
                'Open Saved Addresses → trash icon. Removal takes effect immediately.'}
            </li>
          </ul>

          <div
            className="g"
            style={{
              padding: 10,
              borderLeft: '3px solid var(--r)',
              background: 'rgba(255,82,82,.06)',
              fontSize: 12,
              color: 'var(--text-strong)',
              marginBottom: 12,
            }}
          >
            {t('whitelist.disclaimerNoLiability') ||
              'CrymadX cannot recover funds sent to a wrong or malicious whitelisted address. By whitelisting, you accept full responsibility for transfers to it.'}
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 10,
            borderRadius: 10,
            border: `1px solid ${checked ? 'var(--gl)' : 'var(--divider)'}`,
            background: checked ? 'rgba(0,200,83,.06)' : 'transparent',
            cursor: 'pointer',
            marginBottom: 12,
            transition: 'all .15s',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--gl)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.4 }}>
            {t('whitelist.acknowledge') ||
              'I understand the risks and agree that withdrawals to this address will not require email or 2FA verification.'}
          </span>
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-o"
            onClick={() => {
              setChecked(false)
              onCancel()
            }}
            style={{ flex: 1, padding: 10, margin: 0 }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-g"
            disabled={!checked}
            onClick={() => {
              setChecked(false)
              onAgree()
            }}
            style={{ flex: 1, padding: 10, margin: 0 }}
          >
            {t('whitelist.iAgree') || 'I Agree'}
          </button>
        </div>
      </div>
    </div>
  )
}
