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

type WithdrawState = { asset: string; network: string; address: string; amount: string; fee: string }

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

  // Check whether this exact address is already whitelisted+active.
  // If yes, the OTP step is hidden — backend will accept the withdrawal
  // without an otpCode for active whitelist matches.
  const { data: wl, isLoading: wlLoading } = useEndpoint<WhitelistCheck>(
    'api.wallet.whitelist.check',
    {
      query: state
        ? { asset: state.asset, chain: state.network, address: state.address }
        : {},
    },
    { enabled: !!state },
  )
  const isWhitelisted = !!wl?.whitelisted

  const sendOtp = useEndpointMutation<{ body: { purpose: string } }, unknown>('api.otp.send')
  const withdraw = useEndpointMutation<{ body: WithdrawState & { otpCode?: string } }, Transaction>('api.wallet.withdraw.create', {
    invalidates: ['api.wallet.balances.list', 'api.tx.list'],
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

  const total = fmt(parseFloat(state.amount) + parseFloat(state.fee))

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
    try {
      const body = isWhitelisted
        ? { ...state }
        : { ...state, otpCode: otp }
      const tx = await withdraw.mutateAsync({ body })
      haptics.success()

      // Save to address book if the user opted in. The disclaimer modal has
      // already been agreed-to in the toggle handler below — that's why we
      // can include the acknowledgedAt stamp directly here.
      if (!isWhitelisted && saveAddress && savedName.trim()) {
        try {
          await saveBeneficiary.mutateAsync({
            body: {
              name: savedName.trim(),
              asset: state.asset,
              network: state.network,
              chain: state.network,
              address: state.address,
              acknowledgedAt: new Date().toISOString(),
            },
          })
          toast.success(
            t('withdraw.addressSavedPending') ||
              `${savedName.trim()} saved — active in 24 hours (or confirm via email)`,
          )
        } catch (e: any) {
          // Don't block the success flow on a save failure
          console.warn('[withdraw] Could not save address:', e?.message)
        }
      }

      nav(routeFor('route.wallet.tx-detail', { txId: tx.id }), { replace: true })
    } catch (err) {
      haptics.error()
      setError((err as Error).message)
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

      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
        <div className="t3">{t('withdraw.youSend')}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '6px 0' }}>{state.amount} {state.asset}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('common.to'), shorten(state.address)],
          [t('common.network'), state.network],
          [t('common.amount'), `${state.amount} ${state.asset}`],
          [t('withdraw.networkFee'), `${state.fee} ${state.asset}`],
          [t('withdraw.totalDeducted'), `${total} ${state.asset}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

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

      {/* Save-to-address-book toggle — hidden when already whitelisted */}
      {!isWhitelisted && (
        <div className="g" style={{ padding: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`tgl ${saveAddress ? 'on' : 'off'}`}
              onClick={() => {
                if (saveAddress) {
                  // Toggling OFF — no confirmation needed.
                  setSaveAddress(false)
                  setSavedName('')
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

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button
          className="btn btn-g"
          onClick={submit}
          style={{ flex: 1, padding: 10, margin: 0 }}
          disabled={
            withdraw.isPending ||
            wlLoading ||
            (!isWhitelisted && otp.length !== 6)
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
