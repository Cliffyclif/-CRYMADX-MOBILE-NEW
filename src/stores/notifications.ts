/**
 * Live notifications store. Holds the most recent notifications fetched from
 * the backend, an unread count, and a transient "toast queue" of notifications
 * that have arrived since the user last looked at the screen — those animate
 * in from the top and auto-dismiss.
 *
 * The `ingest()` action de-dupes by id and emits new arrivals into the toast
 * queue. The polling hook (useLiveNotifications) calls ingest() on each tick.
 */
import { create } from 'zustand'

export interface Notif {
  id: string
  type: string
  title: string
  body: string
  icon?: string
  /** ISO timestamp */
  createdAt: string
  read?: boolean
  /** Optional deep link the user is taken to when they tap the notification */
  href?: string
  /** Tone for color theming (g/gd/r/info — matches existing notification.tsx) */
  tone?: 'g' | 'gd' | 'r' | 'info'
  /** Server-pushed extra payload (admin announcements may carry data) */
  data?: Record<string, unknown>
}

type State = {
  items: Notif[]
  toastQueue: Notif[]
  /** Bumps every time the local "seen" cursor advances. We compare seenAt
   *  against `createdAt` to compute unread count without server round-trips. */
  seenAt: number
}

type Actions = {
  /** Replace the full list (e.g. on initial load). Sets seenAt if not set. */
  hydrate: (items: Notif[]) => void
  /** Merge new items by id, push truly-new ones into the toast queue. */
  ingest: (items: Notif[]) => void
  /** Remove the front toast (after it auto-dismisses or is tapped). */
  dismissToast: (id: string) => void
  /** Mark all as seen — drops unread count to 0. */
  markAllSeen: () => void
  /** Mark every item as read locally (optimistic) — flips the unread dot/border
   *  and advances the seen cursor. Pairs with the server-side read mutation. */
  markAllRead: () => void
  /** Clear everything (called on signOut). */
  reset: () => void
}

export const useNotifications = create<State & Actions>((set, get) => ({
  items: [],
  toastQueue: [],
  seenAt: 0,

  hydrate: (items) => set((s) => ({
    items,
    // First hydrate after sign-in: pretend the user has already seen everything
    // to avoid spamming them with N toasts on app open.
    seenAt: s.seenAt || (items[0] ? new Date(items[0].createdAt).getTime() : Date.now()),
  })),

  ingest: (incoming) => {
    const cur = get()
    const seen = new Set(cur.items.map(i => i.id))
    const trulyNew = incoming.filter(i => !seen.has(i.id))
    if (trulyNew.length === 0 && incoming.length === cur.items.length) return
    // Merge — incoming becomes the canonical order (server returns sorted desc by createdAt)
    const byId = new Map<string, Notif>()
    for (const item of [...incoming, ...cur.items]) byId.set(item.id, item)
    const merged = Array.from(byId.values()).sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
    // Only items newer than the seen cursor get toasted
    const toToast = trulyNew.filter(i => +new Date(i.createdAt) > cur.seenAt)
    set({
      items: merged,
      toastQueue: [...cur.toastQueue, ...toToast].slice(-3), // cap at 3 stacked toasts
    })
  },

  dismissToast: (id) => set(s => ({ toastQueue: s.toastQueue.filter(t => t.id !== id) })),
  markAllSeen: () => set({ seenAt: Date.now(), toastQueue: [] }),
  markAllRead: () => set(s => ({
    items: s.items.some(i => !i.read) ? s.items.map(i => (i.read ? i : { ...i, read: true })) : s.items,
    seenAt: Date.now(),
    toastQueue: [],
  })),
  reset: () => set({ items: [], toastQueue: [], seenAt: 0 }),
}))

/** Selector helper — count of items newer than seenAt. */
export function useUnreadCount(): number {
  return useNotifications(s => {
    const cutoff = s.seenAt
    return s.items.filter(i => !i.read && +new Date(i.createdAt) > cutoff).length
  })
}
