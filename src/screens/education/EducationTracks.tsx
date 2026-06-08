/**
 * Academy Tracks — curated learning paths (ordered sequences of courses).
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { routeFor } from '../../routes'
import { educationService } from '../../services/educationService'
import { CardSkeletons, EduTabs, EmptyState, PricePill, fmtHours } from './_shared'

export function EducationTracks() {
  const nav = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['edu', 'tracks', 'full'], queryFn: () => educationService.getTracks() })
  const tracks = data?.tracks ?? []

  return (
    <PhoneShell noTabs>
      <EduTabs />
      {isLoading ? <CardSkeletons n={3} />
        : tracks.length === 0 ? <EmptyState icon="layers" title="No tracks yet" sub="Guided learning paths are coming soon." />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tracks.map(t => {
              const pct = t.progress_percent ?? 0
              return (
                <div key={t.id} style={{ borderRadius: 16, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(212,165,60,.12), rgba(212,165,60,.03))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,165,60,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="layers" size={20} color="var(--gd)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>{t.title}</div>
                        <div className="t3" style={{ fontSize: 12 }}>{t.course_count} course{t.course_count === 1 ? '' : 's'}{pct > 0 ? ` · ${pct}% done` : ''}</div>
                      </div>
                    </div>
                    {t.description && <div className="t3" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{t.description}</div>}
                    {pct > 0 && (
                      <div style={{ height: 5, borderRadius: 999, background: 'rgba(0,0,0,.3)', marginTop: 12 }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'var(--gd)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {t.courses.map((c, i) => (
                      <button key={c.id} onClick={() => nav(routeFor('route.education.course', { slug: c.slug }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit', textAlign: 'left' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-mid-60)' }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                          <div className="t3" style={{ fontSize: 11 }}>{c.total_lessons} lessons · {fmtHours(c.total_duration)}</div>
                        </div>
                        <PricePill mode={c.monetization} />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      <div style={{ height: 24 }} />
    </PhoneShell>
  )
}
