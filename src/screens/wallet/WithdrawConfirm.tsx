import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { WhitelistDisclaimer } from '../../components/WhitelistDisclaimer'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import { fmt } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import type { Transaction } from '../../api/endpoints'

// Address-mode state (existing flow)
type AddressWithdrawState = {
  mode?: 'address'
  asset: string; network: string; address: string; amount: string; fee: string
}
// UID-mode state (new internal-transfer flow)
type UidWithdrawState = {
  mode: 'uid'
  asset: string; network: string; amount: string; fee: '0'
  recipientUid: string; recipientName: string
  recipientUsername?: string | null
}
type WithdrawState = AddressWithdrawState | UidWithdrawState

type WhitelistCheck = {
  whitelisted: boolean
  status?: 'pending' | 'active' | null
  cooldownEndsAt?: string | null
  id?: string
  name?: string
}

export function WithdrawConfirm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as WithdrawState | null

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saveAddress, setSaveAddress] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  // Bug #5 — capture the EXACT moment the user clicks "I Agree" so the
  // server can verify the disclaimer was acknowledged within the last 5min.
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null)
  // Bug #4 — surface 2FA TOTP keypad when the backend says we need it.
  const [needs2FA, setNeeds2FA] = useState(false)
  const [totp, setTotp] = useState('')

  const isUidMode = state?.mode === 'uid'

  // Whitelist check — chain+address for address mode, uid for UID mode.
  // If active-whitelisted, the OTP/2FA step is hidden.
  const { data: wl, isLoading: wlLoading } = useEndpoint<WhitelistCheck>(
    'api.wallet.whitelist.check',
    {
      query: state
        ? (isUidMode
            ? { uid: (state as UidWithdrawState).recipientUid }
            : { asset: state.asset, chain: state.network, address: (state as AddressWithdrawState).address })
        : {},
    },
    { enabled: !!state },
  )
  const isWhitelisted = !!wl?.whitelisted
  // True if the address is in the whitelist in ANY status (pending or active).
  // Used to hide the "Whitelist this address" toggle so the user doesn't try
  // to add it again and trigger a 409 conflict.
  const alreadyOnWhitelist = !!wl?.status
  const sendOtp = useEndpointMutation<{ body: { purpose: string } }, unknown>('api.otp.send')
  const withdraw = useEndpointMutation<{ body: any }, Transaction>('api.wallet.withdraw.create', {
    invalidates: ['api.wallet.balances.list', 'api.tx.list'],
  })
  // UID-mode internal transfer mutation
  const internalTransfer = useEndpointMutation<{ body: any }, any>('api.transfer.internal.create', {
    invalidates: ['api.wallet.balances.list', 'api.tx.list', 'api.transfer.internal.list'],
  })
  const saveBeneficiary = useEndpointMutation('api.beneficiaries.create', {
    invalidates: ['api.beneficiaries.list', 'api.wallet.whitelist.list'],
  })

  // Trigger the email OTP exactly once when the screen mounts UNLESS this
  // address is whitelisted (in which case no OTP is needed). Wait for the
  // whitelist check to finish before deciding.
  const sentRef = useRef(false)
  useEffect(() => {
    if (!state || sentRef.current) return
    if (wlLoading) return
    if (isWhitelisted) {
      sentRef.current = true // mark as "decided", don't keep retrying
      return
    }
    sentRef.current = true
    sendOtp.mutateAsync({ body: { purpose: 'withdrawal' } })
      .then(() => {
        setOtpSent(true)
        setResendIn(60)
        toast.success(t('withdraw.otpSent') || 'Verification code sent to your email')
      })
      .catch((e: any) => {
        setError(e?.message ?? 'Could not send verification code')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wlLoading, isWhitelisted])

  // 60s resend cooldown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  if (!state) {
    nav(ROUTES['route.wallet.withdraw'].path, { replace: true })
    return null
  }

  // Fee is taken OUT of the amount (not on top). The amount the user
  // entered IS the total debited; the recipient receives `amount - fee`.
  const amountNum = parseFloat(state.amount) || 0
  const feeNum = parseFloat(state.fee) || 0
  const recipientReceives = fmt(Math.max(0, amountNum - feeNum))

  const handleResend = async () => {
    if (resendIn > 0) return
    setError(null)
    try {
      await sendOtp.mutateAsync({ body: { purpose: 'withdrawal' } })
      setResendIn(60)
      toast.success(t('withdraw.otpResent') || 'Code resent')
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend code')
    }
  }

  const submit = async () => {
    setError(null)
    if (!isWhitelisted && otp.length !== 6) {
      setError(t('withdraw.enterSixDigitCode') || 'Enter the 6-digit code from your email')
      return
    }
    if (needs2FA && totp.length !== 6) {
      setError(t('withdraw.enter2FA') || 'Enter the 6-digit code from your authenticator app')
      return
    }
    try {
      let tx: any
      if (isUidMode) {
        // ─── Internal UID transfer ───
        const u = state as UidWithdrawState
        const body: any = {
          recipientUid: u.recipientUid,
          asset: u.asset,
          chain: u.network,
          amount: u.amount,
        }
        if (!isWhitelisted) body.otpCode = otp
        if (needs2FA) body.twoFactorCode = totp
        const res = await internalTransfer.mutateAsync({ body })
        tx = { id: res?.transfer?.id ?? `transfer_${Date.now()}` }
      } else {
        const body: any = isWhitelisted
          ? { ...state }
          : { ...state, otpCode: otp }
        if (needs2FA) body.twoFactorCode = totp
        tx = await withdraw.mutateAsync({ body })
      }
      haptics.success()

      // Save to address book if the user opted in. The disclaimer modal has
      // already been agreed-to in the toggle handler below — capture that
      // exact timestamp (Bug #5). If it's older than 5min, the backend will
      // reject with ACK_STALE so we re-open the disclaimer.
      if (!alreadyOnWhitelist && saveAddress && savedName.trim()) {
        const ackToSend = acknowledgedAt
        if (!ackToSend || Date.now() - new Date(ackToSend).getTime() > 4 * 60 * 1000) {
          // Stale — reopen disclaimer instead of sending. The withdrawal already
          // succeeded; user can re-add later from Beneficiaries screen.
          console.warn('[withdraw] Acknowledgment stale, address not saved')
        } else {
        try {
          // Branch save shape by mode: UID or address
          const saveBody: any = isUidMode
            ? {
                kind: 'uid',
                name: savedName.trim(),
                uid: (state as UidWithdrawState).recipientUid,
                acknowledgedAt: ackToSend,
              }
            : {
                name: savedName.trim(),
                asset: state.asset,
                network: state.network,
                chain: state.network,
                address: (state as AddressWithdrawState).address,
                acknowledgedAt: ackToSend,
              }
          await saveBeneficiary.mutateAsync({ body: saveBody })
          toast.success(
            t('withdraw.addressSavedPending') ||
              `${savedName.trim()} saved — active in 24 hours (or confirm via email)`,
          )
        } catch (e: any) {
          // Don't block the success flow on a save failure
          console.warn('[withdraw] Could not save address:', e?.message)
        }
        }
      }

      // Pass the freshly-created tx as state so the detail screen can show
      // it even if /transactions hasn't picked it up yet.
      nav(routeFor('route.wallet.tx-detail', { txId: tx.id }), {
        replace: true,
        state: {
          justSubmitted: tx,
          asset: state.asset,
          amount: state.amount,
          network: state.network,
          ...(isUidMode
            ? { recipientUid: (state as UidWithdrawState).recipientUid, recipientName: (state as UidWithdrawState).recipientName }
            : { address: (state as AddressWithdrawState).address }),
        },
      })
    } catch (err: any) {
      haptics.error()
      // Bug #4 — backend may return requires2FA: true when 2FA is enabled and
      // the address isn't active-whitelisted. Surface the keypad and let the
      // user retry without leaving the screen.
      const flag = err?.data?.requires2FA ?? err?.requires2FA
      if (flag && !needs2FA) {
        setNeeds2FA(true)
        setError(t('withdraw.needs2FA') || 'Two-factor authentication required. Enter the 6-digit code from your authenticator app.')
        return
      }
      setError(err?.message ?? 'Withdrawal failed')
    }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('withdraw.confirmTitle')} />

      <div className="steps">
        <div className="step"><div className="sn d">✓</div><div className="st">{t('withdraw.stepAsset')}</div></div>
        <div className="step"><div className="sn d">✓</div><div className="st">{t('withdraw.stepAmount')}</div></div>
        <div className="step"><div className="sn a">3</div><div className="st">{t('withdraw.stepConfirm')}</div></div>
      </div>

      {/* UID-mode prominent recipient confirmation — surfaced ABOVE the amount
          to make the "are you sending to the right person?" check the very
          first thing the user sees on this screen. */}
      {isUidMode && (() => {
        const u = state as UidWithdrawState
        const initial = (u.recipientName || u.recipientUsername || '?').charAt(0).toUpperCase()
        return (
          <div
            className="g"
            style={{
              padding: 14,
              marginTop: 8,
              borderLeft: '3px solid var(--gl)',
              background: 'linear-gradient(135deg, rgba(0,200,83,.10), rgba(0,200,83,.02))',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48, height: 48, borderRadius: 24,
                background: 'rgba(0,200,83,.18)',
                color: 'var(--gl)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 20,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t3" style={{ fontSize: 10, color: 'var(--gl)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                Sending to
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.2, marginTop: 2 }}>
                {u.recipientName || 'CrymadX user'}
              </div>
              {u.recipientUsername && u.recipientUsername !== u.recipientName && (
                <div style={{ fontSize: 13, color: 'var(--gl)', fontWeight: 600, marginTop: 1 }}>
                  @{u.recipientUsername}
                </div>
              )}
              <div className="t3" style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                UID {u.recipientUid}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
        <div className="t3">{t('withdraw.youSend')}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '6px 0' }}>{state.amount} {state.asset}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {(isUidMode
          ? [
              [t('common.to'), `${(state as UidWithdrawState).recipientName || 'CrymadX user'}${(state as UidWithdrawState).recipientUsername ? ' (@' + (state as UidWithdrawState).recipientUsername + ')' : ''} · UID ${(state as UidWithdrawState).recipientUid}`],
              [t('common.network'), state.network],
              ['You send', `${fmt(amountNum)} ${state.asset}`],
              ['Network gas', 'Deducted from your balance'],
              ['Recipient receives', `${fmt(amountNum)} ${state.asset}`],
            ]
          : [
              [t('common.to'), shorten((state as AddressWithdrawState).address)],
              [t('common.network'), state.network],
              ['You send', `${fmt(amountNum)} ${state.asset}`],
              [t('withdraw.networkFee'), `${fmt(feeNum)} ${state.asset}`],
              ['Recipient receives', `${recipientReceives} ${state.asset}`],
            ]
        ).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      {isUidMode && (
        <div
          className="g"
          style={{
            padding: 10,
            marginTop: 6,
            borderLeft: '3px solid var(--gl)',
            background: 'rgba(0,200,83,.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="zap" size={16} color="var(--gl)" />
            <div className="t3" style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--gl)' }}>On-chain transfer.</strong>{' '}
              Funds settle in @{(state as UidWithdrawState).recipientUid}'s wallet on-chain — usually within a minute. A network gas fee applies and is deducted from your balance.
            </div>
          </div>
        </div>
      )}

      {/* Whitelisted-address banner — replaces the OTP step entirely. */}
      {isWhitelisted && (
        <div
          className="g"
          style={{
            padding: 12,
            marginTop: 6,
            borderLeft: '3px solid var(--gl)',
            background: 'rgba(0,200,83,.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield" size={18} color="var(--gl)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gl)' }}>
                {wl?.name
                  ? `${wl.name} — ${t('withdraw.trustedAddress') || 'trusted address'}`
                  : (t('withdraw.trustedAddress') || 'Trusted address')}
              </div>
              <div className="t3" style={{ fontSize: 12 }}>
                {t('withdraw.whitelistedNoOtp') ||
                  'No email verification needed — this address is in your whitelist.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending entry — show countdown instead of the "Whitelist" toggle. */}
      {alreadyOnWhitelist && !isWhitelisted && (
        <div
          className="g"
          style={{
            padding: 10,
            marginTop: 6,
            borderLeft: '3px solid var(--gd)',
            background: 'rgba(255,193,7,.06)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Icon name="clock" size={16} color="var(--gd)" />
          <div className="t3" style={{ flex: 1, fontSize: 12 }}>
            {wl?.name ? `${wl.name} — ` : ''}already saved.{' '}
            {wl?.cooldownEndsAt
              ? `Becomes a trusted address ${trustedIn(wl.cooldownEndsAt)}.`
              : 'Will become a trusted address shortly.'}
            {' '}This withdrawal still needs your email code.
          </div>
        </div>
      )}

      {/* Save-to-address-book toggle — hidden when address is already on
          the whitelist in any state (active or pending). */}
      {!alreadyOnWhitelist && (
        <div className="g" style={{ padding: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`tgl ${saveAddress ? 'on' : 'off'}`}
              onClick={() => {
                if (saveAddress) {
                  // Toggling OFF — no confirmation needed.
                  setSaveAddress(false)
                  setSavedName('')
                  setAcknowledgedAt(null)  // Clear the disclaimer timestamp
                } else {
                  // Toggling ON — show the disclaimer first. The toggle is
                  // only flipped if the user clicks "I Agree".
                  setDisclaimerOpen(true)
                }
              }}
              aria-label="Whitelist this address for future withdrawals"
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                {t('withdraw.whitelistThisAddressTitle') || 'Whitelist this address'}
              </div>
              <div className="t3">
                {t('withdraw.whitelistThisAddressBody') ||
                  'Skip email verification on future withdrawals to this address. Active in 24 h or confirm via email.'}
              </div>
            </div>
          </div>
          {saveAddress && (
            <div className="inp" style={{ marginTop: 8 }}>
              <Icon name="user" size={14} />
              <input
                autoFocus
                placeholder={t('withdraw.saveAddressNamePlaceholder') || 'Label (e.g. "Hardware wallet")'}
                value={savedName}
                onChange={e => setSavedName(e.target.value)}
                maxLength={40}
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>
      )}

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('withdraw.withdrawalsIrreversible')}</div>
      </div>

      {/* OTP step — hidden when whitelisted */}
      {!isWhitelisted && (
        <>
          <h3 style={{ marginTop: 10 }}>{t('withdraw.enterOtpTitle') || 'Enter verification code'}</h3>
          <div className="t3" style={{ marginBottom: 6 }}>
            {otpSent
              ? (t('withdraw.otpSentEmail') || 'Sent to your email — check inbox or spam.')
              : (t('withdraw.sendingOtp') || 'Sending code…')}
          </div>

          <div className="pdots">
            {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${otp.length > i ? 'f' : ''}`} />)}
          </div>

          {/* Paste from clipboard — pulls a 6-digit code out of whatever is
              copied (e.g. "Your code is 482931") and fills the keypad. */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  const raw = await navigator.clipboard.readText()
                  const digits = (raw || '').replace(/\D/g, '').slice(0, 6)
                  if (digits.length === 0) {
                    toast.error('Clipboard has no digits')
                    return
                  }
                  setOtp(digits)
                  if (digits.length < 6) {
                    toast.error(`Only ${digits.length} digit${digits.length === 1 ? '' : 's'} found — paste the full 6-digit code`)
                  }
                } catch {
                  toast.error('Could not read clipboard')
                }
              }}
              style={{
                background: 'rgba(0,200,83,.1)',
                color: 'var(--gl)',
                border: '1px solid rgba(0,200,83,.3)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: 'Outfit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="copy" size={12} color="var(--gl)" />
              Paste code
            </button>
          </div>

          <div className="kpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
              <button key={i} className="kk" onClick={() => {
                if (v === '⌫') setOtp(p => p.slice(0, -1))
                else if (v !== '') setOtp(p => p.length < 6 ? p + v : p)
              }} style={{ width: 40, height: 40, fontSize: 14, visibility: v === '' ? 'hidden' : 'visible' }}>
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendIn > 0 || sendOtp.isPending}
            style={{
              background: 'none',
              border: 'none',
              color: resendIn > 0 ? 'var(--text-mid-30)' : 'var(--gl)',
              cursor: resendIn > 0 ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontFamily: 'Outfit',
              textAlign: 'center',
              width: '100%',
              marginTop: 6,
            }}
          >
            {resendIn > 0
              ? (t('withdraw.resendIn', { sec: resendIn }) || `Resend code in ${resendIn}s`)
              : (t('withdraw.resendCode') || 'Resend code')}
          </button>
        </>
      )}

      {/* 2FA TOTP step — shown when backend returned requires2FA OR user has active 2FA + not whitelisted.
          Stays compact below the OTP step to keep the flow visible without a second screen. */}
      {needs2FA && (
        <>
          <h3 style={{ marginTop: 14 }}>{t('withdraw.enter2FATitle') || 'Enter 2FA code'}</h3>
          <div className="t3" style={{ marginBottom: 6 }}>
            {t('withdraw.enter2FABody') || 'Open your authenticator app and enter the 6-digit code for CrymadX.'}
          </div>
          <div className="pdots">
            {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${totp.length > i ? 'f' : ''}`} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  const raw = await navigator.clipboard.readText()
                  const digits = (raw || '').replace(/\D/g, '').slice(0, 6)
                  if (digits.length === 0) {
                    toast.error('Clipboard has no digits')
                    return
                  }
                  setTotp(digits)
                } catch {
                  toast.error('Could not read clipboard')
                }
              }}
              style={{
                background: 'rgba(0,200,83,.1)',
                color: 'var(--gl)',
                border: '1px solid rgba(0,200,83,.3)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: 'Outfit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="copy" size={12} color="var(--gl)" />
              Paste 2FA code
            </button>
          </div>
          <div className="kpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
              <button key={i} className="kk" onClick={() => {
                if (v === '⌫') setTotp(p => p.slice(0, -1))
                else if (v !== '') setTotp(p => p.length < 6 ? p + v : p)
              }} style={{ width: 40, height: 40, fontSize: 14, visibility: v === '' ? 'hidden' : 'visible' }}>
                {v}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button
          className="btn btn-g"
          onClick={submit}
          style={{ flex: 1, padding: 10, margin: 0 }}
          disabled={
            withdraw.isPending ||
            internalTransfer.isPending ||
            wlLoading ||
            (!isWhitelisted && otp.length !== 6) ||
            (needs2FA && totp.length !== 6)
          }
        >
          <Icon name="fp" size={12} color="#fff" />
          {withdraw.isPending ? (t('withdraw.confirming') || 'Confirming…') : t('common.confirm')}
        </button>
      </div>

      <WhitelistDisclaimer
        open={disclaimerOpen}
        onAgree={() => {
          setDisclaimerOpen(false)
          setSaveAddress(true)
          // Bug #5 — capture the moment of agreement so the server can verify
          // it's recent (within 5 min). Stamping at submit-time was lying
          // about when the user actually consented.
          setAcknowledgedAt(new Date().toISOString())
        }}
        onCancel={() => setDisclaimerOpen(false)}
      />
    </PhoneShell>
  )
}

function shorten(addr: string): string {
  if (addr.length < 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/** "in 23h" / "in 14m" / "any moment now" */
function trustedIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'any moment now'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 1) return `in ${hours}h`
  return `in ${Math.max(1, Math.floor(ms / 60_000))}m`
}
