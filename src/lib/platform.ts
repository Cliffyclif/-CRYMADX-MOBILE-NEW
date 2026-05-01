/**
 * Platform detection — synchronous check whether we're running inside
 * the Capacitor native shell.
 *
 * Capacitor injects `window.Capacitor` at startup, well before our React
 * code mounts. Reading it synchronously is reliable and avoids the
 * dynamic-import dance the per-feature hooks use (those exist because
 * they ALSO need to call into specific plugins; here we just need a
 * boolean).
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!cap?.isNativePlatform?.() || cap?.platform === 'android' || cap?.platform === 'ios'
}
