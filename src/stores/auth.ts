/**
 * Auth store — current user, tokens, login/logout. Backed by localStorage.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../api/endpoints'
import { setToken, setRefreshToken } from '../api/client'

type AuthState = {
  user: User | null
  token: string | null
  refreshToken: string | null
  signIn: (user: User, token: string, refreshToken?: string) => void
  signOut: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      signIn: (user, token, refreshToken) => {
        setToken(token)
        if (refreshToken) setRefreshToken(refreshToken)
        set({ user, token, refreshToken: refreshToken ?? null })
      },
      signOut: () => {
        setToken(null)
        setRefreshToken(null)
        set({ user: null, token: null, refreshToken: null })
      },
    }),
    { name: 'crymadx.auth' },
  ),
)
