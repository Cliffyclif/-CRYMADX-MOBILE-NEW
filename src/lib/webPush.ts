/**
 * Web Push subscription manager
 * -----------------------------
 * Handles the four-step Web Push onboarding flow:
 *
 *   1. Check browser support (Service Worker + Push + Notification APIs)
 *   2. Register the Service Worker at /service-worker.js
 *   3. Request `Notification.requestPermission()` from the user
 *   4. Subscribe to push (PushManager.subscribe with our VAPID public key)
 *      and POST the resulting subscription object to the backend so it can
 *      send pushes addressed to this device.
 *
 * Caller (typically NotificationsSettings screen) just calls `enable()` /
 * `disable()` and reads `getStatus()` for the toggle UI.
 */
import { api } from '../api/client'

export type PushStatus =
  | 'unsupported'   // Browser doesn't support Web Push (older Safari, in-app webview, etc.)
  | 'denied'        // User actively blocked notifications
  | 'idle'          // Supported, not yet subscribed (default)
  | 'subscribed'    // Active subscription registered with backend

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined) ?? ''

/** Check whether the running browser supports the Web Push pipeline. */
export function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getStatus(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration('/service-worker.js')
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'subscribed' : 'idle'
}

/** Convert a base64-url-encoded VAPID key to the Uint8Array PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const out = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i)
  return out
}

/** Register the service worker. Idempotent — safe to call repeatedly. */
async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/service-worker.js')
  if (existing) return existing
  return navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
}

/** True when running inside the Capacitor native app (Android/iOS), not a browser. */
function isCapacitorNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}

/**
 * Register the SW on app boot — installs the caching layer for static assets,
 * coin icons and the app shell. Push subscriptions are independently opt-in
 * via {@link enable}; calling this just sets up the runtime cache.
 *
 * Idempotent. Safe to call from app startup. Quietly no-ops on unsupported
 * environments (Safari < 11, in-app webviews without SW, etc.).
 *
 * NEVER registers on the Capacitor native build. The web assets already ship
 * inside the APK, so the SW adds no offline benefit — and it actively breaks
 * the app: a service-worker `fetch()` escapes Capacitor's local asset
 * interception and hits the public origin, which SPA-fallbacks code-split
 * chunk URLs (`/assets/*.js`) to index.html. The browser then gets HTML for a
 * JS-module import and every lazy-loaded screen fails to load. So on native we
 * skip registration and proactively unregister any SW an older build left.
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  if (isCapacitorNative()) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      const hadSW = regs.length > 0
      await Promise.all(regs.map((r) => r.unregister()))
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      // If a stale SW from an older build is still controlling this session,
      // one reload drops it immediately (otherwise chunk loading stays broken
      // until the next launch). After the reload there's no controller, so it
      // won't loop.
      if (hadSW && navigator.serviceWorker.controller) {
        window.location.reload()
      }
    } catch (e) {
      console.warn('[sw] native cleanup failed', e)
    }
    return
  }

  try {
    await ensureRegistration()
  } catch (e) {
    console.warn('[sw] register failed', e)
  }
}

/**
 * Full opt-in flow: register SW → request permission → subscribe → send to backend.
 * Returns the resulting status. Throws on unrecoverable errors so the caller
 * can show a toast.
 */
export async function enable(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported'
  if (!VAPID_PUBLIC_KEY) throw new Error('VITE_WEB_PUSH_PUBLIC_KEY not configured')

  const reg = await ensureRegistration()

  // Notification.requestPermission resolves with 'granted', 'denied', or 'default'.
  // 'default' = user dismissed without choosing — treat as no-op.
  const permission = await Notification.requestPermission()
  if (permission === 'denied') return 'denied'
  if (permission !== 'granted') return 'idle'

  // PushManager.subscribe is idempotent if there's already an active sub.
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true, // Required by browsers — every push must show a notification
    // The .buffer cast keeps TS happy across DOM lib versions (some declare BufferSource as ArrayBuffer-only)
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
  })

  // Send the JSON-serialized subscription to the backend so it can address
  // pushes to this device. We also send a `userAgent` hint to help debugging.
  await api('api.notifications.subscribe', {
    body: {
      subscription: sub.toJSON(),
      userAgent: navigator.userAgent,
    },
  })

  return 'subscribed'
}

export async function disable(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration('/service-worker.js')
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    // Tell the backend to forget this endpoint, then unsubscribe locally
    try {
      await api('api.notifications.unsubscribe', {
        body: { endpoint: sub.endpoint },
      })
    } catch {
      // If the backend call fails, still unsubscribe locally — the user clearly
      // doesn't want notifications anymore.
    }
    await sub.unsubscribe()
  }
  return 'idle'
}

/**
 * Wire up the message channel so the running app can react to a SW notification
 * tap and route to the deep link the user clicked. Call this once at App init.
 */
export function listenForNotificationClicks(onNavigate: (href: string) => void) {
  if (!isSupported()) return
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'navigate' && typeof event.data.href === 'string') {
      onNavigate(event.data.href)
    }
  })
}
