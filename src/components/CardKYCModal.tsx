import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { useEndpoint } from '../api/hooks'

/**
 * In-app AlchemyPay PageMode KYC modal — mirrors the web exchange's CardKYCModal.
 * Loads the AlchemyPay/fiat24 verification URL in an iframe, polls card KYC status,
 * and falls back to opening in the system browser if the page won't frame.
 */
type Props = {
  isOpen: boolean
  kycUrl: string
  onClose: () => void
  onComplete: () => void
  onRejected?: () => void
}

type Phase = 'loading' | 'ready' | 'completed' | 'rejected' | 'iframe_error'

export function CardKYCModal({ isOpen, kycUrl, onClose, onComplete, onRejected }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Poll KYC status while open.
  const { data: kyc } = useEndpoint<{ status?: string }>(
    'api.card.kyc.status',
    {},
    { enabled: isOpen, refetchInterval: 5000, refetchOnWindowFocus: false },
  )

  useEffect(() => {
    if (!isOpen) { setPhase('loading'); setIframeLoaded(false) }
  }, [isOpen])

  // 25s load-failure fallback (AlchemyPay's page can be slow / may block framing).
  useEffect(() => {
    if (!isOpen || phase !== 'loading') return
    const t = setTimeout(() => { if (!iframeLoaded) setPhase('iframe_error') }, 25000)
    return () => clearTimeout(t)
  }, [isOpen, phase, iframeLoaded])

  // React to polled status.
  useEffect(() => {
    const s = (kyc?.status || '').toUpperCase()
    if (s === 'COMPLETED' || s === 'APPROVED') { setPhase('completed'); onComplete() }
    else if (s === 'REJECTED' || s === 'FAILED') { setPhase('rejected'); onRejected?.() }
  }, [kyc?.status, onComplete, onRejected])

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  if (!isOpen) return null

  const Center = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)',
      zIndex: 5, padding: 32, textAlign: 'center',
    }}>{children}</div>
  )

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Identity verification"
      data-no-swipe-back
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(10px)', padding: 12,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480, height: '90vh', maxHeight: 760,
        background: 'var(--bg)', borderRadius: 20, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', position: 'relative',
        boxShadow: '0 25px 80px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--divider-soft)', flexShrink: 0,
        }}>
          <Icon name="shield" size={18} color="var(--gl)" />
          <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>
            Identity Verification
          </span>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={16} color="var(--text-mid-50)" />
          </button>
        </div>

        {/* Content area (below the header) — iframe + status overlays all fill
            and centre within THIS region so nothing overlaps the header. */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {/* The KYC iframe */}
          {(phase === 'loading' || phase === 'ready') && (
            <iframe
              src={kycUrl}
              title="Identity Verification"
              allow="camera;microphone"
              onLoad={() => { setIframeLoaded(true); setPhase('ready') }}
              onError={() => setPhase('iframe_error')}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#fff', opacity: iframeLoaded ? 1 : 0, transition: 'opacity .3s ease' }}
            />
          )}

          {/* Loading */}
          {phase === 'loading' && !iframeLoaded && (
            <Center>
              <div className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--divider)', borderTopColor: 'var(--gl)' }} />
              <div className="t3">Loading verification…</div>
            </Center>
          )}

          {/* Completed */}
          {phase === 'completed' && (
            <Center>
              <Icon name="check" size={56} color="var(--gl)" />
              <h3 style={{ margin: 0, color: 'var(--text-strong)' }}>Verification complete</h3>
              <div className="t3" style={{ maxWidth: 300 }}>Your identity is verified — finishing up your CrymadX Card.</div>
              <button className="btn btn-g" style={{ marginTop: 8, minWidth: 180 }} onClick={onClose}>Continue</button>
            </Center>
          )}

          {/* Rejected */}
          {phase === 'rejected' && (
            <Center>
              <Icon name="x" size={56} color="var(--r)" />
              <h3 style={{ margin: 0, color: 'var(--text-strong)' }}>Verification failed</h3>
              <div className="t3" style={{ maxWidth: 300 }}>Your verification wasn't approved. Please try again with valid documents.</div>
              <button className="btn btn-o" style={{ marginTop: 8, minWidth: 180 }} onClick={onClose}>Close</button>
            </Center>
          )}

          {/* Iframe couldn't load → open in system browser */}
          {phase === 'iframe_error' && (
            <Center>
              <Icon name="globe" size={48} color="var(--gl)" />
              <h3 style={{ margin: 0, color: 'var(--text-strong)' }}>Open verification</h3>
              <div className="t3" style={{ maxWidth: 320, lineHeight: 1.5 }}>
                The verification page couldn't load inline. Open it in your browser to continue — we'll detect when you're done.
              </div>
              <button
                className="btn btn-g"
                style={{ marginTop: 8, minWidth: 200 }}
                onClick={() => { window.open(kycUrl, '_blank'); setPhase('ready') }}
              >
                <Icon name="globe" size={14} color="#fff" /> Open verification
              </button>
            </Center>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
