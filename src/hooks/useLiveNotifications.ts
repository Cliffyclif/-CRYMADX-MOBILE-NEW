import { useEffect, useRef } from 'react'
import { api, getToken } from '../api/client'
import { useAuth } from '../stores/auth'
import { useNotifications, type Notif } from '../stores/notifications'

interface ServerNotif {
  _id?: string
  id?: string
  type: string
  title?: string
  body?: string
  subject?: string
  message?: string
  icon?: string
  createdAt?: string
  sentAt?: string
  read?: boolean
  href?: string
  data?: Record<string, unknown>
}

function normalize(r: ServerNotif): Notif {
  const id = r.id ?? r._id ?? cryptoRandomId()
  const type = r.type ?? 'notification'
  // `??` only catches null/undefined, not empty strings — use a truthy
  // helper so we fall through to template/humanType when the backend
  // stored an empty subject (which is the default for many notification
  // rows on the server side).
  const firstNonEmpty = (...vals: (string | undefined | null)[]): string => {
    for (const v of vals) if (typeof v === 'string' && v.trim().length > 0) return v
    return ''
  }
  return {
    id,
    type,
    title: firstNonEmpty(r.title, r.subject) || titleForType(type, r.data),
    body:  firstNonEmpty(r.body, r.message, extractBody(r.data)) || bodyForType(type, r.data),
    icon:  r.icon,
    createdAt: r.createdAt ?? r.sentAt ?? new Date().toISOString(),
    read:  r.read,
    href:  r.href ?? (r.data?.href as string | undefined),
    tone:  pickTone(type),
    data:  r.data,
  }
}

/** Human-readable title derived from the notification type + data payload. */
function titleForType(type: string, data: Record<string, unknown> | undefined): string {
  const t = type.toLowerCase()
  const d: any = data ?? {}
  if (/deposit/.test(t))           return 'Deposit received'
  if (/withdraw/.test(t))          return 'Withdrawal processed'
  if (/(swap|convert)/.test(t))    return 'Conversion complete'
  if (/order.*fill|fill/.test(t))  return 'Order filled'
  if (/order.*cancel/.test(t))     return 'Order cancelled'
  if (/order.*partial/.test(t))    return 'Order partially filled'
  if (/limit.*reach/.test(t))      return 'Limit price reached'
  if (/stop/.test(t))              return 'Stop-loss triggered'
  if (/staking/.test(t))           return 'Staking update'
  if (/savings|vault/.test(t))     return 'Savings update'
  if (/reward|bonus/.test(t))      return 'Reward earned'
  if (/referral/.test(t))          return 'Referral activity'
  if (/kyc/.test(t))               return 'KYC update'
  if (/2fa|security|login/.test(t)) return 'Security alert'
  if (/announce|broadcast|news/.test(t)) {
    if (typeof d.title === 'string' && d.title) return d.title
    return 'Announcement'
  }
  if (/promo|marketing/.test(t))   return 'New offer'
  if (/listing/.test(t))           return 'New listing'
  return humanType(type)
}

/** Human-readable body derived from the notification type + data payload. */
function bodyForType(type: string, data: Record<string, unknown> | undefined): string {
  const t = type.toLowerCase()
  const d: any = data ?? {}
  const fmtAmount = (a: any, asset?: any): string => {
    const n = parseFloat(String(a ?? ''))
    if (!isFinite(n)) return ''
    return `${n} ${asset ?? ''}`.trim()
  }
  if (/deposit/.test(t) && d.amount) {
    return `Your ${fmtAmount(d.amount, d.asset ?? d.currency)} deposit has been credited.`
  }
  if (/withdraw/.test(t) && d.amount) {
    return `${fmtAmount(d.amount, d.asset ?? d.currency)} sent${d.toAddress ? ` to ${shorten(String(d.toAddress))}` : ''}.`
  }
  if (/(swap|convert)/.test(t) && d.fromAsset && d.toAsset) {
    return `Converted ${fmtAmount(d.fromAmount ?? d.amount, d.fromAsset)} → ${fmtAmount(d.toAmount, d.toAsset)}.`
  }
  if (/order.*fill/.test(t) && d.pair) {
    return `${String(d.side ?? '').toUpperCase()} ${fmtAmount(d.amount, String(d.pair).split('/')[0] ?? '')} @ ${d.price ?? ''}`
  }
  if (/limit.*reach/.test(t) && d.pair) {
    return `${d.pair} hit ${d.targetPrice ?? d.price ?? ''}`
  }
  if (/reward|bonus/.test(t)) {
    if (d.xp) return `You earned ${d.xp} XP.`
    if (d.amount) return `You earned ${fmtAmount(d.amount, d.asset)}.`
  }
  if (/referral/.test(t) && (d.referredEmail || d.invitedHandle)) {
    return `${d.referredEmail ?? d.invitedHandle} just signed up using your code.`
  }
  if (/kyc/.test(t) && d.status) {
    return `Your KYC status is now ${String(d.status).replace(/_/g, ' ')}.`
  }
  if (/(2fa|security|login)/.test(t) && d.location) {
    return `New sign-in from ${d.location}${d.ip ? ` (${d.ip})` : ''}.`
  }
  if (/announce|broadcast/.test(t)) {
    if (typeof d.body === 'string' && d.body) return d.body
    if (typeof d.message === 'string' && d.message) return d.message
  }
  // Generic fallback — flatten short string fields in `data` into a sentence.
  const parts: string[] = []
  for (const v of Object.values(d)) {
    if (typeof v === 'string' && v.length > 0 && v.length < 80) parts.push(v)
    if (parts.length >= 2) break
  }
  if (parts.length) return parts.join(' · ')
  return ''
}

function humanType(type: string): string {
  return (type ?? '').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function extractBody(data: Record<string, unknown> | undefined): string {
  if (!data) return ''
  if (typeof data.body === 'string' && data.body) return data.body
  if (typeof data.message === 'string' && data.message) return data.message
  return ''
}
function shorten(addr: string): string {
  if (!addr || addr.length < 14) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
function pickTone(type: string): Notif['tone'] {
  if (/security|alert|fail|error|warning/i.test(type)) return 'r'
  if (/promo|reward|bonus|gift/i.test(type)) return 'gd'
  if (/deposit|completed|success|verified/i.test(type)) return 'g'
  return 'info'
}
function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 12)
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')

/**
 * Real-time notifications. Strategy:
 *
 *   1. On sign-in, fetch /api/notifications once to hydrate the store.
 *   2. Open an EventSource to /api/notifications/stream for sub-second push.
 *   3. If the SSE channel errors or isn't supported (404, 502), gracefully
 *      fall back to 25-second polling so users always get *some* delivery.
 *
 * Server is expected to emit `data: {...notif json...}\n\n` for each new
 * notification, plus an optional `event: ping\n\n` heartbeat. Once the
 * notification-service ships an SSE endpoint this hook starts using it
 * automatically — no caller change needed.
 */
export function useLiveNotifications() {
  const userId = useAuth(s => s.user?.id)
  const ingest = useNotifications(s => s.ingest)
  const hydrate = useNotifications(s => s.hydrate)
  const reset = useNotifications(s => s.reset)
  const sseRef = useRef<EventSource | null>(null)
  const pollTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!userId) {
      reset()
      return
    }

    let cancelled = false

    let hydrateOk = false

    // Initial hydrate from REST
    const hydrateOnce = async () => {
      try {
        const res = await api<{ items?: ServerNotif[] }>('api.notifications.list', {
          query: { limit: 30 },
        })
        if (!cancelled) hydrate((res.items ?? []).map(normalize))
        hydrateOk = true
      } catch {
        // notification-service likely down — SSE/polling will keep retrying with backoff
      }
    }

    // Polling fallback — runs only if SSE fails. Uses exponential backoff
    // when the service is down (504s) so we don't hammer a broken endpoint.
    const startPolling = () => {
      let consecutiveFailures = 0
      const BASE = 25_000          // 25s normal
      const MAX = 5 * 60_000        // 5min cap when service is down
      const tick = async () => {
        if (cancelled) return
        if (typeof document !== 'undefined' && document.hidden) {
          schedule()
          return
        }
        try {
          const res = await api<{ items?: ServerNotif[] }>('api.notifications.list', {
            query: { limit: 30 },
          })
          if (!cancelled) ingest((res.items ?? []).map(normalize))
          consecutiveFailures = 0
        } catch {
          consecutiveFailures = Math.min(consecutiveFailures + 1, 6)
        }
        schedule()
      }
      const schedule = () => {
        if (cancelled) return
        const delay = consecutiveFailures === 0 ? BASE : Math.min(BASE * Math.pow(2, consecutiveFailures - 1), MAX)
        pollTimerRef.current = window.setTimeout(tick, delay)
      }
      schedule()
    }

    // SSE — primary delivery channel
    const startSSE = () => {
      const token = getToken()
      if (!token) {
        startPolling()
        return
      }
      // EventSource doesn't support custom headers — pass JWT as a query param.
      // Backend reads ?token=... when the Authorization header is missing.
      const url = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`
      let es: EventSource
      try {
        es = new EventSource(url)
      } catch {
        startPolling()
        return
      }
      sseRef.current = es

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as ServerNotif | { items?: ServerNotif[] }
          if ('items' in data && Array.isArray(data.items)) {
            ingest(data.items.map(normalize))
          } else {
            ingest([normalize(data as ServerNotif)])
          }
        } catch {
          /* ignore malformed events */
        }
      }
      // Consider any error a graceful fallback to polling. Don't keep retrying SSE
      // if the endpoint isn't there yet.
      es.onerror = () => {
        es.close()
        sseRef.current = null
        if (!cancelled) startPolling()
      }
    }

    hydrateOnce().then(() => {
      if (cancelled) return
      // If hydrate failed, the service is likely down — go straight to backoff
      // polling instead of opening an SSE that will only error and retry.
      if (hydrateOk) startSSE()
      else startPolling()
    })

    return () => {
      cancelled = true
      sseRef.current?.close()
      sseRef.current = null
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [userId, ingest, hydrate, reset])
}
