/**
 * Google sign-in hook. Capacitor-aware:
 *
 *   • On web (and inside the Capacitor webview when running on Android with
 *     no native plugin) it uses Google Identity Services'
 *     `google.accounts.oauth2.initTokenClient({...}).requestAccessToken()`
 *     to get an OAuth 2.0 access token from a popup, then POSTs that
 *     access token to the backend's POST /api/auth/google endpoint which
 *     verifies it with Google and returns our JWT session.
 *
 *   • On Capacitor native (when @codetrix-studio/capacitor-google-auth is
 *     installed and the platform is native), it uses the native plugin
 *     which presents the system Google account picker and returns an
 *     idToken. Same backend call, same JWT session back.
 *
 * The plugin is loaded lazily so this works whether or not it's installed.
 * Once we wrap with Capacitor and `npm install @codetrix-studio/capacitor-google-auth`,
 * this hook auto-switches to the native flow with no caller changes.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../stores/auth'
import type { AuthSession } from '../api/endpoints'

const GIS_SCRIPT_ID = 'gsi-client'
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

declare global {
  interface Window {
    google?: any
  }
}

let gisLoaded: Promise<void> | null = null
function loadGIS(): Promise<void> {
  if (gisLoaded) return gisLoaded
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.oauth2) return (gisLoaded = Promise.resolve())
  gisLoaded = new Promise((resolve, reject) => {
    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.google?.accounts?.oauth2) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const s = document.createElement('script')
    s.id = GIS_SCRIPT_ID
    s.src = GIS_SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return gisLoaded
}

let cachedNative: any | null | undefined
async function loadNativePlugin(): Promise<any | null> {
  if (cachedNative !== undefined) return cachedNative
  try {
    const [coreMod, gauthMod] = await Promise.all([
      dynImport('@capacitor/core').catch(() => null),
      dynImport('@codetrix-studio/capacitor-google-auth').catch(() => null),
    ])
    if (coreMod?.Capacitor?.isNativePlatform?.() && gauthMod?.GoogleAuth) {
      cachedNative = gauthMod.GoogleAuth
    } else {
      cachedNative = null
    }
  } catch { cachedNative = null }
  return cachedNative
}

interface UseGoogleSignInResult {
  signIn: () => Promise<AuthSession | null>
  isAvailable: boolean
  isLoading: boolean
  error: string | null
}

export function useGoogleSignIn(): UseGoogleSignInResult {
  const signInStore = useAuth(s => s.signIn)
  const tokenClientRef = useRef<any>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim()

  // Detect availability — native plugin first, then GIS web SDK
  useEffect(() => {
    let cancelled = false
    if (!clientId) { setIsAvailable(false); return }
    ;(async () => {
      const native = await loadNativePlugin()
      if (native) { if (!cancelled) setIsAvailable(true); return }
      try {
        await loadGIS()
        if (!cancelled) setIsAvailable(!!window.google?.accounts?.oauth2)
      } catch {
        if (!cancelled) setIsAvailable(false)
      }
    })()
    return () => { cancelled = true }
  }, [clientId])

  /** Exchange a Google credential (access token or id token) for our JWT session. */
  const exchangeForSession = useCallback(async (credential: string): Promise<AuthSession> => {
    const session = await api<AuthSession>('api.auth.google', { body: { credential } }) as AuthSession
    signInStore(session.user, session.accessToken, (session as any).refreshToken)
    return session
  }, [signInStore])

  const signIn = useCallback(async (): Promise<AuthSession | null> => {
    setError(null)
    if (!clientId) {
      setError('Google Client ID is not configured')
      return null
    }
    setIsLoading(true)
    try {
      // Native path
      const native = await loadNativePlugin()
      if (native) {
        try {
          const user = await native.signIn()
          const credential = user?.authentication?.idToken ?? user?.authentication?.accessToken
          if (!credential) throw new Error('No credential returned by native Google plugin')
          return await exchangeForSession(credential)
        } catch (e: any) {
          if (e?.code === '12501' || /cancel/i.test(String(e?.message ?? ''))) return null
          throw e
        }
      }

      // Web path — GIS implicit OAuth 2.0 flow, returns access token
      await loadGIS()
      if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services not available')

      return await new Promise<AuthSession | null>((resolve, reject) => {
        if (!tokenClientRef.current) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (resp: any) => {
              if (resp.error) {
                if (resp.error === 'popup_closed_by_user' || resp.error === 'access_denied') {
                  resolve(null)
                  return
                }
                reject(new Error(resp.error_description ?? resp.error))
                return
              }
              try {
                const session = await exchangeForSession(resp.access_token)
                resolve(session)
              } catch (err) { reject(err) }
            },
            error_callback: (err: any) => {
              if (err?.type === 'popup_closed') { resolve(null); return }
              reject(new Error(err?.message ?? 'Google sign-in failed'))
            },
          })
        }
        tokenClientRef.current.requestAccessToken({ prompt: '' })
      })
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [clientId, exchangeForSession])

  return { signIn, isAvailable, isLoading, error }
}
