/**
 * NotificationToast — renders a stack of incoming notifications as cards that
 * slide in from the top of the viewport. Each card auto-dismisses after 5s
 * (or stays until tapped/swiped away). Tap → navigates to the notification's
 * href if present, then marks it dismissed.
 *
 * Mounted once at the App root; reads from useNotifications().toastQueue.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, type Notif } from '../stores/notifications'
import { Icon, type IconName } from './Icon'

const AUTO_DISMISS_MS = 5500

export function NotificationToast() {
  const queue = useNotifications(s => s.toastQueue)
  const dismiss = useNotifications(s => s.dismissToast)

  if (queue.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: 12,
        right: 12,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {queue.map((n, idx) => (
        <ToastCard key={n.id} notif={n} stackIndex={idx} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  )
}

function ToastCard({
  notif,
  stackIndex,
  onDismiss,
}: {
  notif: Notif
  stackIndex: number
  onDismiss: () => void
}) {
  const nav = useNavigate()

  // Auto-dismiss timer — staggered so multi-stack toasts don't all vanish at once.
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS + stackIndex * 600)
    return () => clearTimeout(t)
  }, [onDismiss, stackIndex])

  const tone = notif.tone ?? 'info'
  const tint = tone === 'g' ? '0,200,83'
    : tone === 'r' ? '239,68,68'
    : tone === 'gd' ? '212,165,60'
    : '255,255,255'
  const accent = tone === 'g' ? 'var(--gl)'
    : tone === 'r' ? 'var(--r)'
    : tone === 'gd' ? 'var(--gd)'
    : 'var(--gl)'
  const icon = pickIcon(notif)

  const onTap = () => {
    if (notif.href) nav(notif.href)
    onDismiss()
  }

  return (
    <button
      onClick={onTap}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 14px',
        background: 'rgba(8, 18, 12, 0.92)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderRadius: 16,
        border: `1px solid rgba(${tint}, 0.18)`,
        boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px rgba(${tint}, 0.06) inset`,
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        animation: 'toast-slide-in 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <div
        style={{
          width: 40, height: 40, flexShrink: 0,
          borderRadius: 12,
          background: `rgba(${tint}, 0.16)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong, #fff)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notif.title}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>now</div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notif.body}
        </div>
      </div>
    </button>
  )
}

function pickIcon(n: Notif): IconName {
  if (n.icon) return n.icon as IconName
  const t = n.type
  if (/deposit|wallet|balance/i.test(t)) return 'wallet'
  if (/withdraw|send/i.test(t)) return 'send'
  if (/security|2fa|password|login/i.test(t)) return 'shield'
  if (/promo|reward|bonus|gift/i.test(t)) return 'star'
  if (/announce|broadcast|news/i.test(t)) return 'bell'
  if (/alert|warning|fail/i.test(t)) return 'info'
  return 'bell'
}
