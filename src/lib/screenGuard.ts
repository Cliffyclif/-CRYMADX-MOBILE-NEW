/**
 * screenGuard — JS wrapper over the native ScreenGuard plugin (Android
 * FLAG_SECURE). No-ops on web and iOS (where FLAG_SECURE doesn't exist) so the
 * Academy player can call enable()/disable() unconditionally.
 *
 * On Android, enable() makes the activity un-screenshot-able and un-recordable
 * (capture shows black). Pair enable() on player mount with disable() on
 * unmount so the rest of the app stays screenshot-friendly.
 */
import { registerPlugin, Capacitor } from '@capacitor/core'

interface ScreenGuardPlugin {
  enable(): Promise<void>
  disable(): Promise<void>
}

const Native = registerPlugin('ScreenGuard') as unknown as ScreenGuardPlugin

const isAndroid = () => {
  try { return Capacitor.getPlatform() === 'android' } catch { return false }
}

export const screenGuard = {
  async enable(): Promise<void> {
    if (!isAndroid()) return
    try { await Native.enable() } catch { /* plugin missing on older builds — fail open */ }
  },
  async disable(): Promise<void> {
    if (!isAndroid()) return
    try { await Native.disable() } catch { /* ignore */ }
  },
}

export default screenGuard
