/**
 * Shared Academy bits — formatters, course card, sub-nav, price pill.
 * Uses the Bold Waves CSS-var theme (var(--gl) accent, .g glass, .t2/.t3 text).
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, routeFor, type RouteId } from '../../routes'
import type { EduCourseCard, CourseMode } from '../../services/educationService'

export const fmtDur = (s: number) => {
  const m = Math.round((s || 0) / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}
export const fmtHours = (s: number) => {
  const h = (s || 0) / 3600
  return h >= 1 ? `${h.toFixed(h >= 10 ? 0 : 1)}h` : `${Math.round((s || 0) / 60)}m`
}

export function priceLabel(m: { mode: CourseMode; price_usd: number }): { text: string; tone: 'free' | 'incl' | 'paid' } {
  if (m.mode === 'free') return { text: 'Free', tone: 'free' }
  if (m.mode === 'included') return { text: 'Included', tone: 'incl' }
  return { text: `$${(m.price_usd || 0).toFixed(2)}`, tone: 'paid' }
}

export function PricePill({ mode }: { mode: { mode: CourseMode; price_usd: number } }) {
  const p = priceLabel(mode)
  const bg = p.tone === 'free' ? 'rgba(0,200,83,.16)' : p.tone === 'incl' ? 'rgba(212,165,60,.16)' : 'rgba(255,255,255,.08)'
  const col = p.tone === 'free' ? 'var(--gl)' : p.tone === 'incl' ? 'var(--gd)' : 'var(--text-strong)'
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: bg, color: col, letterSpacing: '.4px' }}>
      {p.text}
    </span>
  )
}

/** Horizontal Academy sub-nav shown at the top of each section. */
export function EduTabs() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const tabs: { id: RouteId; label: string; icon: IconName }[] = [
    { id: 'route.education.home', label: 'Home', icon: 'home' },
    { id: 'route.education.explore', label: 'Explore', icon: 'compass' },
    { id: 'route.education.my-courses', label: 'My Courses', icon: 'play' },
    { id: 'route.education.tracks', label: 'Tracks', icon: 'layers' },
    { id: 'route.education.certificates', label: 'Certs', icon: 'trophy' },
  ]
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 8, paddingBottom: 6, marginBottom: 14 }}>
      {tabs.map(t => {
        const active = pathname === ROUTES[t.id].path
        return (
          <button
            key={t.id}
            onClick={() => nav(ROUTES[t.id].path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '7px 13px', borderRadius: 999, fontFamily: 'Outfit', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              background: active ? 'rgba(0,200,83,.14)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${active ? 'rgba(0,200,83,.32)' : 'rgba(255,255,255,.06)'}`,
              color: active ? 'var(--gl)' : 'var(--text-mid-60)',
            }}
          >
            <Icon name={t.icon} size={14} color={active ? 'var(--gl)' : 'var(--text-mid-60)'} />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Course card — thumbnail, title, meta, price/progress. */
export function CourseCard({ course, compact }: { course: EduCourseCard; compact?: boolean }) {
  const nav = useNavigate()
  const pct = course.progress_percent ?? 0
  return (
    <button
      onClick={() => nav(routeFor('route.education.course', { slug: course.slug }))}
      style={{
        width: compact ? 220 : '100%', flexShrink: 0, textAlign: 'left', fontFamily: 'Outfit', cursor: 'pointer',
        background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'linear-gradient(135deg, rgba(0,200,83,.12), rgba(212,165,60,.06))' }}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="cap" size={28} color="var(--gl)" /></div>}
        <div style={{ position: 'absolute', top: 8, right: 8 }}><PricePill mode={course.monetization} /></div>
        {pct > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(0,0,0,.4)' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gl)' }} />
          </div>
        )}
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {course.category?.name && (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gl)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{course.category.name}</span>
        )}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.title}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-mid-50)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="play" size={11} color="var(--text-mid-50)" />{course.total_lessons}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} color="var(--text-mid-50)" />{fmtHours(course.total_duration)}</span>
          {pct > 0 && <span style={{ marginLeft: 'auto', color: 'var(--gl)', fontWeight: 700 }}>{pct}%</span>}
        </div>
      </div>
    </button>
  )
}

/** Loading skeleton row of cards. */
export function CardSkeletons({ n = 3 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="g" style={{ height: 96, borderRadius: 14, opacity: 0.5 }} />
      ))}
    </div>
  )
}

export function EmptyState({ icon = 'cap', title, sub }: { icon?: IconName; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-mid-60)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,200,83,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Icon name={icon} size={24} color="var(--gl)" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{title}</div>
      {sub && <div className="t3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, marginTop: 22 }}>
      <div style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-mid-50)', flex: 1 }}>{children}</div>
      {action}
    </div>
  )
}
