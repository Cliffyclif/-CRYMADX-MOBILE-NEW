/**
 * Haptic feedback. Capacitor-aware:
 *   - On native (when wrapped with Capacitor + @capacitor/haptics installed) it
 *     fires real iOS/Android haptic taps via the plugin.
 *   - On web it falls back to navigator.vibrate, which works on most Android
 *     browsers and is a no-op on iOS Safari.
 *
 * The plugin is loaded lazily so the code works whether or not Capacitor
 * is installed. When we eventually `npm install @capacitor/haptics` and
 * wrap with Capacitor, no caller changes are needed — this just lights up.
 */

type Style = 'light' | 'medium' | 'heavy'
type NotifKind = 'success' | 'warning' | 'error'

let cachedHaptics: any | null | undefined

// Dynamic require that Vite's static analyzer can't see — at runtime the
// package either resolves (when wrapped with Capacitor) or rejects silently.
// Vite tree-shakes it out of the web build. New Function avoids dev-server
// pre-bundling errors when the package isn't installed.
const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

async function loadNativeHaptics(): Promise<any | null> {
  if (cachedHaptics !== undefined) return cachedHaptics
  try {
    cachedHaptics = await dynImport('@capacitor/haptics').catch(() => null)
  } catch {
    cachedHaptics = null
  }
  return cachedHaptics
}

function webVibrate(durationMs: number) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(durationMs) } catch { /* ignore */ }
  }
}

async function impact(style: Style) {
  const native = await loadNativeHaptics()
  if (native?.Haptics?.impact && native?.ImpactStyle) {
    const map = { light: native.ImpactStyle.Light, medium: native.ImpactStyle.Medium, heavy: native.ImpactStyle.Heavy }
    try { await native.Haptics.impact({ style: map[style] }); return } catch { /* fallthrough */ }
  }
  webVibrate(style === 'light' ? 10 : style === 'medium' ? 18 : 30)
}

async function notify(kind: NotifKind) {
  const native = await loadNativeHaptics()
  if (native?.Haptics?.notification && native?.NotificationType) {
    const map = { success: native.NotificationType.Success, warning: native.NotificationType.Warning, error: native.NotificationType.Error }
    try { await native.Haptics.notification({ type: map[kind] }); return } catch { /* fallthrough */ }
  }
  if (kind === 'success') webVibrate(20)
  else if (kind === 'warning') { webVibrate(30) }
  else webVibrate(60)
}

async function selection() {
  const native = await loadNativeHaptics()
  if (native?.Haptics?.selectionChanged) {
    try { await native.Haptics.selectionChanged(); return } catch { /* fallthrough */ }
  }
  webVibrate(8)
}

export const haptics = {
  light: () => impact('light'),
  medium: () => impact('medium'),
  heavy: () => impact('heavy'),
  success: () => notify('success'),
  warning: () => notify('warning'),
  error: () => notify('error'),
  selection,
  vibrate: (durationMs = 100) => webVibrate(durationMs),
}

export default haptics
