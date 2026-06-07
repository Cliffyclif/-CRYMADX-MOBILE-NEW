import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

type Mode = 'change' | 'setup' | 'reset'
type PinStatus = { isSet?: boolean; locked?: boolean; lockedUntil?: string | null }

// Step sequence per mode. 'otp' = 6-digit email code (setup/reset gate).
const SEQ: Record<Mode, string[]> = {
  change: ['current', 'new', 'confirm'],
  setup: ['new', 'confirm', 'otp'],
  reset: ['otp', 'new', 'confirm'],
}

export function ChangePin() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const { data: status, isLoading } = useEndpoint<PinStatus>('api.security.pin.status')
  const otpM = useEndpointMutation('api.security.pin.otp')
  const setupM = useEndpointMutation('api.security.pin.setup')
  const changeM = useEndpointMutation('api.security.pin.change')
  const resetM = useEndpointMutation('api.security.pin.reset')

  const [mode, setMode] = useState<Mode | null>(null)
  const [step, setStep] = useState(0)
  const [vals, setVals] = useState<{ current?: string; new?: string; otp?: string }>({})
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [otpRequested, setOtpRequested] = useState(false)

  // Decide mode once status arrives (isSet → change, else first-time setup).
  useEffect(() => {
    if (!status || mode) return
    setMode(status.isSet ? 'change' : 'setup')
  }, [status, mode])

  const seq = mode ? SEQ[mode] : []
  const cur = seq[step]
  const busy = otpM.isPending || setupM.isPending || changeM.isPending || resetM.isPending
  const locked = !!status?.locked

  // Email the OTP the first time an 'otp' step is shown.
  useEffect(() => {
    if (cur === 'otp' && !otpRequested && !locked) {
      setOtpRequested(true)
      otpM.mutateAsync({}).then((r: any) => setOtpSentTo(r?.sentTo ?? 'your email')).catch(() => {})
    }
  }, [cur]) // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => { setStep(0); setPin(''); setVals({}) }

  const onDigit = (v: string) => {
    if (pin.length >= 6 || busy) return
    const next = pin + v
    setPin(next)
    if (next.length === 6) advance(next)
  }
  const onBack = () => setPin(p => p.slice(0, -1))

  const advance = async (val: string) => {
    setError(null)
    const name = seq[step]
    const nv = { ...vals }
    if (name === 'current') nv.current = val
    else if (name === 'new') nv.new = val
    else if (name === 'otp') nv.otp = val
    else if (name === 'confirm') {
      if (val !== vals.new) { setError(t('security.pinDontMatch')); setPin(''); setStep(seq.indexOf('new')); return }
    }
    setVals(nv)
    setPin('')
    if (step === seq.length - 1) await submit(nv)
    else setStep(step + 1)
  }

  const submit = async (v: { current?: string; new?: string; otp?: string }) => {
    try {
      if (mode === 'setup') await setupM.mutateAsync({ body: { newPin: v.new, otp: v.otp } })
      else if (mode === 'change') await changeM.mutateAsync({ body: { currentPin: v.current, newPin: v.new } })
      else await resetM.mutateAsync({ body: { otp: v.otp, newPin: v.new } })
      nav(ROUTES['route.security.hub'].path, { replace: true })
    } catch (err) {
      setError((err as Error).message || 'Something went wrong')
      restart()
    }
  }

  const goForgot = () => { setMode('reset'); setOtpRequested(false); setOtpSentTo(null); restart() }

  const titleFor = (s: string): string =>
    s === 'current' ? t('security.pinEnterCurrent')
    : s === 'otp' ? 'Enter Email Code'
    : s === 'confirm' ? t('security.pinConfirmNew2')
    : mode === 'setup' ? 'Choose Your PIN' : t('security.pinChooseNew')

  const labelFor = (s: string): string =>
    s === 'current' ? t('security.pinStepVerify')
    : s === 'otp' ? 'Email Code'
    : s === 'confirm' ? t('security.pinStepConfirm2')
    : t('security.pinStepNew')

  // ── Loading / locked states ──
  if (isLoading || !mode) {
    return <PhoneShell noTabs><ScreenHeader title={t('security.pinTitle')} /><div className="g" style={{ padding: 20, marginTop: 12, textAlign: 'center' }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }
  if (locked) {
    const until = status?.lockedUntil ? new Date(status.lockedUntil).toLocaleTimeString() : ''
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('security.pinTitle')} />
        <div className="g" style={{ padding: 18, marginTop: 14, textAlign: 'center', borderLeft: '3px solid var(--r)' }}>
          <div style={{ fontSize: 30 }}>🔒</div>
          <h3 style={{ marginTop: 6 }}>Too many attempts</h3>
          <div className="t3" style={{ marginTop: 4 }}>For your security, PIN entry is locked{until ? ` until ${until}` : ''}. Please try again later.</div>
        </div>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('security.pinTitle')} />
      <div className="t2">{mode === 'setup' ? 'Set up your transaction PIN' : t('security.pinTxApproval')}</div>

      <div className="steps">
        {seq.map((s, i) => (
          <div className="step" key={s}>
            <div className={`sn ${i === step ? 'a' : i < step ? 'd' : ''}`}>{i < step ? '✓' : i + 1}</div>
            <div className="st">{labelFor(s)}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
        <div className="ic" style={{ width: 54, height: 54 }}><Icon name={cur === 'otp' ? 'mail' : 'pin'} size={26} /></div>
        <h3 style={{ marginTop: 10 }}>{titleFor(cur)}</h3>
        <div className="t2" style={{ marginTop: 4 }}>
          {cur === 'otp' ? `6-digit code sent to ${otpSentTo ?? '…'}` : t('security.pinSixDigit')}
        </div>

        {error && <div className="g" style={{ padding: 8, marginTop: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <div className="pdots">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}</div>

        <div className="kpad" style={{ marginTop: 12, gap: 10, padding: '0 6px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
            <button
              key={i}
              className="kk"
              style={{ width: '100%', height: 64, fontSize: 26, fontWeight: 700, borderRadius: 16, visibility: v === '' ? 'hidden' : 'visible' }}
              onClick={() => v === '⌫' ? onBack() : v !== '' ? onDigit(String(v)) : null}
            >
              {v}
            </button>
          ))}
        </div>

        {mode === 'change' && (
          <button onClick={goForgot} style={{ background: 'none', border: 'none', color: 'var(--gl)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 14, fontFamily: 'Outfit' }}>
            Forgot PIN?
          </button>
        )}
        {cur === 'otp' && (
          <button onClick={() => { setOtpRequested(false); setOtpSentTo(null); otpM.mutateAsync({}).then((r: any) => setOtpSentTo(r?.sentTo ?? 'your email')).catch(() => {}) }} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--text-mid-50)', fontSize: 12, cursor: 'pointer', marginTop: 10, fontFamily: 'Outfit' }}>
            Resend code
          </button>
        )}
      </div>
    </PhoneShell>
  )
}
