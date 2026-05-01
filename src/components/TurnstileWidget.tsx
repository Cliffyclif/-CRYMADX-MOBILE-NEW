import { Turnstile } from '@marsidev/react-turnstile'

// Production site key comes from VITE_TURNSTILE_SITE_KEY. In dev, fall back to
// Cloudflare's "always-pass" test key so local work isn't blocked. In prod we
// bail loudly rather than silently shipping the test key (which renders an
// orange "For testing only" banner over the auth screens).
const ENV_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SITE_KEY = ENV_KEY || (import.meta.env.DEV ? '1x00000000000000000000AA' : '')
if (!SITE_KEY && import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.error('[Turnstile] VITE_TURNSTILE_SITE_KEY is not set — CAPTCHA will not render.')
}

type Props = {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export function TurnstileWidget({ onVerify, onExpire, onError }: Props) {
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
