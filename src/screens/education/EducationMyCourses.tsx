/**
 * Academy My Courses — everything the learner is enrolled in, with progress.
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ROUTES } from '../../routes'
import { educationService } from '../../services/educationService'
import { CardSkeletons, CourseCard, EduTabs, EmptyState } from './_shared'

export function EducationMyCourses() {
  const nav = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['edu', 'my-courses'], queryFn: () => educationService.getMyCourses() })
  const courses = data?.courses ?? []
  const inProgress = courses.filter(c => (c.progress_percent ?? 0) > 0 && (c.progress_percent ?? 0) < 100)
  const done = courses.filter(c => (c.progress_percent ?? 0) >= 100)
  const fresh = courses.filter(c => (c.progress_percent ?? 0) === 0)

  return (
    <PhoneShell noTabs>
      <EduTabs />
      {isLoading ? <CardSkeletons n={3} />
        : courses.length === 0 ? (
          <EmptyState
            icon="play"
            title="No courses yet"
            sub="Browse the Academy and enrol — your courses will show up here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inProgress.length > 0 && <Group title="In progress" courses={inProgress} />}
            {fresh.length > 0 && <Group title="Not started" courses={fresh} />}
            {done.length > 0 && <Group title="Completed" courses={done} />}
          </div>
        )}
      {courses.length === 0 && !isLoading && (
        <button onClick={() => nav(ROUTES['route.education.explore'].path)} style={{ marginTop: 8, width: '100%', height: 48, borderRadius: 14, border: 'none', background: 'var(--gl)', color: '#04130b', fontFamily: 'Outfit', fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>
          Explore courses
        </button>
      )}
      <div style={{ height: 24 }} />
    </PhoneShell>
  )
}

function Group({ title, courses }: { title: string; courses: any[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-mid-50)', margin: '14px 0 10px' }}>{title} · {courses.length}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {courses.map(c => <CourseCard key={c.id} course={c} />)}
      </div>
    </div>
  )
}
