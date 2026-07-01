/**
 * Education (Academy) service — mobile.
 *
 * Talks directly to education-service via the gateway at /api/education/*,
 * mirroring the web learner service. Uses the shared auth token from the api
 * client (same escape-hatch pattern as kycService + the AI chat SSE fetch).
 *
 * Video is delivered as self-hosted AES-128 encrypted HLS: /play returns a
 * per-play playlist with signed R2 segment URLs + a key URI carrying a short
 * token; the AES key only comes from our gated /hls/key endpoint.
 */
import { getToken } from '../api/client'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')

export type CourseMode = 'free' | 'included' | 'paid_extra'

export interface EduLessonView {
  id: string
  lesson_number: string
  title: string
  order: number
  type: 'video' | 'pdf' | 'text'
  duration: number
  is_preview: boolean
  description?: string
  key_points?: string[]
  text_content?: string
  has_media: boolean
  locked: boolean
  media_url: string | null
  thumbnail_url: string | null
}

export interface EduModuleView {
  id: string
  title: string
  order: number
  lessons: EduLessonView[]
}

export interface EduCourseCard {
  id: string
  title: string
  slug: string
  description: string
  category?: { id: string; name: string; slug: string } | null
  thumbnail?: string | null
  level: string
  monetization: { mode: CourseMode; price_usd: number }
  is_featured: boolean
  tags: string[]
  total_lessons: number
  total_duration: number
  enrolled_count: number
  is_enrolled?: boolean
  progress_percent?: number
}

export interface EduCourseDetail extends EduCourseCard {
  modules: EduModuleView[]
  entitled: boolean
  is_favourite?: boolean
  is_bookmarked?: boolean
}

export interface EduQuote {
  kind: 'course' | 'lms_access'
  amount_usd: number
  fee_usd: number
  asset: string
  asset_amount: number
  price_per_unit_usd: number
}

export interface EduTrackView {
  id: string
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  icon?: string
  is_featured: boolean
  course_count: number
  progress_percent?: number
  courses: EduCourseCard[]
}

export interface EduCertificateView {
  cert_id: string
  course_title: string
  course_slug: string
  thumbnail?: string | null
  user_name: string
  issued_at: string
}

export interface EduDashboard {
  stats: { enrolled: number; completed: number; time_spent_seconds: number; lms_access: boolean; quizzes?: number; ai_sessions?: number }
  continue_learning: EduCourseCard[]
  featured: EduCourseCard[]
  streak?: { current: number; longest: number }
  today?: { minutes: number; goal: number }
  week?: { day: string; minutes: number; active: boolean }[]
}

export interface EduPlayResponse {
  url?: string
  type: string
  duration: number
  stream_id?: string
  watermark?: string
  hls?: boolean
  playlist?: string
  text_content?: string
}

async function authed<T>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API_BASE}/education${path}`, { ...init, headers, credentials: 'omit' })
  const ct = res.headers.get('content-type') ?? ''
  let body: any = null
  if (ct.includes('application/json')) { try { body = await res.json() } catch { body = null } }
  else { try { body = await res.text() } catch { body = null } }
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.reason ?? body?.message ?? body?.error ?? res.statusText
    const err = new Error(typeof msg === 'string' ? msg : `Education request failed (${res.status})`)
    ;(err as any).status = res.status
    throw err
  }
  void requireAuth
  return body as T
}

export const educationService = {
  getDashboard: () => authed<EduDashboard>('/dashboard'),
  listCourses: (params?: { q?: string; category?: string; level?: string; featured?: boolean; page?: number }) => {
    const qs = new URLSearchParams()
    if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v))
    const s = qs.toString()
    return authed<{ courses: EduCourseCard[]; total: number; pages: number }>(`/courses${s ? `?${s}` : ''}`)
  },
  getCourse: (slug: string) => authed<{ course: EduCourseDetail }>(`/courses/${slug}`),
  getCategories: () => authed<{ categories: { id: string; name: string; slug: string; icon?: string }[] }>('/courses/meta/categories'),
  getTracks: () => authed<{ tracks: EduTrackView[] }>('/tracks'),
  getTrack: (slug: string) => authed<{ track: EduTrackView }>(`/tracks/${slug}`),
  getCertificates: () => authed<{ certificates: EduCertificateView[] }>('/certificates'),
  getMyCourses: () => authed<{ courses: (EduCourseCard & { source?: string; enrolled_at?: string })[] }>('/enrollments/me'),
  enroll: (courseId: string) => authed<{ enrolled: boolean }>(`/enrollments/${courseId}/enroll`, { method: 'POST', body: '{}' }),
  toggleFavourite: (courseId: string, is_favourite: boolean) =>
    authed(`/enrollments/${courseId}`, { method: 'PATCH', body: JSON.stringify({ is_favourite }) }),
  getProgress: (courseId: string) =>
    authed<{ progress: { completed_lesson_ids: string[]; current_lesson: string | null; percent_complete: number; notes?: Record<string, string> } }>(`/progress/${courseId}`),
  saveNote: (courseId: string, lessonId: string, note: string) =>
    authed<{ saved: boolean }>(`/progress/${courseId}/notes/${lessonId}`, { method: 'PUT', body: JSON.stringify({ note }) }),
  play: (courseId: string, lessonId: string) =>
    authed<EduPlayResponse>(`/progress/${courseId}/play/${lessonId}`),
  playPing: (streamId: string) =>
    authed<{ active: boolean }>('/progress/play/ping', { method: 'POST', body: JSON.stringify({ stream_id: streamId }) }),
  complete: (courseId: string, lessonId: string, timeSpent?: number) =>
    authed<{ progress: { completed_lesson_ids: string[]; current_lesson: string | null; percent_complete: number }; certificate?: { cert_id: string; course_title: string } | null }>(
      `/progress/${courseId}/complete/${lessonId}`, { method: 'POST', body: JSON.stringify({ time_spent_seconds: timeSpent || 0 }) }),
  quote: (body: { kind: 'course' | 'lms_access'; courseId?: string; asset: string }) =>
    authed<{ quote: EduQuote }>('/payments/quote', { method: 'POST', body: JSON.stringify(body) }),
  pay: (body: { kind: 'course' | 'lms_access'; courseId?: string; asset: string; chain: string }) =>
    authed<{ success: boolean; payment: any }>('/payments/pay', { method: 'POST', body: JSON.stringify(body) }),
  paymentHistory: () => authed<{ payments: any[] }>('/payments/history'),
}

export default educationService
