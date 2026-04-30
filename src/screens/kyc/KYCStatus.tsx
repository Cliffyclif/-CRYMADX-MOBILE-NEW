import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useAuth } from '../../stores/auth'
import { ROUTES } from '../../routes'
import { kycService, type KYCStatusResponse } from '../../services/kycService'

/**
 * KYC status screen — mirrors the real backend statuses ('none' | 'pending'
 * | 'processing' | 'manual_review' | 'approved' | 'rejected'). No more
 * fake 3-level system or hardcoded user data.
 */
export function KYCStatus() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)

  const [data, setData] = useState<KYCStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    kycService
      .getStatus()
      .then(r => {
        if (!cancelled) {
          setData(r)
          setError(null)
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          // 404 / "no submission yet" is normal — treat as 'none'.
          if (e?.status === 404 || /not found|no submission/i.test(e?.message ?? '')) {
            setData({ status: 'none' })
            setError(null)
          } else {
            setError(e?.message ?? 'Could not load KYC status')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const status = data?.status ?? 'none'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('kyc.kycVerification') || 'Identity verification'} />

      {loading && (
        <div className="g" style={{ padding: 32, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('common.loading') || 'Loading…'}</div>
        </div>
      )}

      {error && !loading && (
        <div
          className="g"
          style={{
            padding: 14,
            marginTop: 8,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.06)',
          }}
        >
          <div style={{ color: 'var(--r)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Could not load status
          </div>
          <div className="t3">{error}</div>
        </div>
      )}

      {!loading && !error && status === 'none' && <NotStarted />}
      {!loading && !error && (status === 'pending' || status === 'processing' || status === 'manual_review') && (
        <InProgress status={status} submittedAt={data?.submittedAt} />
      )}
      {!loading && !error && status === 'approved' && <Approved data={data!} userName={user ? `${user.firstName} ${user.lastName}` : undefined} />}
      {!loading && !error && status === 'rejected' && <Rejected reason={data?.rejectionReason} onRetry={() => nav(ROUTES['route.kyc.flow'].path)} />}

      {/* Why-verify section, always visible */}
      <div className="g" style={{ padding: 12, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Why verify?</h3>
        {[
          'Required to withdraw fiat or crypto to external wallets',
          'Higher transaction limits across deposit, swap, and trade',
          'Protects your account if a sign-in is ever compromised',
          'Required by law in most jurisdictions',
        ].map(line => (
          <div key={line} style={{ display: 'flex', gap: 6, margin: '4px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--gl)', fontWeight: 700 }}>✓</span>
            <span style={{ color: 'var(--text-mid)' }}>{line}</span>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Status variants
// ─────────────────────────────────────────────────────────────────────────

function NotStarted() {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <>
      <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
        <div
          className="ic"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto',
            background: 'rgba(255,193,7,.15)',
          }}
        >
          <Icon name="shield" size={32} color="var(--gd)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 10 }}>
          You haven't verified yet
        </div>
        <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
          Verification takes about 3 minutes. You'll need a government ID and a quick selfie.
          Most submissions are approved automatically within seconds.
        </div>
      </div>

      <button
        className="btn btn-g"
        style={{ marginTop: 10 }}
        onClick={() => nav(ROUTES['route.kyc.flow'].path)}
      >
        <Icon name="shield" size={14} color="#fff" />
        {t('kyc.startVerification') || 'Start verification'}
      </button>
    </>
  )
}

function InProgress({ status, submittedAt }: { status: 'pending' | 'processing' | 'manual_review'; submittedAt?: string }) {
  const isManual = status === 'manual_review'
  const title = isManual
    ? 'Under manual review'
    : status === 'processing'
    ? 'Verifying your documents'
    : 'Verification submitted'
  const body = isManual
    ? 'Our team is reviewing your submission. This usually takes up to 24 hours. You\'ll get an email when there\'s an update.'
    : status === 'processing'
    ? 'OCR + face match in progress. This usually completes in under a minute.'
    : 'We\'ve received your documents and started processing them.'

  return (
    <>
      <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
        <div
          className="ic"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto',
            background: 'rgba(255,193,7,.15)',
            boxShadow: '0 0 24px rgba(255,193,7,.18)',
          }}
        >
          <Icon name="clock" size={32} color="var(--gd)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 10 }}>
          {title}
        </div>
        <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
          {body}
        </div>
        {submittedAt && (
          <div className="t3" style={{ marginTop: 8, fontSize: 11 }}>
            Submitted {new Date(submittedAt).toLocaleString()}
          </div>
        )}
      </div>

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
        <Icon name="mail" size={16} color="var(--gd)" />
        <div className="t3" style={{ fontSize: 12, lineHeight: 1.4 }}>
          We'll email you the moment there's a decision. You don't need to do anything else.
        </div>
      </div>
    </>
  )
}

function Approved({ data, userName }: { data: KYCStatusResponse; userName?: string }) {
  const ext = data.extractedData
  // Prefer extracted data from the verified ID; fall back to the user store.
  const name = (ext?.firstName || ext?.lastName)
    ? `${ext?.firstName ?? ''} ${ext?.lastName ?? ''}`.trim()
    : userName

  return (
    <>
      <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
        <div
          className="ic"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto',
            background: 'rgba(0,200,83,.15)',
            boxShadow: '0 0 24px rgba(0,200,83,.25)',
          }}
        >
          <Icon name="check" size={32} color="var(--gl)" />
        </div>
        <div className="badge badge-g" style={{ marginTop: 10, fontSize: 11 }}>
          VERIFIED
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 8 }}>
          {name || 'Your identity is verified'}
        </div>
        <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
          You can deposit, withdraw, swap, and trade without restriction.
        </div>
      </div>

      {ext && (ext.dateOfBirth || ext.nationality || ext.idNumber) && (
        <div className="g" style={{ padding: 12, marginTop: 6 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 13 }}>Verified information</h3>
          {ext.dateOfBirth && <Row k="Date of birth" v={ext.dateOfBirth} />}
          {ext.nationality && <Row k="Nationality" v={ext.nationality} />}
          {data.documentType && <Row k="Document" v={prettyDocType(data.documentType)} />}
          {data.processedAt && <Row k="Verified" v={new Date(data.processedAt).toLocaleDateString()} />}
        </div>
      )}
    </>
  )
}

function Rejected({ reason, onRetry }: { reason?: string; onRetry: () => void }) {
  return (
    <>
      <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
        <div
          className="ic"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto',
            background: 'rgba(255,82,82,.15)',
          }}
        >
          <Icon name="x" size={32} color="var(--r)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 10 }}>
          Verification failed
        </div>
        <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
          We couldn't verify your identity from the documents you provided. You can try again
          with a clearer photo or a different ID.
        </div>
      </div>

      {reason && (
        <div
          className="g"
          style={{
            padding: 12,
            marginTop: 6,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.06)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--r)', marginBottom: 2 }}>
            Reason
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-strong)' }}>{reason}</div>
        </div>
      )}

      <button className="btn btn-g" style={{ marginTop: 10 }} onClick={onRetry}>
        <Icon name="refresh" size={14} color="#fff" />
        Try again
      </button>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
      <span className="t3">{k}</span>
      <span style={{ color: 'var(--text-strong)', textAlign: 'right' }}>{v}</span>
    </div>
  )
}

function prettyDocType(t: string): string {
  switch (t) {
    case 'passport':
      return 'Passport'
    case 'driving_license':
      return "Driver's license"
    case 'national_id':
      return 'National ID'
    default:
      return t
  }
}
