import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function TwoFactorSetup() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [step, setStep] = useState<'app' | 'scan' | 'verify'>('scan')
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const m = useEndpointMutation('api.security.2fa.enable', { invalidates: ['api.security.summary'] })

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1)
    setCode(prev => { const n = [...prev]; n[i] = d; return n })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  const submit = async () => {
    setError(null)
    try {
      await m.mutateAsync({ body: { code: code.join('') } })
      nav(ROUTES['route.security.backup-codes'].path, { replace: true })
    } catch (err) { setError((err as Error).message) }
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText('JBSWY3DPEHPK3PXP')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.twoFactorShort')} />
      <div className="t2">{t('security.addLayer')}</div>

      <div className="steps">
        <div className="step"><div className={`sn ${step === 'app' ? 'a' : 'd'}`}>{step === 'app' ? '1' : '✓'}</div><div className="st">{t('security.stepApp')}</div></div>
        <div className="step"><div className={`sn ${step === 'scan' ? 'a' : step === 'verify' ? 'd' : ''}`}>{step === 'verify' ? '✓' : '2'}</div><div className="st">{t('security.stepScan')}</div></div>
        <div className="step"><div className={`sn ${step === 'verify' ? 'a' : ''}`}>3</div><div className="st">{t('security.stepVerify')}</div></div>
      </div>

      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
        <div className="t3" style={{ marginBottom: 8 }}>{t('security.scanQrPhrase')}</div>
        <FakeQR />
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('security.orEnterManually')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-strong)', flex: 1, letterSpacing: 1, fontWeight: 700 }}>JBSWY3DPEHPK3PXP</div>
          <button onClick={copySecret} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name={copied ? 'check' : 'copy'} size={14} color="var(--gl)" />
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('security.enter6DigitCode')}</h3>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '8px 0' }}>
        {code.map((d, i) => (
          <input
            key={i} ref={el => { refs.current[i] = el }}
            value={d} onChange={e => setDigit(i, e.target.value)}
            inputMode="numeric" maxLength={1}
            className="g"
            style={{ width: 38, height: 46, textAlign: 'center', fontSize: 18, fontWeight: 800, color: 'var(--gl)', border: 'none', borderRadius: 12 }}
          />
        ))}
      </div>

      {error && <div className="g" style={{ padding: 10, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => { setStep('verify'); submit() }} disabled={m.isPending || code.some(c => !c)}>
        {m.isPending ? t('auth.verifying') : t('security.verifyAndEnable')}
      </button>
    </PhoneShell>
  )
}

function FakeQR() {
  return (
    <div className="qr" style={{ margin: '0 auto' }}>
      {Array.from({ length: 121 }, (_, i) => {
        const r = Math.floor(i / 11), c = i % 11
        const corner = (r < 4 && c < 4) || (r < 4 && c > 6) || (r > 6 && c < 4)
        return <span key={i} style={{ background: corner || (i % 3 === 0) ? undefined : 'transparent' }} />
      })}
    </div>
  )
}
