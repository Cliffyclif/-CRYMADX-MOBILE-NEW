/**
 * Full-screen QR scanner overlay used when running in a browser (no Capacitor
 * native scanner). Streams the rear camera into a <video> and uses zxing to
 * decode a single QR. Closes on success, cancel, or scan error.
 */
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Icon } from './Icon'
import { haptics } from '../lib/haptics'

interface Props {
  open: boolean
  onClose: () => void
  onResult: (text: string) => void
}

export function QRScanModal({ open, onClose, onResult }: Props) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)

    ;(async () => {
      try {
        // QR-only reader (much faster than BrowserMultiFormatReader, which
        // tries every barcode symbology).
        const reader = new BrowserQRCodeReader()
        readerRef.current = reader
        if (!videoRef.current) return

        // One camera spin-up via constraints (skip listVideoInputDevices,
        // which triggers a second getUserMedia call). Cap resolution to
        // 720p — enough for QR and 2-3× faster to decode than 1080p/4K.
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, _err, ctrl) => {
            if (cancelled) return
            if (result) {
              haptics.success()
              try { ctrl.stop() } catch { /* ignore */ }
              onResult(result.getText())
              onClose()
            }
            // err.NotFoundException is benign (no QR yet) — don't surface
          },
        )
        controlsRef.current = controls
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Camera error')
      }
    })()

    return () => {
      cancelled = true
      try { controlsRef.current?.stop() } catch { /* ignore */ }
      controlsRef.current = null
    }
  }, [open, onClose, onResult])

  if (!open) return null
  return (
    <div
      data-no-swipe-back
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'absolute', top: 'env(safe-area-inset-top, 12px)', left: 0, right: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <div style={{ color: '#fff', fontWeight: 700 }}>{t('qr.scan') || 'Scan QR code'}</div>
        <button onClick={onClose} aria-label="Close scanner" style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 16, padding: 8, color: '#fff', cursor: 'pointer' }}>
          <Icon name="x" size={18} />
        </button>
      </div>

      <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Reticle */}
      <div
        style={{
          position: 'relative',
          width: 260,
          height: 260,
          borderRadius: 24,
          boxShadow: '0 0 0 9999px rgba(0,0,0,.6)',
          border: '2px solid var(--gl)',
          zIndex: 1,
        }}
      >
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      </div>

      <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)', color: '#fff', textAlign: 'center', padding: '0 24px', zIndex: 2 }}>
        {error
          ? <div style={{ color: 'var(--r)' }}>{error}</div>
          : <div>{t('qr.hint') || 'Point your camera at the QR code'}</div>}
      </div>
    </div>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base: React.CSSProperties = { position: 'absolute', width: 22, height: 22, border: '4px solid var(--gl)', borderRadius: 4 }
  if (pos === 'tl') return <div style={{ ...base, top: -2, left: -2, borderRight: 'none', borderBottom: 'none' }} />
  if (pos === 'tr') return <div style={{ ...base, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none' }} />
  if (pos === 'bl') return <div style={{ ...base, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none' }} />
  return <div style={{ ...base, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none' }} />
}
