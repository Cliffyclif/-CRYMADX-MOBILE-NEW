import { useRef, useState, type TouchEvent } from 'react'

interface Options {
  /** Called when the user has swiped down far/fast enough to dismiss. */
  onDismiss: () => void
  /** Min vertical distance (px) to register as a dismiss-swipe. */
  threshold?: number
}

/**
 * Bottom-sheet swipe-down-to-dismiss. Returns:
 *   - `bind`: spread onto the touch-target element (typically the sheet's drag handle)
 *   - `translateY`: current px the sheet should be translated to follow the finger
 *   - `dragging`: true while a drag is in progress (lets you disable transitions)
 *
 * Usage:
 *   const dismiss = useSheetDismiss({ onDismiss: () => setOpen(false) })
 *   <div {...dismiss.bind} style={{ transform: `translateY(${dismiss.translateY}px)` }} />
 */
export function useSheetDismiss({ onDismiss, threshold = 100 }: Options) {
  const start = useRef<{ y: number; t: number } | null>(null)
  const [translateY, setTranslateY] = useState(0)
  const [dragging, setDragging] = useState(false)

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    start.current = { y: t.clientY, t: Date.now() }
    setDragging(true)
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!start.current) return
    const t = e.touches[0]
    if (!t) return
    // Only allow downward drag — upward is ignored (no rubber-band needed).
    const dy = Math.max(0, t.clientY - start.current.y)
    setTranslateY(dy)
  }
  const onTouchEnd = (e: TouchEvent) => {
    const s = start.current
    start.current = null
    setDragging(false)
    if (!s) return
    const t = e.changedTouches[0]
    if (!t) { setTranslateY(0); return }
    const dy = t.clientY - s.y
    const dt = Date.now() - s.t
    // Either a long drag past threshold OR a fast flick past half-threshold
    const fastFlick = dy > threshold / 2 && dt < 300
    if (dy > threshold || fastFlick) {
      onDismiss()
    }
    setTranslateY(0)
  }

  return {
    bind: { onTouchStart, onTouchMove, onTouchEnd },
    translateY,
    dragging,
  }
}
