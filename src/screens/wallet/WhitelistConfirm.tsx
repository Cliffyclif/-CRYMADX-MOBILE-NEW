import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

type Status = 'idle' | 'loading' | 'success' | 'already' | 'expired' | 'error'

interface ConfirmResponse {
  ok: boolean
  alreadyActive?: boolean
  item?: {
    id: string
    name?: string
    asset?: string | null
    chain?: string
    address?: string
    status?: string
  }
}

/**
 * Lands here from the email link:
 *   /wallet/whitelist/confirm?id=ABC123&token=xyz
 *
 * Public route — no auth required (the token in the URL is the proof).
 * On success, shows a confirmation card and auto-redirects to /wallet/beneficiaries
 * after 3 seconds.
 */
export function WhitelistConfirm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const token = params.get('token') || ''

  const [status, setStatus] = useState<Status>('idle')
  const [item, setItem] = useState<ConfirmResponse['item']>()
  const [errorMsg, setErrorMsg] = useState<string>('')
  const calledRef = useRef(false)

  const confirm = useEndpointMutation<{ pathParams: { id: string }; body: { token: string } }, ConfirmResponse>(
    'api.wallet.whitelist.confirm',
  )

  // Fire confirm exactly once on mount.
  useEffect(() => {
    if (calledRef.current) return
    if (!id || !token) {
      setStatus('error')
      setErrorMsg('Confirmation link is missing required parameters. Open the link from your email again.')
      return
    }
    calledRef.current = true
    setStatus('loading')
    confirm
      .mutateAsync({ pathParams: { id }, body: { token } })
      .then((res) => {
        setItem(res?.item)
        setStatus(res?.alreadyActive ? 'already' : 'success')
      })
      .catch((err: any) => {
        const code = err?.code || ''
        const msg = err?.message || ''
        if (code === 'TOKEN_INVALID' || /token.*expired|already used|invalid/i.test(msg)) {
          setStatus('expired')
        } else if (code === 'NOT_FOUND' || err?.statusCode === 404) {
          setStatus('expired')
        } else {
          setStatus('error')
          setErrorMsg(msg || 'Could not confirm address. Try again or contact support.')
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-redirect after success.
  useEffect(() => {
    if (status !== 'success' && status !== 'already') return
    const t = setTimeout(() => {
      nav(ROUTES['route.wallet.beneficiaries'].path, { replace: true })
    }, 3500)
    return () => clearTimeout(t)
  }, [status, nav])

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('whitelist.confirmTitle') || 'Confirm address'} />

      {status === 'loading' && (
        <div className="g" style={{ padding: 24, textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 36 }}>⏳</div>
          <div className="t2" style={{ marginTop: 12 }}>
            {t('whitelist.confirming') || 'Confirming your address…'}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div
          className="g"
          style={{
            padding: 28,
            textAlign: 'center',
            marginTop: 24,
            borderLeft: '3px solid var(--gl)',
            background: 'rgba(0,200,83,.06)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: 'rgba(0,200,83,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="check" size={28} color="var(--gl)" />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gl)' }}>
            {t('whitelist.confirmedTitle') || 'Address confirmed'}
          </h2>
          {item?.name && (
            <div className="t2" style={{ marginTop: 8, fontWeight: 700, color: 'var(--text-strong)' }}>
              {item.name}
            </div>
          )}
          {item?.address && (
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'var(--text-mid-40)',
                marginTop: 4,
                wordBreak: 'break-all',
              }}
            >
              {item.address}
            </div>
          )}
          <div className="t3" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
            {t('whitelist.confirmedBody') ||
              'This address is now trusted. Future withdrawals to it will skip email and 2FA prompts.'}
          </div>
          <div className="t3" style={{ marginTop: 20, fontSize: 11, opacity: 0.7 }}>
            Redirecting to your saved addresses…
          </div>
        </div>
      )}

      {status === 'already' && (
        <div
          className="g"
          style={{
            padding: 28,
            textAlign: 'center',
            marginTop: 24,
            borderLeft: '3px solid var(--gd)',
            background: 'rgba(255,193,7,.06)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: 'rgba(255,193,7,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="check" size={28} color="var(--gd)" />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gd)' }}>
            {t('whitelist.alreadyConfirmed') || 'Already confirmed'}
          </h2>
          <div className="t3" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
            {t('whitelist.alreadyConfirmedBody') ||
              "This address is already active — looks like the link was already used. You're all set."}
          </div>
          <div className="t3" style={{ marginTop: 20, fontSize: 11, opacity: 0.7 }}>
            Redirecting…
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div
          className="g"
          style={{
            padding: 28,
            textAlign: 'center',
            marginTop: 24,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,77,77,.06)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: 'rgba(255,77,77,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="x" size={28} color="var(--r)" />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--r)' }}>
            {t('whitelist.linkExpired') || 'Link expired or invalid'}
          </h2>
          <div className="t3" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
            {t('whitelist.linkExpiredBody') ||
              "The confirmation link has been used already, or the address was removed. To re-add it, go to your saved addresses."}
          </div>
          <button
            className="btn btn-g"
            style={{ marginTop: 20, padding: 12, width: '100%', fontSize: 14 }}
            onClick={() => nav(ROUTES['route.wallet.beneficiaries'].path, { replace: true })}
          >
            {t('whitelist.openAddressBook') || 'Go to saved addresses'}
          </button>
        </div>
      )}

      {status === 'error' && (
        <div
          className="g"
          style={{
            padding: 24,
            marginTop: 24,
            borderLeft: '3px solid var(--r)',
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--r)' }}>Something went wrong</h3>
          <div className="t3" style={{ marginTop: 8 }}>{errorMsg}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            <button
              className="btn btn-o"
              style={{ flex: 1, padding: 10, fontSize: 13, margin: 0 }}
              onClick={() => {
                calledRef.current = false
                setStatus('idle')
                setErrorMsg('')
              }}
            >
              Retry
            </button>
            <button
              className="btn btn-g"
              style={{ flex: 1, padding: 10, fontSize: 13, margin: 0 }}
              onClick={() => nav(ROUTES['route.wallet.beneficiaries'].path, { replace: true })}
            >
              Go to addresses
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  )
}
