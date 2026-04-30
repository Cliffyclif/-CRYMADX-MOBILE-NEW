/**
 * Visual indicator for pull-to-refresh. Renders a small spinner that fades in
 * as the user pulls down, rotates with their finger movement, and spins while
 * refreshing.
 *
 * Sits absolutely positioned at the top of the parent container — caller must
 * ensure the parent has `position: relative`.
 */
import { Icon } from './Icon'

interface Props {
  /** Current pull distance in px (from usePullToRefresh) */
  pull: number
  /** True while the onRefresh promise is pending */
  refreshing: boolean
  /** Match the threshold passed to usePullToRefresh — used to compute progress */
  threshold?: number
}

export function PullIndicator({ pull, refreshing, threshold = 70 }: Props) {
  const visible = pull > 4 || refreshing
  const progress = Math.min(1, pull / threshold)
  const rotate = refreshing ? 'spin 1s linear infinite' : `none`

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transform: `translateY(${pull - 60}px)`,
        transition: refreshing ? 'transform 0.2s ease-out, opacity 0.2s' : pull === 0 ? 'transform 0.3s ease-out, opacity 0.2s' : 'none',
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'rgba(27, 140, 62, 0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 200, 83, 0.18)',
          transform: refreshing ? 'none' : `rotate(${progress * 360}deg)`,
          animation: rotate,
        }}
      >
        <Icon
          name="refresh"
          size={18}
          color={progress >= 1 || refreshing ? 'var(--gl)' : 'var(--text-mid-50)'}
        />
      </div>
    </div>
  )
}
