/**
 * Display-size store — small / medium / large.
 *
 * Wires CSS `zoom` on <html> so EVERY pixel-sized element (text, padding,
 * borders, icons, layout) scales uniformly. The previous version set
 * `--ui-scale` and multiplied the root font-size, but the codebase uses
 * px throughout so that approach was a no-op. CSS zoom is the only way
 * to scale a px-heavy stylesheet without rewriting every value.
 *
 * Persisted to localStorage so the choice survives reloads.
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
  const root = document.documentElement
  // The CSS variable drives `.app-shell { zoom: var(--ui-scale) }` — see
  // bold-waves.css. Putting zoom on the shell (not <html>) keeps the
  // phone-frame container at viewport size while every px-based child
  // (text, padding, icons, layout) renders 12-25% larger. CSS `zoom` is
  // the only mechanism that scales a px-heavy stylesheet without
  // rewriting every value to rem.
  root.style.setProperty('--ui-scale', String(scale))
  root.dataset.size = size
}

/**
 * Hook used in App root: keeps the zoom in sync with the store.
 */
export function useApplyDisplayScale() {
  const size = useDisplay(s => s.size)
  useEffect(() => { applyDisplayScale(size) }, [size])
}
