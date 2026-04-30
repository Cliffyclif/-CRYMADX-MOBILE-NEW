import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Called once when the user has pulled past the threshold and released. */
  onRefresh: () => Promise<void> | void
  /** Pixels of vertical drag required to trigger refresh. Default 70. */
  threshold?: number
  /** Pixels at which the indicator visually peaks (matches how far you can pull). */
  maxPull?: number
  /** Disable the gesture entirely (e.g. while a modal is open). */
  enabled?: boolean
}

/**
 * Pull-to-refresh for any scrollable container. Returns:
 *   - `bind`: spread these props onto the scrollable element
 *   - `pull`: current pull distance in px (use to translate an indicator)
 *   - `refreshing`: true while onRefresh promise is pending
 *
 * Usage:
 *   const ptr = usePullToRefresh({ onRefresh: refetch })
 *   <div className="screen" {...ptr.bind}>
 *     <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />
 *     ...
 *   </div>
 *
 * Detection rules:
 *   - Gesture only starts when the container is scrolled to top (scrollTop === 0)
 *   - Cancels if the user moves horizontally more than vertically
 *   - Releases without triggering if pull < threshold (springs back)
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 110,
  enabled = true,
}: Options) {
  const ref = useRef<HTMLDivElement | null>(null)
  const start = useRef<{ y: number; x: number } | null>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return
      // Only start when scrolled fully to top — otherwise the user is mid-scroll
      if (el.scrollTop > 0) return
      const t = e.touches[0]
      if (!t) return
      start.current = { y: t.clientY, x: t.clientX }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!start.current) return
      const t = e.touches[0]
      if (!t) return
      const dy = t.clientY - start.current.y
      const dx = Math.abs(t.clientX - start.current.x)
      // Cancel if the user is swiping sideways (probably the swipe-back gesture)
      if (dx > Math.abs(dy)) {
        start.current = null
        setPull(0)
        return
      }
      // Only respond to downward pulls
      if (dy <= 0) {
        setPull(0)
        return
      }
      // Apply rubber-band easing: feels resistance the further you pull
      const eased = Math.min(maxPull, dy * 0.5)
      setPull(eased)
    }
    const onTouchEnd = async () => {
      if (!start.current) return
      const finalPull = pull
      start.current = null
      if (finalPull >= threshold) {
        setRefreshing(true)
        setPull(threshold) // Hold the indicator at threshold while refreshing
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPull(0)
        }
      } else {
        setPull(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, refreshing, threshold, maxPull, onRefresh, pull])

  return {
    bind: { ref },
    pull,
    refreshing,
  }
}
