/**
 * Biometric lock hook.
 *
 *   • On native (when wrapped with Capacitor + @aparajita/capacitor-biometric-auth)
 *     it uses the native Face ID / Touch ID / fingerprint prompt and re-locks
 *     when the app is backgrounded.
 *
 *   • On web it uses the WebAuthn "platform authenticator" flow — Mac Touch ID
 *     on Safari/Chrome, Android fingerprint on Chrome, Windows Hello, etc.
 *     The credential is created lazily on first enable and stored as a userHandle
 *     in localStorage; subsequent unlocks call navigator.credentials.get().
 *
 * The Capacitor module is loaded lazily so this works whether or not the
 * plugin is installed. Once we wrap the app with Capacitor, no caller change.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const BIOMETRIC_PREF_KEY = 'crymadx.biometric.enabled'
const WEBAUTHN_CRED_KEY = 'crymadx.biometric.webauthn.cred'

type CapacitorMods = {
  Capacitor: any
  BiometricAuth: any
  App?: any
}

let cachedMods: CapacitorMods | null | undefined

// Dynamic import that hides the path from Vite's static analyzer so the
// dev server doesn't 500 when these packages aren't installed.
const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

async function loadCapacitor(): Promise<CapacitorMods | null> {
  if (cachedMods !== undefined) return cachedMods
  try {
    const [coreMod, bioMod, appMod] = await Promise.all([
      dynImport('@capacitor/core').catch(() => null),
      dynImport('@aparajita/capacitor-biometric-auth').catch(() => null),
      dynImport('@capacitor/app').catch(() => null),
    ])
    if (coreMod && bioMod && coreMod.Capacitor?.isNativePlatform?.()) {
      cachedMods = { Capacitor: coreMod.Capacitor, BiometricAuth: bioMod.BiometricAuth, App: appMod?.App }
    } else {
      cachedMods = null
    }
  } catch {
    cachedMods = null
  }
  return cachedMods
}

// ─── WebAuthn helpers ────────────────────────────────────────────────────────

function buf2b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64url2buf(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const norm = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(norm)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function webAuthnSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials?.create
}

async function platformAuthAvailable(): Promise<boolean> {
  if (!webAuthnSupported()) return false
  try {
    return await (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

async function webAuthnRegister(): Promise<boolean> {
  if (!webAuthnSupported()) return false
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(16))
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { id: window.location.hostname, name: 'CrymadX' },
        user: { id: userId, name: 'crymadx-local', displayName: 'CrymadX' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },     // ES256
          { type: 'public-key', alg: -257 },   // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null
    if (!cred) return false
    localStorage.setItem(WEBAUTHN_CRED_KEY, buf2b64url(cred.rawId))
    return true
  } catch (e) {
    // Surface to console so we can debug if Mac Touch ID disabled
    console.warn('[biometric] register failed', e)
    return false
  }
}

async function webAuthnVerify(): Promise<boolean> {
  if (!webAuthnSupported()) return false
  const credId = localStorage.getItem(WEBAUTHN_CRED_KEY)
  if (!credId) return false
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60_000,
        userVerification: 'required',
        allowCredentials: [{ type: 'public-key', id: b64url2buf(credId).buffer as ArrayBuffer }],
      },
    })
    return !!assertion
  } catch (e) {
    console.warn('[biometric] verify failed', e)
    return false
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBiometricLock(isAuthenticated: boolean) {
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(BIOMETRIC_PREF_KEY) === 'true'
  })
  const [isLocked, setIsLocked] = useState(false)
  const wasBackgrounded = useRef(false)

  // Detect availability — native first, then WebAuthn
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mods = await loadCapacitor()
      if (mods) {
        try {
          const r = await mods.BiometricAuth.checkBiometry()
          if (!cancelled) setBiometricAvailable(!!r?.isAvailable)
        } catch { if (!cancelled) setBiometricAvailable(false) }
        return
      }
      const ok = await platformAuthAvailable()
      if (!cancelled) setBiometricAvailable(ok)
    })()
    return () => { cancelled = true }
  }, [])

  // Auto-lock on app background (native only)
  useEffect(() => {
    if (!biometricEnabled || !isAuthenticated) return
    let listenerHandle: { remove: () => void } | null = null
    let cancelled = false
    ;(async () => {
      const mods = await loadCapacitor()
      if (!mods?.App) return
      const handle = await mods.App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (!isActive) wasBackgrounded.current = true
        else if (wasBackgrounded.current) { wasBackgrounded.current = false; setIsLocked(true) }
      })
      if (cancelled) handle.remove()
      else listenerHandle = handle
    })()
    return () => { cancelled = true; listenerHandle?.remove() }
  }, [biometricEnabled, isAuthenticated])

  const authenticate = useCallback(async (): Promise<boolean> => {
    const mods = await loadCapacitor()
    if (mods) {
      try {
        await mods.BiometricAuth.authenticate({ reason: 'Unlock CrymadX', cancelTitle: 'Cancel', allowDeviceCredential: true })
        setIsLocked(false)
        return true
      } catch { return false }
    }
    // Web — WebAuthn
    const ok = await webAuthnVerify()
    if (ok) setIsLocked(false)
    return ok
  }, [])

  const toggleBiometric = useCallback(async (enable: boolean): Promise<boolean> => {
    if (!enable) {
      localStorage.setItem(BIOMETRIC_PREF_KEY, 'false')
      localStorage.removeItem(WEBAUTHN_CRED_KEY)
      setBiometricEnabled(false)
      setIsLocked(false)
      return true
    }
    // Enable: native does an auth probe; web registers a WebAuthn credential
    const mods = await loadCapacitor()
    if (mods) {
      try {
        await mods.BiometricAuth.authenticate({ reason: 'Enable biometric for CrymadX', cancelTitle: 'Cancel', allowDeviceCredential: true })
        localStorage.setItem(BIOMETRIC_PREF_KEY, 'true')
        setBiometricEnabled(true)
        return true
      } catch { return false }
    }
    const created = await webAuthnRegister()
    if (created) {
      localStorage.setItem(BIOMETRIC_PREF_KEY, 'true')
      setBiometricEnabled(true)
      return true
    }
    return false
  }, [])

  return { biometricAvailable, biometricEnabled, isLocked, authenticate, toggleBiometric, setIsLocked }
}
