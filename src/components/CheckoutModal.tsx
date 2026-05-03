/**
 * In-app checkout iframe.
 *
 * Embeds a Guardarian (or any fiat-provider) checkout URL in an iframe so
 * the user can complete payment without leaving the app. Replaces the
 * popup that mobile browsers block.
 *
 * Important caveat: Guardarian's pre-auth flow (which carries the user's
 * email + payout address so they don't have to re-enter them) only works
 * when the partner's frontend origin is whitelisted with Guardarian. On
 * localhost or any non-whitelisted origin, Guardarian's pre-auth API
 * returns 404 inside the iframe and the user gets prompted for email +
 * wallet address manually.
 *
 * To handle this gracefully we:
 *   - detect pre-auth failure events (TRANSAK_WIDGET_INIT_FAILED,
 *     TRANSAK_ERROR, also a load-timeout heuristic)
 *   - show a "Continue in browser" button so the user can complete the
 *     transaction in a real browser tab (works because top-level
 *     navigation isn't origin-restricted)
 *   - on native (Capacitor) the same button uses @capacitor/browser
 *     which opens an in-app Safari/CustomTab.
 *
 * Listens for postMessage events from Guardarian + Transak (legacy event
 * IDs are preserved by Guardarian for backwards compat).
 */
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { haptics } from '../lib/haptics'

const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

async function openInExternalBrowser(url: string) {
  // On Capacitor native, use the in-app Browser plugin (SafariView /
  // Chrome CustomTab) which preserves session and reads the cookie jar
  // shared with the app's webview. On web, regular window.open inside a
  // user-gesture click handler is not blocked.
  try {
    const [coreMod, browserMod] = await Promise.all([
      dynImport('@capacitor/core').catch(() => null),
      dynImport('@capacitor/browser').catch(() => null),
    ])
    if (coreMod?.Capacitor?.isNativePlatform?.() && browserMod?.Browser) {
      await browserMod.Browser.open({ url, presentationStyle: 'popover' })
      return
    }
  } catch { /* fall through to window.open */ }
  window.open(url, '_blank', 'noopener,noreferrer')
}

interface Props {
  open: boolean
  url: string | null
  onClose: () => void
  onComplete?: (status: 'completed' | 'failed' | 'cancelled') => void
  /** Title shown in the top bar. Defaults to "Secure checkout". */
  title?: string
  /** Provider name shown in the footer (e.g. "Guardarian"). */
  provider?: string
}

type Stage = 'loading' | 'ready' | 'processing' | 'preauth_failed' | 'completed' | 'failed' | 'cancelled'

export function CheckoutModal({ open, url, onClose, onComplete, title, provider = 'Guardarian' }: Props) {
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [stage, setStage] = useState<Stage>('loading')

  // Reset state when URL changes
  useEffect(() => {
    if (!url) return
    setStage('loading')
  }, [url])

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  // Safety-net timeout: if the iframe never fires *any* signal (not even
  // its `load` event) after 45s, surface the "Continue in browser" CTA so
  // the user isn't staring at an empty modal forever. We used to time out
  // at 8s based on postMessage events, but Guardarian's hosted page loads
  // fine without firing a recognised "ready" message — that produced false
  // positives where the iframe was working and we yanked it.
  useEffect(() => {
    if (!open || !url) return
    if (stage !== 'loading') return
    const timer = setTimeout(() => {
      setStage(s => (s === 'loading' ? 'preauth_failed' : s))
    }, 45000)
    return () => clearTimeout(timer)
  }, [open, url, stage])

  // postMessage listener — Guardarian + Transak event IDs (Guardarian
  // preserved Transak's event names for backwards compat with old
  // integrations). Match the documented event IDs *exactly* — earlier
  // versions used loose `includes('FAIL'|'SUCCESS'|'CANCEL')` checks, which
  // matched random messages from reCAPTCHA, Vite HMR, and other widgets
  // running inside the iframe and accidentally unmounted it mid-flow.
  useEffect(() => {
    if (!open) return
    const KNOWN = new Set([
      'TRANSAK_ORDER_SUCCESSFUL', 'TRANSAK_ORDER_FAILED', 'TRANSAK_ORDER_CANCELLED',
      'TRANSAK_ORDER_CREATED',    'TRANSAK_WIDGET_INIT_FAILED', 'TRANSAK_ERROR',
      'TRANSAK_WIDGET_LOADED',    'TRANSAK_WIDGET_OPEN',         'TRANSAK_WIDGET_CLOSE',
      'GUARDARIAN_ORDER_COMPLETED', 'GUARDARIAN_ORDER_FAILED', 'GUARDARIAN_ORDER_CANCELLED',
      'GUARDARIAN_WIDGET_LOADED',
    ])
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data
      if (!data || typeof data !== 'object') return
      const rawId = (data.event_id ?? data.type ?? data.event ?? '').toString().toUpperCase()
      if (!KNOWN.has(rawId)) return
      switch (rawId) {
        case 'TRANSAK_ORDER_SUCCESSFUL':
        case 'GUARDARIAN_ORDER_COMPLETED':
          haptics.success()
          setStage('completed')
          onComplete?.('completed')
          setTimeout(() => onClose(), 800)
          break
        case 'TRANSAK_ORDER_FAILED':
        case 'GUARDARIAN_ORDER_FAILED':
          haptics.error()
          setStage('failed')
          onComplete?.('failed')
          break
        case 'TRANSAK_ORDER_CANCELLED':
        case 'GUARDARIAN_ORDER_CANCELLED':
          setStage('cancelled')
          onComplete?.('cancelled')
          setTimeout(() => onClose(), 200)
          break
        case 'TRANSAK_WIDGET_INIT_FAILED':
        case 'TRANSAK_ERROR':
          setStage('preauth_failed')
          break
        case 'TRANSAK_ORDER_CREATED':
          setStage('processing')
          break
        case 'TRANSAK_WIDGET_LOADED':
        case 'GUARDARIAN_WIDGET_LOADED':
          setStage(s => (s === 'loading' ? 'ready' : s))
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [open, onClose, onComplete])

  const handleClose = () => {
    haptics.selection()
    onComplete?.('cancelled')
    onClose()
  }

  const handleContinueInBrowser = async () => {
    if (!url) return
    haptics.medium()
    await openInExternalBrowser(url)
    // Don't close immediately — give the user time to come back to confirm.
    setStage('processing')
  }

  if (!open) return null

  const showIframe = stage === 'loading' || stage === 'ready' || stage === 'processing'
  const hostname = url ? safeHostname(url) : ''

  return (
    <div
      data-no-swipe-back
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,.96)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: 'calc(env(safe-area-inset-top, 12px) + 12px) 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(0,0,0,.6)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close checkout"
          style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name="x" size={16} color="#fff" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {title ?? (t('buy.secureCheckout') || 'Secure checkout')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
            <span className="grn">🔒</span> {hostname}
          </div>
        </div>
        {url && (
          <button
            onClick={handleContinueInBrowser}
            aria-label="Open in browser"
            title="Open in browser"
            style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="globe" size={16} color="#fff" />
          </button>
        )}
      </div>

      {/* Loading shimmer */}
      {stage === 'loading' && (
        <div style={{ position: 'absolute', top: 64, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden', zIndex: 2 }}>
          <div
            style={{
              height: '100%',
              width: '40%',
              background: 'linear-gradient(90deg, transparent, var(--gl), transparent)',
              animation: 'cm-shimmer 1.2s infinite',
            }}
          />
        </div>
      )}

      {/* Pre-auth failed — Continue in browser fallback */}
      {stage === 'preauth_failed' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(212,165,60,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="globe" size={32} color="var(--gd)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            {t('buy.continueInBrowserTitle') || 'Continue in your browser'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', maxWidth: 320, lineHeight: 1.5 }}>
            {t('buy.continueInBrowserBody') ||
              `${provider} can't pre-authenticate this page from inside the app. Tap "Open in browser" to finish — your wallet address and email will pre-fill there.`}
          </div>
          <button
            onClick={handleContinueInBrowser}
            className="btn btn-g"
            style={{ marginTop: 8, maxWidth: 280, padding: '14px 18px' }}
          >
            <Icon name="globe" size={14} color="#fff" />
            {t('buy.openInBrowser') || 'Open in browser'}
          </button>
          <button
            onClick={() => { setStage('loading'); /* allow iframe another shot */ }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 13, marginTop: 8, cursor: 'pointer' }}
          >
            {t('buy.tryEmbedAnyway') || 'Try the embed anyway'}
          </button>
        </div>
      )}

      {stage === 'completed' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(0,200,83,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={32} color="var(--gl)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t('buy.transactionSuccessful') || 'Transaction successful'}</div>
        </div>
      )}

      {stage === 'failed' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={32} color="var(--r)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t('buy.transactionFailed') || 'Transaction failed'}</div>
          <button onClick={onClose} className="btn btn-o" style={{ marginTop: 8 }}>{t('common.close') || 'Close'}</button>
        </div>
      )}

      {/* Iframe — kept mounted while in iframe-friendly stages.
          `onLoad` fires even for cross-origin docs once the document has
          loaded, so we use it as the canonical "iframe is alive" signal
          and disarm the safety-net timeout. */}
      {url && showIframe && (
        <iframe
          ref={iframeRef}
          src={url}
          allow="payment; camera; microphone; clipboard-read; clipboard-write; accelerometer; encrypted-media; geolocation"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setStage(s => (s === 'loading' ? 'ready' : s))}
          style={{ flex: 1, border: 'none', background: '#fff', width: '100%' }}
          title="Checkout"
        />
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px calc(env(safe-area-inset-bottom, 8px) + 8px)', background: 'rgba(0,0,0,.6)', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={11} color="rgba(255,255,255,.55)" /> Powered by {provider}
        </div>
        {url && (
          <button
            onClick={handleContinueInBrowser}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {t('buy.openInBrowser') || 'Open in browser'} <Icon name="arrow" size={10} color="#fff" />
          </button>
        )}
      </div>

      <style>{`@keyframes cm-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
    </div>
  )
}

function safeHostname(u: string): string {
  try { return new URL(u).hostname } catch { return '' }
}
