import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { api } from '../../api/client'
import { ROUTES } from '../../routes'

export function TwoFactorSetup() {
  const { t } = useTranslation()
  const nav = useNavigate()

  // Current 2FA status — gates the whole screen. Until we know it, we render a
  // loader and NEVER call /2fa/setup (which would mint a new secret).
  const { data: sec, isLoading: secLoading } = useEndpoint<{ twoFAEnabled?: boolean }>('api.security.summary')
  const enabled = !!sec?.twoFAEnabled

  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const enableM = useEndpointMutation('api.security.2fa.enable', { invalidates: ['api.security.summary'] })
  const disableM = useEndpointMutation('api.security.2fa.disable', { invalidates: ['api.security.summary'] })

  const [secret, setSecret] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  // Synchronous one-shot guard: each /2fa/setup call mints a NEW secret, so if
  // React's dev double-invoke (or a re-render) fires it twice, the QR on screen
  // ends up mismatched with the last-stored secret and the code never verifies.
  const setupStarted = useRef(false)

  const loadSetup = async () => {
    if (setupStarted.current) return
    setupStarted.current = true
    setSetupLoading(true)
    setSetupError(null)
    try {
      const r = await api<{ secret?: string; qrCodeUrl?: string }>('api.security.2fa.setup', { body: {} })
      setSecret(r.secret ?? '')
      setQrUrl(r.qrCodeUrl ?? '')
    } catch (e) {
      setupStarted.current = false // allow a retry after a failure
      setSetupError((e as Error).message || 'Could not start 2FA setup.')
    } finally {
      setSetupLoading(false)
    }
  }

  // Generate a NEW secret/QR ONLY once we've confirmed 2FA is currently OFF.
  // This prevents anyone with the unlocked phone from re-enrolling a fresh
  // authenticator on an account that already has 2FA.
  useEffect(() => {
    if (!secLoading && !enabled && !secret && !setupLoading && !setupError) loadSetup()
  }, [secLoading, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1)
    setCode(prev => { const n = [...prev]; n[i] = d; return n })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }
  const codeStr = code.join('')
  const codeFull = code.every(c => !!c)

  const verifyEnroll = async () => {
    setError(null)
    try {
      const res = await enableM.mutateAsync({ body: { code: codeStr } }) as { backupCodes?: string[] }
      nav(ROUTES['route.security.backup-codes'].path, { replace: true, state: { backupCodes: res?.backupCodes ?? [] } })
    } catch (err) { setError((err as Error).message) }
  }

  const disable = async () => {
    setError(null)
    try {
      await disableM.mutateAsync({ body: { code: codeStr } })
      nav(-1) // back to Security hub; status refetches as disabled
    } catch (err) { setError((err as Error).message) }
  }

  const copySecret = async () => {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const isOtpauth = qrUrl.startsWith('otpauth://')

  const CodeInputs = (
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
  )

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('security.twoFactorShort')} />

      {secLoading ? (
        <div className="g" style={{ padding: 24, marginTop: 10, textAlign: 'center' }}>
          <div className="t3">{t('common.loading')}</div>
        </div>
      ) : enabled ? (
        /* ─── 2FA already enabled: management, NOT re-enrollment ─── */
        <>
          <div className="g" style={{ padding: 16, marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid var(--gl)' }}>
            <div className="li-i" style={{ background: 'rgba(0,200,83,.12)', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="shield" size={18} color="var(--gl)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-strong)' }}>{t('security.twoFactorShort')} · <span className="grn">{t('security.enabled')}</span></div>
              <div className="t3" style={{ marginTop: 2 }}>Your account is protected with an authenticator app.</div>
            </div>
          </div>

          <div className="g" style={{ padding: 14, marginTop: 8 }}>
            <h3 style={{ marginTop: 0 }}>Turn off 2FA</h3>
            <div className="t3" style={{ lineHeight: 1.5, marginBottom: 4 }}>
              Enter a current 6-digit code from your authenticator to disable two-factor authentication.
            </div>
            {CodeInputs}
            {error && <div style={{ color: 'var(--r)', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>{error}</div>}
            <button
              className="btn"
              style={{ marginTop: 4, background: 'rgba(239,68,68,.12)', color: 'var(--r)', border: '1px solid rgba(239,68,68,.3)' }}
              onClick={disable}
              disabled={disableM.isPending || !codeFull}
            >
              {disableM.isPending ? t('auth.verifying') : 'Disable 2FA'}
            </button>
          </div>

          <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
            <span className="gld">💡</span>
            <div className="t3" style={{ lineHeight: 1.4 }}>
              To switch authenticators, disable 2FA here first (with a current code), then set it up again.
            </div>
          </div>
        </>
      ) : (
        /* ─── 2FA off: enrollment flow ─── */
        <>
          <div className="t2">{t('security.addLayer')}</div>

          <div className="steps">
            <div className="step"><div className="sn d">✓</div><div className="st">{t('security.stepApp')}</div></div>
            <div className="step"><div className="sn a">2</div><div className="st">{t('security.stepScan')}</div></div>
            <div className="step"><div className="sn">3</div><div className="st">{t('security.stepVerify')}</div></div>
          </div>

          <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
            <div className="t3" style={{ marginBottom: 10 }}>{t('security.scanQrPhrase')}</div>
            {setupLoading ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="t3">{t('common.loading')}</div></div>
            ) : setupError ? (
              <div style={{ padding: 12 }}>
                <div style={{ color: 'var(--r)', fontSize: 13, marginBottom: 8 }}>{setupError}</div>
                <button className="btn btn-g" style={{ maxWidth: 160, margin: '0 auto' }} onClick={loadSetup}>{t('common.retry', { defaultValue: 'Retry' })}</button>
              </div>
            ) : isOtpauth ? (
              <div style={{ display: 'inline-block', padding: 10, background: '#fff', borderRadius: 12 }}><QRCodeSVG value={qrUrl} size={168} level="M" /></div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="2FA QR code" width={188} height={188} style={{ borderRadius: 12, background: '#fff', padding: 10, boxSizing: 'border-box' }} />
            ) : (
              <div className="t3" style={{ padding: 16 }}>{t('security.orEnterManually')}</div>
            )}
          </div>

          <div className="g" style={{ padding: 10, marginTop: 6 }}>
            <div className="t3" style={{ marginBottom: 4 }}>{t('security.orEnterManually')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-strong)', flex: 1, minWidth: 0, letterSpacing: 1, fontWeight: 700, wordBreak: 'break-all' }}>{secret || '—'}</div>
              <button onClick={copySecret} disabled={!secret} style={{ background: 'none', border: 'none', cursor: secret ? 'pointer' : 'default', display: 'flex', flexShrink: 0 }}>
                <Icon name={copied ? 'check' : 'copy'} size={14} color="var(--gl)" />
              </button>
            </div>
          </div>

          <h3 style={{ marginTop: 10 }}>{t('security.enter6DigitCode')}</h3>
          {CodeInputs}
          {error && <div className="g" style={{ padding: 10, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

          <button className="btn btn-g" style={{ marginTop: 8 }} onClick={verifyEnroll} disabled={enableM.isPending || !codeFull || !secret}>
            {enableM.isPending ? t('auth.verifying') : t('security.verifyAndEnable')}
          </button>
        </>
      )}
    </PhoneShell>
  )
}
