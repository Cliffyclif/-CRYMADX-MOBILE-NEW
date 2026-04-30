import { type ReactNode } from 'react'
import { useNavigationType } from 'react-router-dom'
import { useSwipeBack } from '../hooks/useSwipeBack'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { PullIndicator } from './PullIndicator'

interface Props {
  children: ReactNode
  bottomNav?: ReactNode
  /** When true, hides bottom nav padding (e.g., auth flows) */
  noTabs?: boolean
  /** When true, applies space-between distribution so the last child (typically a CTA)
   *  hugs the bottom of the viewport — useful for short screens that would otherwise
   *  bunch content at the top. */
  balanced?: boolean
  /** Optional decorative background variant rendered behind the screen content.
   *  - `aurora` — soft drifting orbs in brand colors + faint grid + vignette.
   *    Used on auth flow screens where the default flat black feels lifeless. */
  bgVariant?: 'aurora'
  /** Disable the global swipe-from-left-edge back gesture for this screen.
   *  Useful when the screen has its own conflicting horizontal gesture
   *  (e.g. a card swiper). Default: enabled on every screen that isn't a tab root. */
  disableSwipeBack?: boolean
  /** Optional pull-to-refresh handler. When provided, the screen scroll container
   *  responds to a downward pull at the top — the user gets a spinner indicator
   *  and the handler runs once they release past the threshold. */
  onRefresh?: () => void | Promise<void>
}

export function PhoneShell({ children, bottomNav, noTabs, balanced, bgVariant, disableSwipeBack, onRefresh }: Props) {
  const isTabRoot = !!bottomNav
  const swipeBackEnabled = !isTabRoot && !disableSwipeBack
  useSwipeBack({ enabled: swipeBackEnabled })

  // Pull-to-refresh — only active when the caller passes onRefresh
  const ptr = usePullToRefresh({
    onRefresh: onRefresh ?? (() => {}),
    enabled: !!onRefresh,
  })

  // Page transition direction. PUSH = forward, POP = back, REPLACE = silent.
  // Translates to a data-attribute the CSS uses to pick a slide direction.
  const navType = useNavigationType()
  const navDirection = navType === 'POP' ? 'pop' : navType === 'PUSH' ? 'push' : undefined

  return (
    <div className="app-root">
      <div className="app-shell" data-nav={navDirection}>
        {swipeBackEnabled && <div className="swipe-hint" aria-hidden="true" />}
        {bgVariant === 'aurora' ? (
          <div className="aurora-bg" aria-hidden="true">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            <div className="grid" />
            <div className="vignette" />
          </div>
        ) : (
          <>
            <div className="blob-1" />
            <div className="blob-2" />
          </>
        )}
        <div
          className={`screen ${noTabs || !bottomNav ? 'no-tabs' : ''} ${balanced ? 'balanced' : ''}`}
          ref={onRefresh ? ptr.bind.ref : undefined}
        >
          {onRefresh && <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />}
          {children}
        </div>
        {bottomNav}
      </div>
    </div>
  )
}
