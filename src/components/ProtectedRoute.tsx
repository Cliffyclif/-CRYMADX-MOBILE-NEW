/**
 * ProtectedRoute — gates routes behind authentication.
 *
 * Bypass: append `?nav=all` to any URL (saved to localStorage so it
 * sticks across navigation). Useful for the boss/stakeholders to
 * navigate every screen without going through the auth flow.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { type ReactNode, useEffect } from 'react'
import { useAuth } from '../stores/auth'
import { ROUTES } from '../routes'

const NAV_BYPASS_KEY = 'crymadx.nav.bypass'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const user = useAuth(s => s.user)

  // Initialize bypass from query param once
  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    if (params.get('nav') === 'all') {
      localStorage.setItem(NAV_BYPASS_KEY, '1')
    }
  }, [loc.search])

  const bypass = typeof localStorage !== 'undefined' && localStorage.getItem(NAV_BYPASS_KEY) === '1'

  if (user || bypass) return <>{children}</>
  return <Navigate to={ROUTES['route.auth.login'].path} replace state={{ from: loc.pathname }} />
}

export function clearNavBypass() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(NAV_BYPASS_KEY)
}

export function navBypassActive(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(NAV_BYPASS_KEY) === '1'
}
