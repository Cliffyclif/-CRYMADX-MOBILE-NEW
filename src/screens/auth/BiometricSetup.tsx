import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES } from '../../routes'
import { useBiometricLock } from '../../hooks/useBiometricLock'
import { haptics } from '../../lib/haptics'

export function BiometricSetup() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { biometricAvailable, toggleBiometric } = useBiometricLock(true)
  const [busy, setBusy] = useState(false)

  const benefits: Array<[string, string]> = [
    [t('auth.biometricBenefit1'), t('auth.biometricBenefit1Sub')],
    [t('auth.biometricBenefit2'), t('auth.biometricBenefit2Sub')],
    [t('auth.biometricBenefit3'), t('auth.biometricBenefit3Sub')],
  ]

  const enable = async () => {
    if (!biometricAvailable) {
      toast.error(t('auth.biometricUnavailable') || 'Biometric not available on this device')
      return
    }
    setBusy(true)
    try {
      const ok = await toggleBiometric(true)
      if (ok) {
        haptics.success()
        toast.success(t('auth.biometricEnabled') || 'Biometric unlock enabled')
        nav(ROUTES['route.tab.home'].path, { replace: true })
      } else {
        haptics.error()
        toast.error(t('auth.biometricFailed') || 'Biometric setup cancelled')
      }
    } finally {
      setBusy(false)
    }
  }

  const skip = () => {
    haptics.selection()
    nav(ROUTES['route.tab.home'].path, { replace: true })
  }

  return (
    <PhoneShell noTabs bgVariant="aurora">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
        <div className="auth-card">
          <div style={{ textAlign: 'center', margin: '0 0 12px' }}>
            <div className="ic" style={{ width: 90, height: 90, margin: '0 auto', boxShadow: '0 0 40px rgba(0,200,83,.2)' }}>
              <Icon name="fp" size={46} />
            </div>
            <h2 style={{ marginTop: 14 }}>{t('auth.biometricBig')}</h2>
            <div className="t2" style={{ marginTop: 8, lineHeight: 1.5 }}>
              {t('auth.biometricBigBody')}
            </div>
            {!biometricAvailable && (
              <div className="t3" style={{ marginTop: 8, color: 'var(--r)' }}>
                {t('auth.biometricUnavailable') || 'Biometric not available on this device'}
              </div>
            )}
          </div>

          <div style={{ padding: '6px 4px' }}>
            {benefits.map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 10, margin: '10px 0', alignItems: 'center' }}>
                <div className="grn" style={{ fontSize: 18 }}>✓</div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 700 }}>{title}</div>
                  <div className="t3">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-g" onClick={enable} disabled={busy || !biometricAvailable}>
            {busy ? (t('common.loading') || 'Loading…') : t('auth.biometricBig')}
          </button>
          <button className="btn btn-o" onClick={skip}>{t('auth.usePinOnly')}</button>
        </div>
      </div>
    </PhoneShell>
  )
}
