/**
 * Academy Credentials — certificates earned by completing courses.
 */
import { useQuery } from '@tanstack/react-query'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { educationService } from '../../services/educationService'
import { CardSkeletons, EduTabs, EmptyState } from './_shared'

export function EducationCertificates() {
  const { data, isLoading } = useQuery({ queryKey: ['edu', 'certificates'], queryFn: () => educationService.getCertificates() })
  const certs = data?.certificates ?? []

  return (
    <PhoneShell noTabs>
      <EduTabs />
      {isLoading ? <CardSkeletons n={2} />
        : certs.length === 0 ? (
          <EmptyState icon="trophy" title="No credentials yet" sub="Finish a course that issues a certificate and it’ll appear here, verifiable by ID." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {certs.map(c => (
              <div key={c.cert_id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 18, background: 'linear-gradient(135deg, rgba(0,200,83,.12), rgba(212,165,60,.08))', border: '1px solid rgba(0,200,83,.20)' }}>
                <div aria-hidden style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,60,.18) 0%, transparent 70%)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon name="trophy" size={18} color="var(--gd)" />
                  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gd)' }}>Certificate of completion</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.25 }}>{c.course_title}</div>
                <div className="t3" style={{ fontSize: 12.5, marginTop: 8 }}>Awarded to <strong style={{ color: 'var(--text-strong)' }}>{c.user_name || 'You'}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                  <span className="t3" style={{ fontSize: 11 }}>{new Date(c.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span className="t3" style={{ fontSize: 10.5, fontFamily: 'monospace', opacity: 0.8 }}>ID: {c.cert_id.slice(0, 12)}…</span>
                </div>
              </div>
            ))}
          </div>
        )}
      <div style={{ height: 24 }} />
    </PhoneShell>
  )
}
