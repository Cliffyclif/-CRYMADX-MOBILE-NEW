/**
 * Theme store — mode (dark / light / system), accent colour, and accessibility
 * toggles (reduce motion, bold text, high contrast). All persisted and applied
 * at the document level:
 *   - mode    → <body class="light"> (system resolves via prefers-color-scheme)
 *   - accent  → overrides --gl / --g CSS variables
 *   - a11y    → <body class="reduce-motion | bold-text | high-contrast">
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'

// Wave Green = the app's default accent (no override → uses :root --gl/--g).
export const DEFAULT_ACCENT = '#1B8C3E'

type ThemeState = {
  theme: ThemeMode
  accent: string
  reduceMotion: boolean
  boldText: boolean
  highContrast: boolean
  setTheme: (t: ThemeMode) => void
  setAccent: (c: string) => void
  setReduceMotion: (v: boolean) => void
  setBoldText: (v: boolean) => void
  setHighContrast: (v: boolean) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      accent: DEFAULT_ACCENT,
      reduceMotion: false,
      boldText: false,
      highContrast: false,
      setTheme: (theme) => { set({ theme }); applyTheme(theme) },
      setAccent: (accent) => { set({ accent }); applyAccent(accent) },
      setReduceMotion: (v) => { set({ reduceMotion: v }); applyClass('reduce-motion', v) },
      setBoldText: (v) => { set({ boldText: v }); applyClass('bold-text', v) },
      setHighContrast: (v) => { set({ highContrast: v }); applyClass('high-contrast', v) },
      toggle: () => {
        const next: ThemeMode = isLight(get().theme) ? 'dark' : 'light'
        set({ theme: next }); applyTheme(next)
      },
    }),
    { name: 'crymadx.theme' },
  ),
)

function prefersLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
}
function isLight(mode: ThemeMode): boolean {
  return mode === 'light' || (mode === 'system' && prefersLight())
}
function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('light', isLight(mode))
}
function applyAccent(color: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (color && color.toUpperCase() !== DEFAULT_ACCENT.toUpperCase()) {
    root.style.setProperty('--gl', color)
    root.style.setProperty('--g', color)
  } else {
    root.style.removeProperty('--gl')
    root.style.removeProperty('--g')
  }
}
function applyClass(cls: string, on: boolean) {
  if (typeof document === 'undefined') return
  document.body.classList.toggle(cls, on)
}

// Follow OS theme changes while in 'system' mode.
if (typeof window !== 'undefined' && window.matchMedia) {
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (useTheme.getState().theme === 'system') applyTheme('system')
    })
  } catch { /* older Safari */ }
}

// Apply all persisted settings once after hydration.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const s = useTheme.getState()
    applyTheme(s.theme)
    applyAccent(s.accent)
    applyClass('reduce-motion', s.reduceMotion)
    applyClass('bold-text', s.boldText)
    applyClass('high-contrast', s.highContrast)
  }, 0)
}
