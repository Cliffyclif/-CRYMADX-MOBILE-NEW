import { Turnstile } from '@marsidev/react-turnstile'

// Production site key. Site keys are public by design (they bind the widget
// to allowed hostnames on Cloudflare's side), so hardcoding the prod fallback
// is safe and ensures the widget renders even when the build env doesn't
// inject VITE_TURNSTILE_SITE_KEY (e.g. GH Actions APK builds without secrets).
const PROD_SITE_KEY = '0x4AAAAAACxSkJnebUGCt21E'
const TEST_SITE_KEY = '1x00000000000000000000AA' // Cloudflare always-pass test key

// Force the test key whenever the widget is loaded over a non-prod host. This
// covers `npm start` (serve -s dist) and any other case where a production
// bundle ends up served on localhost, where the prod key is hostname-rejected
// and the checkbox renders but refuses to validate.
function isLocalHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.startsWith('192.168.') || h.startsWith('10.') || h.endsWith('.local')
}

const ENV_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SITE_KEY = isLocalHost() ? TEST_SITE_KEY : (ENV_KEY || (import.meta.env.DEV ? TEST_SITE_KEY : PROD_SITE_KEY))

type Props = {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export function TurnstileWidget({ onVerify, onExpire, onError }: Props) {
  // 'normal' size = deterministic 300×65 widget that centers in the row.
  // 'flexible' was overflowing the auth-card content area on some phones
  // because Cloudflare expanded it beyond the container's actual width.
  return (
    <div className="turnstile-host">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{ theme: 'auto', size: 'normal' }}
      />
    </div>
  )
}
