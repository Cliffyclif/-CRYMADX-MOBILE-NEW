import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function ChangePin() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current')
  const [pin, setPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.security.pin.change')

  const stepTitle = step === 'current' ? t('security.pinEnterCurrent') : step === 'new' ? t('security.pinChooseNew') : t('security.pinConfirmNew2')

  const onDigit = (v: string) => {
    if (pin.length >= 6) return
    const next = pin + v
    setPin(next)
    if (next.length === 6) advance(next)
  }
  const onBack = () => setPin(p => p.slice(0, -1))

  const advance = async (val: string) => {
    setError(null)
    if (step === 'current') {
      setCurrentPin(val)
      setPin(''); setStep('new')
    } else if (step === 'new') {
      setNewPin(val)
      setPin(''); setStep('confirm')
    } else {
      if (val !== newPin) { setError(t('security.pinDontMatch')); setPin(''); setStep('new'); return }
      try {
        await m.mutateAsync({ body: { currentPin, newPin: val } })
        nav(ROUTES['route.security.hub'].path, { replace: true })
      } catch (err) { setError((err as Error).message); setPin(''); setStep('current') }
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('security.pinTitle')} />
      <div className="t2">{t('security.pinTxApproval')}</div>

      <div className="steps">
        <div className="step"><div className={`sn ${step === 'current' ? 'a' : 'd'}`}>{step === 'current' ? '1' : '✓'}</div><div className="st">{t('security.pinStepVerify')}</div></div>
        <div className="step"><div className={`sn ${step === 'new' ? 'a' : step === 'confirm' ? 'd' : ''}`}>{step === 'confirm' ? '✓' : '2'}</div><div className="st">{t('security.pinStepNew')}</div></div>
        <div className="step"><div className={`sn ${step === 'confirm' ? 'a' : ''}`}>3</div><div className="st">{t('security.pinStepConfirm2')}</div></div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
        <div className="ic" style={{ width: 54, height: 54 }}><Icon name="pin" size={26} /></div>
        <h3 style={{ marginTop: 10 }}>{stepTitle}</h3>
        <div className="t2" style={{ marginTop: 4 }}>{t('security.pinSixDigit')}</div>

        {error && <div className="g" style={{ padding: 8, marginTop: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

        <div className="pdots">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}</div>

        <div className="kpad" style={{ marginTop: 8 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
            <button key={i} className="kk" style={{ width: 44, height: 44, fontSize: 15, visibility: v === '' ? 'hidden' : 'visible' }} onClick={() => v === '⌫' ? onBack() : v !== '' ? onDigit(String(v)) : null}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </PhoneShell>
  )
}
