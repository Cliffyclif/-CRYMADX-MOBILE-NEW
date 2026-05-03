// Scan QR — full-screen scanner that auto-detects the asset / chain from
// the scanned address and deep-links into the Send flow with everything
// pre-filled. Falls back to a manual paste sheet for typing addresses.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Icon } from '../../components/Icon'
import { useQRScanner } from '../../hooks/useQRScanner'
import { detectAddress, chainLabel, type DetectedAddress } from '../../lib/addressDetect'
import { ROUTES } from '../../routes'
import { haptics } from '../../lib/haptics'

export function ScanQR() {
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stopFnRef = useRef<{ stop: () => void } | null>(null)
  const handledRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualText, setManualText] = useState('')
  const [detectedPreview, setDetectedPreview] = useState<DetectedAddress | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const { scan: nativeScan } = useQRScanner()

  // Hand the detected address off to the Withdraw screen with everything
  // pre-filled. Withdraw.tsx reads location.state on mount.
  const onDetected = (d: DetectedAddress) => {
    if (handledRef.current) return
    handledRef.current = true
    haptics.success()
    setDetectedPreview(d)
    toast.success(`${chainLabel(d)} address detected`)
    // Tiny pause so the toast is visible before nav
    setTimeout(() => {
      nav(ROUTES['route.wallet.withdraw'].path, {
        state: {
          asset: d.asset,
          network: d.network,
          address: d.address,
          amount: d.amount,
          memo: d.memo,
          tag: d.tag,
          ambiguous: d.ambiguous,
          fromScanner: true,
        },
      })
    }, 350)
  }

  const onScannedText = (text: string) => {
    const detected = detectAddress(text)
    if (!detected) {
      haptics.error()
      setError('Unrecognised QR. We couldn\'t detect a wallet address — paste manually below.')
      handledRef.current = false
      // Re-arm scanner after 1.5s so user can try another QR
      setTimeout(() => setError(null), 1800)
      return
    }
    onDetected(detected)
  }

  // ── Native scanner first (Capacitor APK), fall back to web zxing ──────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Try native — if the platform supports it, this resolves with a value.
      const r = await nativeScan().catch(() => ({ kind: 'none' as const }))
      if (cancelled) return
      if (r.kind === 'value') {
        onScannedText(r.value)
        return
      }
      if (r.kind === 'none') {
        // Native scanner cancelled / no value — leave the modal close to the
        // user (they pressed back). Pop back to where they came from.
        nav(-1)
        return
      }

      // r.kind === 'web' — start the live camera + zxing here
      await startWebScanner()
    })()

    return () => {
      cancelled = true
      try { stopFnRef.current?.stop() } catch { /* ignore */ }
      stopFnRef.current = null
      // Tear down any media tracks we own so we don't keep the camera
      // locked when the user navigates away.
      const stream = (videoRef.current?.srcObject as MediaStream | null) ?? null
      stream?.getTracks().forEach(t => { try { t.stop() } catch { /* ignore */ } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Two-phase camera start: get the stream first so we can raise a real
  // permission / availability error, then hand the live <video> to zxing
  // for decoding. Single getUserMedia call.
  async function startWebScanner() {
    setError(null)
    setCameraReady(false)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available — try a modern browser')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      video.srcObject = stream
      try { await video.play() } catch { /* iOS autoplay quirk; ignore */ }
      setCameraReady(true)

      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromVideoElement(video, (result, _err, ctrl) => {
        if (handledRef.current) return
        if (result) {
          try { ctrl.stop() } catch { /* ignore */ }
          onScannedText(result.getText())
        }
        // benign 'NotFoundException' on every empty frame — skip
      })
      stopFnRef.current = controls
    } catch (e: any) {
      const name = e?.name ?? ''
      let msg = 'Camera unavailable'
      if (name === 'NotAllowedError' || /denied|permission/i.test(e?.message ?? '')) {
        msg = 'Camera access denied. Allow it in your browser to scan QR codes.'
      } else if (name === 'NotFoundError') {
        msg = 'No camera detected on this device.'
      } else if (name === 'NotReadableError') {
        msg = 'Camera is already in use by another app or tab.'
      } else if (name === 'OverconstrainedError') {
        msg = "Couldn't find a camera matching the requested settings."
      } else if (e?.message) {
        msg = e.message
      }
      setError(msg)
      setCameraReady(false)
    }
  }

  // Toggle flashlight (browser only — getUserMedia track has applyConstraints
  // for torch on supported devices).
  const toggleFlash = async () => {
    haptics.selection()
    const stream = (videoRef.current?.srcObject as MediaStream | null) ?? null
    const track = stream?.getVideoTracks?.()[0]
    if (!track) return
    const caps = (track.getCapabilities?.() as any) ?? {}
    if (!caps.torch) {
      toast.error('Flash not supported on this device')
      return
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn } as any] })
      setFlashOn(v => !v)
    } catch {
      toast.error('Could not toggle flash')
    }
  }

  // Manual paste / typing path
  const submitManual = () => {
    const text = manualText.trim()
    if (!text) return
    setManualOpen(false)
    onScannedText(text)
  }

  // Decode an image picked from the gallery (helpful when QR is on a screen
  // the user can\'t point a camera at — they screenshot it).
  const onImagePicked = async (file: File) => {
    try {
      const reader = new BrowserQRCodeReader()
      const url = URL.createObjectURL(file)
      const result = await reader.decodeFromImageUrl(url)
      URL.revokeObjectURL(url)
      onScannedText(result.getText())
    } catch {
      toast.error('No QR code found in that image')
    }
  }

  return (
    <div className="app-root">
      <div className="app-shell" style={{ background: '#000' }}>
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 14px', zIndex: 30 }}>
          <button onClick={() => nav(-1)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', display: 'flex', cursor: 'pointer', borderRadius: 16, padding: 8 }}>
            <Icon name="x" size={18} color="#fff" />
          </button>
          <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>Scan QR</div>
          <button
            onClick={toggleFlash}
            aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
            style={{ background: flashOn ? 'var(--gd)' : 'rgba(255,255,255,.1)', border: 'none', display: 'flex', cursor: 'pointer', borderRadius: 16, padding: 8 }}
          >
            <Icon name="zap" size={18} color={flashOn ? '#000' : '#fff'} />
          </button>
        </div>

        {/* Live camera */}
        <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* Reticle */}
        <div style={{ position: 'absolute', inset: '90px 30px 130px', border: '2px solid var(--gl)', borderRadius: 20, boxShadow: '0 0 0 9999px rgba(0,0,0,.55), 0 0 0 1px var(--gl)', zIndex: 5 }}>
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
          <div className="scan-line" style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gl), transparent)', boxShadow: '0 0 12px var(--gl)' }} />
        </div>

        {/* Status / hint */}
        <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14, zIndex: 30, padding: '0 24px' }}>
          {error
            ? (
              <div>
                <div style={{ color: 'var(--r)', marginBottom: 8 }}>{error}</div>
                <button
                  onClick={startWebScanner}
                  style={{
                    background: 'var(--gl)', color: '#0a3d1e',
                    border: 'none', borderRadius: 24,
                    padding: '8px 18px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              </div>
            )
            : detectedPreview
              ? <span className="grn">Found {chainLabel(detectedPreview)} address — opening Send…</span>
              : cameraReady
                ? 'Position the QR code in the frame'
                : 'Starting camera…'}
        </div>

        {/* Bottom action row */}
        <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 30 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onImagePicked(f)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Pick image from gallery"
            style={{ background: 'none', border: 'none', textAlign: 'center', color: 'rgba(255,255,255,.85)', fontSize: 12, cursor: 'pointer' }}
          >
            <div className="ic" style={{ width: 40, height: 40, background: 'rgba(255,255,255,.1)', margin: '0 auto', borderRadius: 20 }}>
              <Icon name="grid" size={18} color="#fff" />
            </div>
            <div style={{ marginTop: 4 }}>Gallery</div>
          </button>
          <div
            aria-label="Scanning"
            style={{ background: 'none', textAlign: 'center', color: '#fff', fontSize: 13 }}
          >
            <div className="ic" style={{ width: 56, height: 56, background: 'rgba(0,200,83,.3)', boxShadow: '0 0 30px rgba(0,200,83,.4)', margin: '0 auto', borderRadius: 28 }}>
              <Icon name="camera" size={26} color="#fff" />
            </div>
            <div style={{ marginTop: 4, fontWeight: 700 }}>Scanning…</div>
          </div>
          <button
            onClick={() => setManualOpen(true)}
            aria-label="Enter address manually"
            style={{ background: 'none', border: 'none', textAlign: 'center', color: 'rgba(255,255,255,.85)', fontSize: 12, cursor: 'pointer' }}
          >
            <div className="ic" style={{ width: 40, height: 40, background: 'rgba(255,255,255,.1)', margin: '0 auto', borderRadius: 20 }}>
              <Icon name="edit" size={16} color="#fff" />
            </div>
            <div style={{ marginTop: 4 }}>Manual</div>
          </button>
        </div>

        {/* Manual paste sheet */}
        {manualOpen && (
          <div
            onClick={() => setManualOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 480,
                background: 'var(--bg-shell, #060d09)',
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ flex: 1, margin: 0 }}>Paste address</h3>
                <button onClick={() => setManualOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name="x" size={16} color="var(--text-mid-50)" />
                </button>
              </div>
              <div className="t3" style={{ marginBottom: 10 }}>Any chain — we'll detect the network for you.</div>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="bc1q… or 0x… or T… or G…"
                autoFocus
                style={{ width: '100%', minHeight: 80, padding: 12, fontSize: 14, fontFamily: 'monospace', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }}
              />
              <button
                className="btn btn-g"
                style={{ marginTop: 12 }}
                disabled={!manualText.trim()}
                onClick={submitManual}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base: React.CSSProperties = { position: 'absolute', width: 30, height: 30, border: '4px solid var(--gl)' }
  if (pos === 'tl') return <div style={{ ...base, top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderRadius: '20px 0 0 0' }} />
  if (pos === 'tr') return <div style={{ ...base, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 20px 0 0' }} />
  if (pos === 'bl') return <div style={{ ...base, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 20px' }} />
  return <div style={{ ...base, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 20px 0' }} />
}
