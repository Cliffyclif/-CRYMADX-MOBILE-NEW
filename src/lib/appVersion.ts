/**
 * appVersion — native version detection + remote update-gate config.
 *
 * Powers the admin-controlled force-update feature. The mobile app reads its
 * own native build number, fetches the version policy the admin set in the
 * dashboard, and decides whether to block (hard) or nudge (soft) the user.
 *
 * Everything here FAILS OPEN: on the web build, or if the config endpoint is
 * unreachable, no gate is shown — a network blip must never lock users out.
 */

/** One platform's update policy, as stored in the backend `app_version_config`. */
export type PlatformVersionConfig = {
  /** Builds below this are hard-blocked (only when mode === 'hard'). 0 = no floor. */
  minVersionCode: number
  /** Builds below this get the soft "update available" prompt. 0 = disabled. */
  latestVersionCode: number
  /** Human-readable name of the latest release, e.g. "1.0.3". */
  latestVersionName: string
  /** 'off' = gate disabled · 'soft' = nudge only · 'hard' = block below minVersionCode. */
  mode: 'off' | 'soft' | 'hard'
  /** Store listing URL the Update button opens. */
  storeUrl: string
  /** Modal heading. */
  title: string
  /** Modal body copy. */
  message: string
  /** Optional bullet list of highlights. */
  whatsNew: string[]
}

export type AppVersionConfig = {
  android: PlatformVersionConfig
  ios: PlatformVersionConfig
}

/** Native app version info, or null on the plain web build. */
export type NativeVersion = {
  platform: 'android' | 'ios'
  /** Android: versionCode · iOS: CFBundleVersion. */
  versionCode: number
  /** Android: versionName · iOS: CFBundleShortVersionString. */
  versionName: string
}

// Mirrors API_BASE_URL in src/api/client.ts — kept inline so this module has
// no dependency on the (very large) client module.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')

/**
 * Reads the running app's native version. Returns null on the web build
 * (where there is nothing to update) or if the Capacitor App plugin is absent.
 */
export async function getNativeVersion(): Promise<NativeVersion | null> {
  const platform = (window as unknown as { Capacitor?: { getPlatform?: () => string } })
    ?.Capacitor?.getPlatform?.()
  if (platform !== 'android' && platform !== 'ios') return null
  try {
    const appMod: any = await import('@capacitor/app').catch(() => null)
    const info = await appMod?.App?.getInfo?.()
    if (!info) return null
    const versionCode = parseInt(String(info.build ?? '0'), 10)
    return {
      platform,
      versionCode: Number.isFinite(versionCode) ? versionCode : 0,
      versionName: String(info.version ?? ''),
    }
  } catch {
    return null
  }
}

/**
 * Fetches the admin-defined version policy. Returns null on any failure so the
 * caller fails open (no gate).
 */
export async function fetchVersionConfig(): Promise<AppVersionConfig | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`${API_BASE}/app-version`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const json = await res.json()
    return (json?.config as AppVersionConfig) ?? null
  } catch {
    return null
  }
}
