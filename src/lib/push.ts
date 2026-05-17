/**
 * Unified push facade.
 *
 * Picks the right delivery mechanism for the platform:
 *   - Capacitor native app  → FCM (nativePush.ts)
 *   - Browser / PWA         → Web Push (webPush.ts)
 *
 * Screens (e.g. NotificationsSettings) and app boot import from here and stay
 * platform-agnostic.
 */
import { Capacitor } from '@capacitor/core'
import * as web from './webPush'
import {
  getNativePushStatus,
  enableNativePush,
  disableNativePush,
} from './nativePush'

export type { PushStatus } from './webPush'
import type { PushStatus } from './webPush'

const isNative = (): boolean => Capacitor.isNativePlatform()

export async function getStatus(): Promise<PushStatus> {
  return isNative() ? getNativePushStatus() : web.getStatus()
}

export async function enable(): Promise<PushStatus> {
  return isNative() ? enableNativePush() : web.enable()
}

export async function disable(): Promise<PushStatus> {
  return isNative() ? disableNativePush() : web.disable()
}
