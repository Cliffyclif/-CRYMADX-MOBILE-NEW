/**
 * Academy Explore — search + category filter + full course grid.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { educationService } from '../../services/educationService'
import { CardSkeletons, CourseCard, EduTabs, EmptyState } from './_shared'

export function EducationExplore() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('')

  const { data: catRes } = useQuery({ queryKey: ['edu', 'categories'], queryFn: () => educationService.getCategories() })
  const { data, isLoading } = useQuery({
    queryKey: ['edu', 'courses', q, cat],
    queryFn: () => educationService.listCourses({ q: q || undefined, category: cat || undefined }),
  })

  const categories = catRes?.categories ?? []
  const courses = data?.courses ?? []
  const chips = useMemo(() => [{ id: '', name: 'All' }, ...categories.map(c => ({ id: c.slug, name: c.name }))], [categories])

  return (
    <PhoneShell noTabs>
      <EduTabs />

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
        <Icon name="search" size={16} color="var(--text-mid-50)" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search courses…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 14 }}
        />
        {q && <button onClick={() => setQ('')} aria-label="Clear" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} color="var(--text-mid-50)" /></button>}
      </div>

      {/* Category chips */}
      <div className="hscroll" style={{ display: 'flex', gap: 8, padding: '12px 0 4px' }}>
        {chips.map(c => {
          const active = cat === c.id
          return (
            <button
              key={c.id || 'all'}
              onClick={() => setCat(c.id)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontFamily: 'Outfit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: active ? 'rgba(0,200,83,.14)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${active ? 'rgba(0,200,83,.32)' : 'rgba(255,255,255,.06)'}`,
                color: active ? 'var(--gl)' : 'var(--text-mid-60)',
              }}
            >
              {c.name}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        {isLoading ? <CardSkeletons n={4} />
          : courses.length === 0 ? <EmptyState icon="search" title="Nothing found" sub={q ? `No courses match “${q}”.` : 'No courses in this category yet.'} />
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {courses.map(c => <CourseCard key={c.id} course={c} />)}
            </div>}
      </div>
      <div style={{ height: 24 }} />
    </PhoneShell>
  )
}
