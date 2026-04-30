import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface Options {
  enabled?: boolean
  /** Distance in px from the left edge where the swipe must START.
   *  Mirrors iOS's edge-swipe-back region. Set to 0 to allow swipes from anywhere
   *  (rarely what you want — would conflict with horizontal-scrolling content). */
  edgeWidth?: number
  /** Min horizontal distance (px) to register as a back-swipe. */
  threshold?: number
  /** Max vertical drift allowed during the swipe. If the user moves up/down
   *  more than this they're scrolling, not navigating — abort. */
  vertThreshold?: number
  /** Max gesture duration in ms. Prevents accidental triggers from long
   *  finger-on-screen pauses. */
  maxDurationMs?: number
  /** Override the default nav(-1) — use this when a screen needs custom back
   *  logic (e.g. closing a sheet instead of navigating). */
  onBack?: () => void
}

/**
 * iOS-style swipe-from-left-edge to navigate back. Listens at the document level,
 * so any screen that mounts this hook gets the gesture for free.
 *
 * Skipped when:
 *   - The browser has no history to go back to
 *   - The touch starts on an element marked `data-no-swipe-back`
 *     (use this on modals, sheets, or any horizontally-scrolling region)
 */
export function useSwipeBack(opts: Options = {}) {
  const {
    enabled = true,
    edgeWidth = 36,
    threshold = 80,
    vertThreshold = 60,
    maxDurationMs = 800,
    onBack,
  } = opts
  const nav = useNavigate()
  const start = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      // Only track if the swipe begins inside the left-edge zone — keeps us
      // out of the way of horizontally-scrolling lists, charts, asset pickers.
      if (t.clientX > edgeWidth) return
      // Respect opt-out marker — sheets/modals can set this to disable swipe-back
      // while they're open.
      const target = e.target as HTMLElement | null
      if (target?.closest?.('[data-no-swipe-back]')) return
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    }

    const onMove = (e: TouchEvent) => {
      if (!start.current) return
      const t = e.touches[0]
      if (!t) return
      // If the user starts moving vertically more than horizontally, they're
      // scrolling — abort the gesture so we don't fight scroll.
      const dy = Math.abs(t.clientY - start.current.y)
      if (dy > vertThreshold) start.current = null
    }

    const onEnd = (e: TouchEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - s.x
      const dy = Math.abs(t.clientY - s.y)
      const dt = Date.now() - s.t
      if (
        dx > threshold &&
        dy < vertThreshold &&
        dt < maxDurationMs &&
        // Don't try to go back if there's nowhere to go (fresh tab, root URL)
        window.history.length > 1
      ) {
        if (onBack) onBack()
        else nav(-1)
      }
    }

    // Keyboard parity: ESC navigates back too. Useful on desktop and for
    // accessibility (motor-impaired users who can't perform precise swipes).
    // Skipped if focus is on an input/textarea — those have their own ESC behavior.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      // Don't fight modal dialogs — they handle their own dismiss
      if ((e.target as HTMLElement | null)?.closest?.('[data-no-swipe-back]')) return
      if (window.history.length <= 1) return
      if (onBack) onBack()
      else nav(-1)
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('keydown', onKey)
    }
  }, [enabled, edgeWidth, threshold, vertThreshold, maxDurationMs, onBack, nav])
}
