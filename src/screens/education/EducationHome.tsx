/**
 * Academy Home — greeting hero, continue-learning, featured courses, tracks
 * teaser. Entry point for the learner experience on mobile.
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'
import { educationService } from '../../services/educationService'
import { CardSkeletons, CourseCard, EduTabs, EmptyState, SectionTitle, fmtHours } from './_shared'

export function EducationHome() {
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['edu', 'dashboard'], queryFn: () => educationService.getDashboard() })
  const { data: trk } = useQuery({ queryKey: ['edu', 'tracks'], queryFn: () => educationService.getTracks() })

  const first = user?.firstName || (user?.email || '').split('@')[0] || 'there'
  const cont = data?.continue_learning ?? []
  const feat = data?.featured ?? []
  const tracks = (trk?.tracks ?? []).slice(0, 4)
  const stats = data?.stats
  const streak = data?.streak?.current ?? 0

  return (
    <PhoneShell noTabs>
      <EduTabs />

      {/* Hero */}
      <div
        className="g"
        style={{
          position: 'relative', overflow: 'hidden', padding: 20, borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(0,200,83,.12) 0%, rgba(0,200,83,.03) 55%, rgba(212,165,60,.06) 100%)',
          border: '1px solid rgba(0,200,83,.18)',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,83,.16) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="cap" size={18} color="var(--gl)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gl)' }}>CrymadX Academy</span>
        </div>
        <div style={{ fontSize: 23, fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.15 }}>Welcome back, {first}</div>
        <div className="t3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          {cont.length > 0 ? 'Pick up where you left off, or explore something new.' : 'Start learning crypto, trading and Web3 — at your pace.'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => nav(ROUTES['route.education.explore'].path)} style={ctaPrimary}>
            <Icon name="compass" size={15} color="#04130b" /> Explore courses
          </button>
          {cont[0] && (
            <button onClick={() => nav(`/learn/course/${cont[0].slug}`)} style={ctaGhost}>Continue</button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
          <Stat label="Enrolled" value={String(stats.enrolled)} icon="play" />
          <Stat label="Completed" value={String(stats.completed)} icon="check" />
          <Stat label={streak > 0 ? 'Day streak' : 'Learned'} value={streak > 0 ? String(streak) : fmtHours(stats.time_spent_seconds)} icon="zap" />
        </div>
      )}

      {/* Continue learning */}
      {cont.length > 0 && (
        <>
          <SectionTitle>Continue learning</SectionTitle>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, margin: '0 -16px', padding: '0 16px 6px' }}>
            {cont.map(c => <CourseCard key={c.id} course={c} compact />)}
          </div>
        </>
      )}

      {/* Featured */}
      <SectionTitle action={<button onClick={() => nav(ROUTES['route.education.explore'].path)} style={linkBtn}>See all</button>}>
        Featured
      </SectionTitle>
      {isLoading ? <CardSkeletons n={2} />
        : feat.length === 0 ? <EmptyState title="No courses yet" sub="New courses are on the way — check back soon." />
        : <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, margin: '0 -16px', padding: '0 16px 6px' }}>
            {feat.map(c => <CourseCard key={c.id} course={c} compact />)}
          </div>}

      {/* Tracks teaser */}
      {tracks.length > 0 && (
        <>
          <SectionTitle action={<button onClick={() => nav(ROUTES['route.education.tracks'].path)} style={linkBtn}>All tracks</button>}>
            Learning tracks
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tracks.map(t => (
              <button key={t.id} onClick={() => nav(ROUTES['route.education.tracks'].path)} style={trackRow}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(212,165,60,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="layers" size={19} color="var(--gd)" />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-strong)' }}>{t.title}</div>
                  <div className="t3" style={{ fontSize: 12 }}>{t.course_count} course{t.course_count === 1 ? '' : 's'}</div>
                </div>
                <Icon name="arrow" size={14} color="var(--text-mid-60)" />
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ height: 24 }} />
    </PhoneShell>
  )
}

const ctaPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, border: 'none', background: 'var(--gl)', color: '#04130b', fontFamily: 'Outfit', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }
const ctaGhost: React.CSSProperties = { padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--gl)', fontFamily: 'Outfit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }
const trackRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'Outfit' }

function Stat({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
      <Icon name={icon} size={16} color="var(--gl)" />
      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-strong)', marginTop: 4 }}>{value}</div>
      <div className="t3" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
    </div>
  )
}
