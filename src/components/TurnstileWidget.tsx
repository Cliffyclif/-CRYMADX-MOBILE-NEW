import { useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { isNativeApp } from '../lib/platform'

/**
 * Cloudflare Turnstile widget. Three rendering modes:
 *
 * 1. **Native (Capacitor APK)** — does NOT mount the widget at all.
 *    The APK identifies itself via `X-Mobile-App: 1` headers and the
 *    backend skips captcha verification for those requests. Calls
 *    onVerify('mobile-bypass') immediately so callers don't block.
 *
 * 2. **Localhost dev** — uses Cloudflare's always-pass test site key
 *    (`1x00000000000000000000AA`) regardless of what env says. The
 *    production site key is hostname-locked to crymadx.io, so on
 *    localhost it would loop forever waiting to validate. The matching
 *    test secret on the backend (or the dev-mode skip) accepts these
 *    tokens.
 *
 * 3. **Production web** — uses VITE_TURNSTILE_SITE_KEY normally.
 */

const TEST_SITE_KEY = '1x00000000000000000000AA'

function resolveSiteKey(): string {
  // Localhost dev — always test key, even if .env has a prod key.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return TEST_SITE_KEY
    }
  }
  const envKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  if (envKey) return envKey
  if (import.meta.env.DEV) return TEST_SITE_KEY
  // eslint-disable-next-line no-console
  console.error('[Turnstile] VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
  return ''
}

const SITE_KEY = resolveSiteKey()

type Props = {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export function TurnstileWidget({ onVerify, onExpire, onError }: Props) {
  const native = isNativeApp()

  // In Capacitor, immediately resolve the gate — backend bypasses captcha
  // for requests carrying X-Mobile-App: 1 (set by api/client.ts on every
  // call from inside the APK). The token value is a placeholder; the
  // backend ignores it for mobile traffic.
  useEffect(() => {
    if (native) onVerify('mobile-bypass')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native])

  if (native) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{ theme: 'auto', size: 'flexible' }}
      />
    </div>
  )
}
