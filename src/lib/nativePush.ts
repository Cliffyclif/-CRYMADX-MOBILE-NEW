/**
 * Native push (FCM) for the Capacitor Android build.
 * ---------------------------------------------------
 * Web Push (see webPush.ts) cannot deliver to a closed native app — Android
 * routes closed-app push through Firebase Cloud Messaging. This module wraps
 * @capacitor/push-notifications:
 *
 *   1. Request the OS notification permission
 *   2. register() → the plugin obtains an FCM device token
 *   3. POST that token to notification-service (`/notifications/register-device`)
 *   4. On tap, route to the deep link carried in the push `data.href`
 *
 * No-ops cleanly on the plain web build (Capacitor.isNativePlatform() === false)
 * — there the browser Web Push path in webPush.ts is used instead.
 */
import { Capacitor } from '@capacitor/core'
import { PushNotifications, type Token, type ActionPerformed } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences'
import { api } from '../api/client'

export type NativePushStatus = 'unsupported' | 'denied' | 'idle' | 'subscribed'

const ENABLED_KEY = 'native_push_enabled'   // user opted in
const TOKEN_KEY = 'native_push_token'       // last FCM token (for unregister)
const PROMPTED_KEY = 'native_push_prompted' // auto-prompt has run once

/** True only inside the Capacitor native app (Android/iOS), not a browser. */
export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform()
}

// A notification tap routes here; App.tsx supplies the router navigate fn.
let navHandler: ((href: string) => void) | null = null
export function setNativePushNavHandler(fn: (href: string) => void): void {
  navHandler = fn
}

let listenersWired = false
async function wireListeners(): Promise<void> {
  if (listenersWired) return
  listenersWired = true

  // FCM handed us a device token — persist it and register it with the backend.
  await PushNotifications.addListener('registration', async (token: Token) => {
    try {
      await Preferences.set({ key: TOKEN_KEY, value: token.value })
      await api('api.notifications.registerDevice', {
        body: { token: token.value, platform: Capacitor.getPlatform() },
      })
    } catch (e) {
      console.warn('[nativePush] token registration failed', e)
    }
  })

  await PushNotifications.addListener('registrationError', (err) => {
    console.warn('[nativePush] registration error', err)
  })

  // User tapped a notification — follow the deep link if one was attached.
  await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    const href = action?.notification?.data?.href
    if (href && navHandler) {
      try { navHandler(String(href)) } catch { /* ignore bad href */ }
    }
  })
}

/** Current native-push state for the settings toggle. */
export async function getNativePushStatus(): Promise<NativePushStatus> {
  if (!isNativePushPlatform()) return 'unsupported'
  try {
    const perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'denied') return 'denied'
    const enabled = (await Preferences.get({ key: ENABLED_KEY })).value === '1'
    return enabled && perm.receive === 'granted' ? 'subscribed' : 'idle'
  } catch {
    return 'unsupported'
  }
}

/** Opt in: request permission → register → token is sent to the backend. */
export async function enableNativePush(): Promise<NativePushStatus> {
  if (!isNativePushPlatform()) return 'unsupported'
  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') {
    return perm.receive === 'denied' ? 'denied' : 'idle'
  }
  await wireListeners()
  await PushNotifications.register() // fires 'registration' → token → backend
  await Preferences.set({ key: ENABLED_KEY, value: '1' })
  return 'subscribed'
}

/** Opt out: tell the backend to drop this device's token. */
export async function disableNativePush(): Promise<NativePushStatus> {
  if (!isNativePushPlatform()) return 'unsupported'
  await Preferences.set({ key: ENABLED_KEY, value: '0' })
  const token = (await Preferences.get({ key: TOKEN_KEY })).value
  if (token) {
    try {
      await api('api.notifications.unregisterDevice', { body: { token } })
    } catch {
      // Non-fatal — the backend prunes tokens that FCM reports as dead.
    }
  }
  return 'idle'
}

/**
 * Auto opt-in, run once after login: if native, permission not yet decided,
 * and we've never prompted — prompt now. If the user previously opted in,
 * silently re-register so the token stays fresh. Safe to call on every login.
 */
export async function maybePromptNativePush(): Promise<void> {
  if (!isNativePushPlatform()) return
  try {
    const prompted = (await Preferences.get({ key: PROMPTED_KEY })).value === '1'
    if (prompted) {
      if ((await getNativePushStatus()) === 'subscribed') {
        await wireListeners()
        await PushNotifications.register()
      }
      return
    }
    await Preferences.set({ key: PROMPTED_KEY, value: '1' })
    await enableNativePush()
  } catch (e) {
    console.warn('[nativePush] auto-prompt failed', e)
  }
}
