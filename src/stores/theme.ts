/**
 * Theme store — dark / light mode toggle. Persisted.
 * Applies via <body class="light"> at the document level.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeState = {
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggle: () => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },
    }),
    { name: 'crymadx.theme' },
  ),
)

function applyTheme(t: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  if (t === 'light') document.body.classList.add('light')
  else document.body.classList.remove('light')
}

// Apply on import
if (typeof window !== 'undefined') {
  // After hydration, useTheme.getState() reflects persisted value
  setTimeout(() => applyTheme(useTheme.getState().theme), 0)
}
