/**
 * Academy Course detail — hero, what's-included, curriculum trail with
 * lock/preview/completed states, and the unlock/enrol/continue CTA.
 *
 * Courses are shareable (Share button copies a public link); the videos stay
 * locked until the viewer registers + pays.
 */
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { routeFor } from '../../routes'
import { haptics } from '../../lib/haptics'
import { educationService, type EduLessonView } from '../../services/educationService'
import { PaymentSheet } from './PaymentSheet'
import { PricePill, fmtDur, fmtHours } from './_shared'

export function EducationCourse() {
  const { slug = '' } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const [payOpen, setPayOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [shared, setShared] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['edu', 'course', slug], queryFn: () => educationService.getCourse(slug), enabled: !!slug })
  const course = data?.course
  const { data: prog } = useQuery({ queryKey: ['edu', 'progress', course?.id], queryFn: () => educationService.getProgress(course!.id), enabled: !!course?.id })

  const completed = useMemo(() => new Set(prog?.progress?.completed_lesson_ids ?? []), [prog])
  const flat: EduLessonView[] = useMemo(() => (course ? course.modules.flatMap(m => m.lessons) : []), [course])
  const nextLesson = flat.find(l => !completed.has(l.id)) ?? flat[0]

  const refetch = () => qc.invalidateQueries({ queryKey: ['edu'] })

  if (isLoading || !course) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title="Course" onBack={() => nav(-1)} />
        <div className="g" style={{ height: 180, borderRadius: 16, opacity: 0.5 }} />
        <div className="g" style={{ height: 20, borderRadius: 8, marginTop: 16, width: '70%', opacity: 0.5 }} />
        <div className="g" style={{ height: 90, borderRadius: 12, marginTop: 16, opacity: 0.5 }} />
      </PhoneShell>
    )
  }

  const paid = course.monetization.mode === 'paid_extra'
  const entitled = course.entitled

  const openLesson = (l: EduLessonView) => {
    const locked = l.locked && !l.is_preview
    if (locked) { haptics.error(); if (paid && !entitled) setPayOpen(true); return }
    nav(routeFor('route.education.player', { slug: course.slug, lessonId: l.id }))
  }

  const onEnrol = async () => {
    if (enrolling) return
    setEnrolling(true)
    try {
      haptics.medium()
      await educationService.enroll(course.id)
      refetch()
      if (nextLesson) nav(routeFor('route.education.player', { slug: course.slug, lessonId: nextLesson.id }))
    } catch { haptics.error() } finally { setEnrolling(false) }
  }

  const onShare = async () => {
    const url = `https://crymadx.io/course/${course.slug}`
    try {
      if (navigator.share) { await navigator.share({ title: course.title, text: `Learn “${course.title}” on CrymadX Academy`, url }); return }
    } catch { /* user cancelled or unsupported — fall through to copy */ }
    try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800) } catch { /* ignore */ }
  }

  const ctaText = entitled
    ? (completed.size > 0 ? 'Continue learning' : 'Start course')
    : paid ? `Unlock · $${course.monetization.price_usd.toFixed(2)}` : 'Enrol free'
  const onCta = () => {
    if (entitled) { if (nextLesson) nav(routeFor('route.education.player', { slug: course.slug, lessonId: nextLesson.id })) }
    else if (paid) { haptics.light(); setPayOpen(true) }
    else onEnrol()
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader
        title=""
        onBack={() => nav(-1)}
        actions={
          <button onClick={onShare} aria-label="Share course" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}>
            <Icon name={shared ? 'check' : 'share'} size={16} color={shared ? 'var(--gl)' : 'var(--text-strong)'} />
          </button>
        }
      />

      {/* Hero */}
      <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(0,200,83,.14), rgba(212,165,60,.06))' }}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="cap" size={36} color="var(--gl)" /></div>}
        <div style={{ position: 'absolute', top: 10, right: 10 }}><PricePill mode={course.monetization} /></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {course.category?.name && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gl)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{course.category.name}</span>}
        {course.level && <span style={{ fontSize: 11, color: 'var(--text-mid-50)', textTransform: 'capitalize' }}>· {course.level}</span>}
      </div>
      <h2 style={{ margin: '6px 0 4px', fontSize: 22, lineHeight: 1.2 }}>{course.title}</h2>

      <div style={{ display: 'flex', gap: 16, marginTop: 10, color: 'var(--text-mid-60)', fontSize: 12.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="play" size={13} color="var(--text-mid-60)" />{course.total_lessons} lessons</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={13} color="var(--text-mid-60)" />{fmtHours(course.total_duration)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="users" size={13} color="var(--text-mid-60)" />{course.enrolled_count}</span>
      </div>

      {course.description && <p className="t2" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 14 }}>{course.description}</p>}

      {entitled && completed.size > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span className="t3">Your progress</span>
            <span style={{ color: 'var(--gl)', fontWeight: 700 }}>{prog?.progress?.percent_complete ?? 0}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)' }}>
            <div style={{ width: `${prog?.progress?.percent_complete ?? 0}%`, height: '100%', borderRadius: 999, background: 'var(--gl)' }} />
          </div>
        </div>
      )}

      {/* Curriculum */}
      <div style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-mid-50)', margin: '22px 0 10px' }}>Curriculum</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {course.modules.map((m, mi) => (
          <div key={m.id}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{mi + 1}. {m.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {m.lessons.map(l => {
                const isDone = completed.has(l.id)
                const locked = l.locked && !l.is_preview
                return (
                  <button key={l.id} onClick={() => openLesson(l)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)', cursor: 'pointer', fontFamily: 'Outfit', textAlign: 'left' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: isDone ? 'rgba(0,200,83,.16)' : 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={isDone ? 'check' : locked ? 'lock' : l.is_preview ? 'eye' : l.type === 'pdf' ? 'doc' : 'play'} size={14} color={isDone ? 'var(--gl)' : locked ? 'var(--text-mid-50)' : 'var(--text-strong)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: locked ? 'var(--text-mid-60)' : 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                      <div className="t3" style={{ fontSize: 11 }}>{l.type === 'video' ? fmtDur(l.duration) : l.type.toUpperCase()}{l.is_preview ? ' · Preview' : ''}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 10, paddingBottom: 'env(safe-area-inset-bottom)', background: 'linear-gradient(to top, var(--bg, #060d09) 60%, transparent)' }}>
        <button onClick={onCta} disabled={enrolling} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: 'var(--gl)', color: '#04130b', fontFamily: 'Outfit', fontSize: 15.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {enrolling ? 'Enrolling…' : <>{!entitled && paid && <Icon name="lock" size={16} color="#04130b" />}{ctaText}</>}
        </button>
      </div>

      <PaymentSheet
        open={payOpen}
        kind="course"
        courseId={course.id}
        title={course.title}
        amountUsd={course.monetization.price_usd}
        onClose={() => setPayOpen(false)}
        onPaid={() => { setPayOpen(false); haptics.success(); refetch(); if (nextLesson) nav(routeFor('route.education.player', { slug: course.slug, lessonId: nextLesson.id })) }}
      />
    </PhoneShell>
  )
}
