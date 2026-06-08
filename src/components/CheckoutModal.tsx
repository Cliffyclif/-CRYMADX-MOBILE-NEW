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
  /** Order id used to mint a fresh checkout URL when the original
   *  auth_token has been consumed. Required for the in-modal "retry"
   *  flow to work — without it the retry button silently no-ops. */
  orderId?: string | null
  /** Called when the modal needs a fresh checkout URL (retry / Safari
   *  external open). Should return a new pre-authenticated URL. */
  onRefreshUrl?: (orderId: string) => Promise<string | null>
}

type Stage = 'loading' | 'ready' | 'processing' | 'preauth_failed' | 'safari_external' | 'completed' | 'failed' | 'cancelled'

// Only iOS / iPadOS truly need the external path: WKWebView partitions
// third-party storage so aggressively that Guardarian's in-iframe session
// can't survive. Everything else — Android WebView (the real mobile app),
// desktop Chrome AND desktop Safari — keeps the in-app iframe (it degrades
// gracefully to a "continue in browser" button if pre-auth fails).
function shouldOpenExternally(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOSUA = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ reports as "Macintosh"; distinguish it by touch support.
  const isIPadOS = /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document
  return isIOSUA || isIPadOS
}

export function CheckoutModal({ open, url, onClose, onComplete, title, provider = 'Guardarian', orderId, onRefreshUrl }: Props) {
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [activeUrl, setActiveUrl] = useState<string | null>(url)
  const [refreshing, setRefreshing] = useState(false)

  // Reset state when URL changes
  useEffect(() => {
    if (!url) return
    setActiveUrl(url)
    // Safari/iOS: skip iframe entirely, go straight to external browser.
    // Storage partitioning makes Guardarian's session unreliable inside
    // any iframe on these browsers, even with storage-access + credentialless.
    if (shouldOpenExternally()) {
      setStage('safari_external')
      // Fire the open synchronously so it's still inside the user-gesture
      // chain that started this modal — popup blockers stay quiet.
      openInExternalBrowser(url).catch(() => { /* user can retry via button */ })
    } else {
      setStage('loading')
    }
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

  // Safety-net timeout: if the iframe never fires its `load` event after
  // 90s, surface the "Continue in browser" CTA so the user isn't staring
  // at an empty modal forever. Bumped from 45s — Guardarian's CDN edge
  // can take 30-60s on slow mobile connections, and false-positives
  // (yanking a working iframe) cost more than waiting an extra minute.
  useEffect(() => {
    if (!open || !activeUrl) return
    if (stage !== 'loading') return
    const timer = setTimeout(() => {
      setStage(s => (s === 'loading' ? 'preauth_failed' : s))
    }, 90000)
    return () => clearTimeout(timer)
  }, [open, activeUrl, stage])

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
    const target = activeUrl || url
    if (!target) return
    haptics.medium()
    await openInExternalBrowser(target)
    // Don't close immediately — give the user time to come back to confirm.
    setStage('processing')
  }

  // Mint a fresh checkout URL from the backend (used by retry + Safari
  // "reopen" paths). Guardarian's auth_token is single-use / TTL'd, so a
  // fresh transaction-with-same-orderId is the correct way to recover.
  const handleRefreshUrl = async (): Promise<string | null> => {
    if (!orderId || !onRefreshUrl) return activeUrl || url || null
    setRefreshing(true)
    try {
      const fresh = await onRefreshUrl(orderId)
      if (fresh) {
        setActiveUrl(fresh)
        return fresh
      }
    } catch (err) {
      console.error('[checkout] refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
    return activeUrl || url || null
  }

  // "Try the embed anyway" → mint fresh URL first so we don't reuse a
  // burned auth_token, then re-mount the iframe.
  const handleRetryEmbed = async () => {
    haptics.selection()
    const fresh = await handleRefreshUrl()
    if (fresh) setStage('loading')
  }

  if (!open) return null

  const iframeUrl = activeUrl || url
  const showIframe = (stage === 'loading' || stage === 'ready' || stage === 'processing') && !!iframeUrl
  const hostname = iframeUrl ? safeHostname(iframeUrl) : ''

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
          {orderId && onRefreshUrl && (
            <button
              onClick={handleRetryEmbed}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 13, marginTop: 8, cursor: refreshing ? 'wait' : 'pointer' }}
            >
              {refreshing
                ? (t('buy.refreshingCheckout') || 'Refreshing checkout…')
                : (t('buy.tryEmbedAnyway') || 'Try the embed anyway')}
            </button>
          )}
        </div>
      )}

      {/* Safari / iOS — iframe is unreliable, point user at external browser */}
      {stage === 'safari_external' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(0,200,83,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="globe" size={32} color="var(--gl)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            {t('buy.openedInBrowserTitle') || 'Checkout opened in your browser'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', maxWidth: 320, lineHeight: 1.5 }}>
            {t('buy.openedInBrowserBody') ||
              'Complete your payment in the new window. Your wallet address and email are pre-filled. Come back here once you\'re done.'}
          </div>
          <button
            onClick={handleContinueInBrowser}
            className="btn btn-g"
            style={{ marginTop: 8, maxWidth: 280, padding: '14px 18px' }}
          >
            <Icon name="globe" size={14} color="#fff" />
            {t('buy.reopenCheckout') || 'Reopen checkout'}
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
          The stable React `key` prevents the iframe from being thrown
          away when sibling JSX (loading shimmer, footer state) changes.
          `credentialless` + `allow="storage-access"` opt this iframe
          into the modern Web Platform unpartitioned-storage flow so
          Guardarian's session cookies survive cross-origin context.
          Without these, Chrome 130+ and Safari ITP partition cookies
          per top-level origin, breaking Guardarian's auth handoff
          partway through the checkout (user gets re-prompted for email).
          `onLoad` fires even for cross-origin docs once the document
          has loaded, so we use it as the canonical "iframe is alive"
          signal and disarm the safety-net timeout. */}
      {showIframe && iframeUrl && (
        <iframe
          key="checkout-iframe"
          ref={iframeRef}
          src={iframeUrl}
          {...({ credentialless: 'true' } as any)}
          allow="payment; camera; microphone; clipboard-read; clipboard-write; accelerometer; encrypted-media; geolocation; storage-access"
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
