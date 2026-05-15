/**
 * useCapacitorAppState
 * --------------------
 * Bridges the native Capacitor app lifecycle into the web app.
 *
 * 1. React Query focus bridge — TanStack's default `refetchOnWindowFocus`
 *    relies on the browser `visibilitychange`/`focus` events. Those do NOT
 *    fire reliably when an Android/iOS Capacitor app is backgrounded and
 *    resumed, so without this the app shows STALE data (notably balances
 *    that diverge from the website) after every resume. We forward
 *    Capacitor's `appStateChange` into React Query's focusManager.
 *
 * 2. Splash hide — hides the native splash once React has painted, so the
 *    splash never disappears before the UI is ready (no white flash).
 *
 * No-ops cleanly on the plain web build (plugins resolve to null).
 */

import { useEffect } from 'react'
import { focusManager } from '@tanstack/react-query'

let focusBridgeInstalled = false

export function useCapacitorAppState() {
  useEffect(() => {
    let cancelled = false

    void (async () => {
      // Hide the native splash screen now that React has mounted.
      try {
        const splash: any = await import('@capacitor/splash-screen').catch(() => null)
        if (splash?.SplashScreen?.hide) {
          await splash.SplashScreen.hide()
        }
      } catch { /* web build / plugin missing — ignore */ }

      // Install the focus bridge exactly once for the app's lifetime.
      if (focusBridgeInstalled || cancelled) return
      try {
        const appMod: any = await import('@capacitor/app').catch(() => null)
        if (cancelled || !appMod?.App?.addListener) return
        focusBridgeInstalled = true
        focusManager.setEventListener((handleFocus) => {
          let handle: { remove: () => void } | null = null
          // App foregrounded → handleFocus(true) refetches stale queries
          // (balances, etc). Backgrounded → handleFocus(false).
          appMod.App
            .addListener('appStateChange', (state: { isActive: boolean }) => {
              handleFocus(state.isActive)
            })
            .then((h: { remove: () => void }) => {
              handle = h
              if (cancelled) handle.remove()
            })
            .catch(() => { /* ignore */ })
          return () => { handle?.remove() }
        })
      } catch { /* web build — keep React Query's default focus detection */ }
    })()

    return () => { cancelled = true }
  }, [])
}
