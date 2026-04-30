/**
 * Display-size store — small / medium / large.
 *
 * Drives a CSS variable `--ui-scale` on the root element. The Bold Waves
 * stylesheet uses this variable to multiply font-size, gap, and padding
 * across the app. Persisted to localStorage so the user's choice survives
 * reloads.
 */
import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DisplaySize = 'small' | 'medium' | 'large'

const SCALES: Record<DisplaySize, number> = {
  small: 1,
  medium: 1.12,
  large: 1.25,
}

type DisplayState = {
  size: DisplaySize
  set: (s: DisplaySize) => void
}

export const useDisplay = create<DisplayState>()(
  persist(
    (set) => ({
      size: 'small',
      set: (s) => set({ size: s }),
    }),
    { name: 'crymadx.display' },
  ),
)

export function applyDisplayScale(size: DisplaySize) {
  if (typeof document === 'undefined') return
  const scale = SCALES[size] ?? 1
  document.documentElement.style.setProperty('--ui-scale', String(scale))
  document.documentElement.dataset.size = size
}

/**
 * Hook used in App root: keeps the CSS variable in sync with the store.
 */
export function useApplyDisplayScale() {
  const size = useDisplay(s => s.size)
  useEffect(() => { applyDisplayScale(size) }, [size])
}
