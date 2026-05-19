/**
 * useVersionGate — decides whether to show the update gate.
 *
 * Checks once on mount and again every time the app returns to the foreground,
 * so an admin flipping the policy to "hard" reaches users without an app
 * restart. Fails open: web build or unreachable backend → no gate.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  fetchVersionConfig,
  getNativeVersion,
  type PlatformVersionConfig,
} from '../lib/appVersion'

export type GateState =
  | { kind: 'none' }
  | { kind: 'hard'; cfg: PlatformVersionConfig; installedVersion: string }
  | { kind: 'soft'; cfg: PlatformVersionConfig; installedVersion: string }

// Remembers the latest build the user said "Later" to — the soft prompt stays
// hidden until a newer release bumps latestVersionCode again.
const SOFT_DISMISS_KEY = 'crymadx.update.softDismissed'

export function useVersionGate() {
  const [state, setState] = useState<GateState>({ kind: 'none' })

  const check = useCallback(async () => {
    const native = await getNativeVersion()
    if (!native) return // web build — nothing to update
    const config = await fetchVersionConfig()
    if (!config) return // fail open — backend unreachable

    const cfg = config[native.platform]
    if (!cfg || cfg.mode === 'off') {
      setState({ kind: 'none' })
      return
    }

    // Hard block — a critical release; the installed build is below the floor.
    if (cfg.mode === 'hard' && cfg.minVersionCode > 0 && native.versionCode < cfg.minVersionCode) {
      setState({ kind: 'hard', cfg, installedVersion: native.versionName })
      return
    }

    // Soft prompt — a newer build exists but the current one still works.
    if (cfg.latestVersionCode > 0 && native.versionCode < cfg.latestVersionCode) {
      let dismissed: string | null = null
      try { dismissed = localStorage.getItem(SOFT_DISMISS_KEY) } catch { /* ignore */ }
      if (dismissed === String(cfg.latestVersionCode)) {
        setState({ kind: 'none' })
        return
      }
      setState({ kind: 'soft', cfg, installedVersion: native.versionName })
      return
    }

    setState({ kind: 'none' })
  }, [])

  useEffect(() => {
    void check()
    let handle: { remove: () => void } | null = null
    void (async () => {
      const appMod: any = await import('@capacitor/app').catch(() => null)
      if (!appMod?.App?.addListener) return
      const h = await appMod.App
        .addListener('appStateChange', (s: { isActive: boolean }) => {
          if (s.isActive) void check()
        })
        .catch(() => null)
      if (h) handle = h
    })()
    return () => { handle?.remove() }
  }, [check])

  /** Dismiss the soft prompt — suppressed until a newer release ships. */
  const dismissSoft = useCallback(() => {
    setState((s) => {
      if (s.kind === 'soft') {
        try { localStorage.setItem(SOFT_DISMISS_KEY, String(s.cfg.latestVersionCode)) } catch { /* ignore */ }
      }
      return { kind: 'none' }
    })
  }, [])

  return { state, dismissSoft }
}
