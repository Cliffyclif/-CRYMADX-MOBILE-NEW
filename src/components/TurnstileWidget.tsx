import { Turnstile } from '@marsidev/react-turnstile'

// Production site key. Site keys are public by design (they bind the widget
// to allowed hostnames on Cloudflare's side), so hardcoding the prod fallback
// is safe and ensures the widget renders even when the build env doesn't
// inject VITE_TURNSTILE_SITE_KEY (e.g. GH Actions APK builds without secrets).
// Override locally via VITE_TURNSTILE_SITE_KEY if testing against a different key.
const PROD_SITE_KEY = '0x4AAAAAACxSkJnebUGCt21E'
const ENV_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SITE_KEY = ENV_KEY || (import.meta.env.DEV ? '1x00000000000000000000AA' : PROD_SITE_KEY)

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
