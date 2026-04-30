/**
 * Privacy store — controls whether monetary values are masked across the app.
 * Toggled via the eye icon on Home / Wallet / AssetDetail.
 *
 * Persisted to localStorage so the user's choice survives reloads.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PrivacyState = {
  hidden: boolean
  toggle: () => void
  set: (v: boolean) => void
}

export const usePrivacy = create<PrivacyState>()(
  persist(
    (set, get) => ({
      hidden: false,
      toggle: () => set({ hidden: !get().hidden }),
      set: (v) => set({ hidden: v }),
    }),
    { name: 'crymadx.privacy' },
  ),
)

/** Mask any string value with ••• when privacy is on. */
export function maskIfHidden(value: string | number | null | undefined, hidden: boolean): string {
  if (!hidden) return String(value ?? '')
  // Length-aware mask so balances of different magnitudes look similar to before
  const s = String(value ?? '')
  if (s.length === 0) return '•••'
  if (s.length <= 4) return '•••'
  if (s.length <= 8) return '••••••'
  return '••••••••'
}
