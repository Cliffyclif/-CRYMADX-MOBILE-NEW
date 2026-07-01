/**
 * Academy player — plays self-hosted AES-128 encrypted HLS via hls.js, with the
 * full protection stack:
 *   - Android FLAG_SECURE (screenGuard) → no screenshots / screen recording
 *   - moving viewer-email watermark → any leaked capture is traceable
 *   - 1-stream-per-account heartbeat → kills login sharing
 *   - download / context-menu / PiP / remote-playback locked down
 * Falls back to plain <video src> for un-packaged (MP4) media and renders
 * pdf/text lessons inline.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Hls from 'hls.js'
import { Icon } from '../../components/Icon'
import { routeFor } from '../../routes'
import { haptics } from '../../lib/haptics'
import { screenGuard } from '../../lib/screenGuard'
import { educationService, type EduLessonView } from '../../services/educationService'

export function EducationLearn() {
  const { slug = '', lessonId = '' } = useParams()
  const nav = useNavigate()

  const [course, setCourse] = useState<Awaited<ReturnType<typeof educationService.getCourse>>['course'] | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [playlist, setPlaylist] = useState<string | null>(null)
  const [type, setType] = useState('video')
  const [textContent, setTextContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [superseded, setSuperseded] = useState(false)
  const [showList, setShowList] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const notesRef = useRef<Record<string, string>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const streamRef = useRef<string | null>(null)
  const watchedRef = useRef(0)

  const flat: EduLessonView[] = useMemo(() => (course ? course.modules.flatMap(m => m.lessons) : []), [course])
  const current = flat.find(l => l.id === lessonId) || null
  const idx = flat.findIndex(l => l.id === lessonId)
  const isVideo = type === 'video' && (mediaUrl || playlist)

  // FLAG_SECURE for the whole time the player screen is mounted.
  useEffect(() => {
    screenGuard.enable()
    return () => { screenGuard.disable() }
  }, [])

  // Load course + progress once.
  useEffect(() => {
    let live = true
    educationService.getCourse(slug).then(async ({ course }) => {
      if (!live) return
      setCourse(course)
      try {
        const { progress } = await educationService.getProgress(course.id)
        if (live) {
          setCompleted(new Set(progress.completed_lesson_ids))
          const n = progress.notes || {}
          notesRef.current = n
          setNoteText(n[lessonId] || '')
        }
      } catch { /* ignore */ }
    }).catch(e => live && setErr(e.message || 'Could not load course'))
    return () => { live = false }
  }, [slug])

  // Load the saved note for the lesson being viewed.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setNoteText(notesRef.current[lessonId] || '')
    setNoteState('idle')
  }, [lessonId])

  // Resolve media for the current lesson.
  useEffect(() => {
    if (!course || !current) return
    let live = true
    setLoading(true); setErr(''); setMediaUrl(null); setPlaylist(null); setTextContent(''); setSuperseded(false); watchedRef.current = 0
    educationService.play(course.id, current.id)
      .then(r => {
        if (!live) return
        setType(r.type); streamRef.current = r.stream_id || null
        if (r.hls && r.playlist) setPlaylist(r.playlist)
        else if (r.type === 'text') setTextContent(r.text_content || current.text_content || '')
        else setMediaUrl(r.url || null)
      })
      .catch(e => live && setErr(e?.status === 402 ? 'This lesson is locked. Unlock the course to watch.' : (e.message || 'Could not load this lesson')))
      .finally(() => live && setLoading(false))
    return () => { live = false }
  }, [course?.id, lessonId])

  // Attach encrypted HLS via hls.js (fetches the AES key from our gated endpoint).
  useEffect(() => {
    const video = videoRef.current
    if (!playlist || !video) return
    const blobUrl = URL.createObjectURL(new Blob([playlist], { type: 'application/vnd.apple.mpegurl' }))
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 })
      hls.loadSource(blobUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setErr('Playback error — tap retry.') })
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = blobUrl
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; URL.revokeObjectURL(blobUrl) }
  }, [playlist])

  // 1-stream heartbeat.
  useEffect(() => {
    if (!streamRef.current) return
    const t = setInterval(async () => {
      if (!streamRef.current) return
      try { const r = await educationService.playPing(streamRef.current); if (!r.active) { setSuperseded(true); videoRef.current?.pause() } } catch { /* fail-open */ }
    }, 20000)
    return () => clearInterval(t)
  }, [mediaUrl, playlist])

  const go = (l?: EduLessonView) => l && nav(routeFor('route.education.player', { slug, lessonId: l.id }))
  const markComplete = async () => {
    if (!course || !current) return
    try {
      haptics.success()
      const { progress } = await educationService.complete(course.id, current.id, Math.round(watchedRef.current))
      setCompleted(new Set(progress.completed_lesson_ids))
      if (idx + 1 < flat.length) go(flat[idx + 1])
    } catch (e: any) { setErr(e.message) }
  }
  const retry = () => {
    if (!course || !current) return
    setSuperseded(false); setPlaylist(null); setMediaUrl(null)
    educationService.play(course.id, current.id).then(r => { streamRef.current = r.stream_id || null; if (r.hls && r.playlist) setPlaylist(r.playlist); else setMediaUrl(r.url || null) })
  }
  const noCtx = (e: React.MouseEvent) => e.preventDefault()

  const persistNote = async (text: string) => {
    if (!course || !current) return
    const key = current.id
    if ((notesRef.current[key] || '') === text) return
    setNoteState('saving')
    try {
      await educationService.saveNote(course.id, key, text)
      const n = { ...notesRef.current }
      if (text.trim()) n[key] = text; else delete n[key]
      notesRef.current = n
      setNoteState('saved')
      setTimeout(() => setNoteState(s => (s === 'saved' ? 'idle' : s)), 1600)
    } catch { setNoteState('error') }
  }
  const onNoteChange = (v: string) => {
    setNoteText(v)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persistNote(v), 1200)
  }
  const onNoteBlur = () => { if (saveTimer.current) clearTimeout(saveTimer.current); persistNote(noteText) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #060d09)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <button onClick={() => nav(routeFor('route.education.course', { slug }))} aria-label="Back" style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}>
          <Icon name="arrow-l" size={18} color="var(--text-strong)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current?.title || 'Lesson'}</div>
          <div className="t3" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course?.title}</div>
        </div>
        <button onClick={() => setShowList(v => !v)} aria-label="Lessons" style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}>
          <Icon name="layers" size={18} color="var(--text-strong)" />
        </button>
      </div>

      {/* Stage */}
      <div onContextMenu={noCtx} style={{ position: 'relative', background: '#000', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', overflow: 'hidden' }}>
        {superseded ? (
          <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
            <Icon name="x" size={30} color="var(--gl)" />
            <div style={{ fontWeight: 700, marginTop: 8 }}>Playing on another device</div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>Only one active stream per account.</div>
            <button onClick={retry} style={{ marginTop: 14, background: 'var(--gl)', color: '#04130b', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit' }}>Resume here</button>
          </div>
        ) : loading ? <div className="t3" style={{ color: '#fff', opacity: 0.7 }}>Loading…</div>
          : err ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
              <Icon name="lock" size={26} color="var(--gl)" />
              <div style={{ fontSize: 13.5, marginTop: 10, opacity: 0.85 }}>{err}</div>
              <button onClick={retry} style={{ marginTop: 12, background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit' }}>Retry</button>
            </div>
          )
          : isVideo ? (
            <video
              ref={videoRef}
              key={(playlist ? 'hls' : mediaUrl) || 'v'}
              {...(mediaUrl && !playlist ? { src: mediaUrl } : {})}
              controls
              playsInline
              controlsList="nodownload noremoteplayback noplaybackrate"
              disablePictureInPicture
              onContextMenu={noCtx}
              style={{ width: '100%', height: '100%' }}
              onTimeUpdate={e => { watchedRef.current = (e.target as HTMLVideoElement).currentTime }}
              onEnded={markComplete}
            />
          )
          : type === 'pdf' && mediaUrl ? <iframe title="doc" src={mediaUrl} style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
          : type === 'text' ? <div style={{ color: 'var(--text-strong)', padding: 20, overflow: 'auto', height: '100%', fontSize: 14, lineHeight: 1.6 }}>{textContent}</div>
          : <div className="t3" style={{ color: '#fff', opacity: 0.6 }}>No media</div>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mid-50)' }}>Lesson {idx + 1} of {flat.length}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => go(flat[idx - 1])} disabled={idx <= 0} style={navBtn(idx <= 0)}><Icon name="arrow-l" size={16} color="var(--text-strong)" /></button>
            <button onClick={() => go(flat[idx + 1])} disabled={idx + 1 >= flat.length} style={navBtn(idx + 1 >= flat.length)}><Icon name="arrow" size={16} color="var(--text-strong)" /></button>
          </div>
        </div>
        <h2 style={{ fontSize: 18, margin: '10px 0 0' }}>{current?.title}</h2>

        {/* About this lesson */}
        {current?.description && (
          <div style={cardBox}>
            <div style={sectionHead}><Icon name="info" size={14} color="var(--gl)" /> <span>ABOUT THIS LESSON</span></div>
            <p className="t2" style={{ fontSize: 13.5, lineHeight: 1.65, margin: '10px 0 0' }}>{current.description}</p>
          </div>
        )}

        {/* Key points */}
        {current?.key_points && current.key_points.length > 0 && (
          <div style={cardBox}>
            <div style={sectionHead}><Icon name="check" size={14} color="var(--gl)" /> <span>KEY POINTS</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 11 }}>
              {current.key_points.map((kp, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 2, flexShrink: 0, display: 'flex' }}><Icon name="check" size={14} color="var(--gl)" /></span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-strong)' }}>{kp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your notes */}
        <div style={cardBox}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionHead}><Icon name="edit" size={14} color="var(--gl)" /> <span>YOUR NOTES</span></div>
            <span style={{ fontSize: 11, color: noteState === 'error' ? '#e5714e' : 'var(--text-mid-50)' }}>
              {noteState === 'saving' ? 'Saving…' : noteState === 'saved' ? 'Saved' : noteState === 'error' ? 'Not saved' : 'Private to you'}
            </span>
          </div>
          <textarea
            value={noteText}
            onChange={e => onNoteChange(e.target.value)}
            onBlur={onNoteBlur}
            placeholder="Write your own notes and takeaways. They save automatically and stay private to you."
            aria-label="Your notes for this lesson"
            style={{ width: '100%', minHeight: 108, resize: 'vertical', marginTop: 11, background: 'rgba(0,0,0,.25)', color: 'var(--text-strong)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 12px', fontFamily: 'Outfit', fontSize: 13.5, lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {playlist && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-mid-50)', fontSize: 11, marginTop: 12 }}>
            <Icon name="lock" size={12} color="var(--gl)" /> Encrypted, screen-capture protected · do not share
          </div>
        )}

        <button onClick={markComplete} style={{ marginTop: 16, width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: current && completed.has(current.id) ? 'rgba(255,255,255,.06)' : 'var(--gl)', color: current && completed.has(current.id) ? 'var(--text-mid-60)' : '#04130b' }}>
          <Icon name="check" size={16} color={current && completed.has(current.id) ? 'var(--text-mid-60)' : '#04130b'} />
          {current && completed.has(current.id) ? 'Completed' : 'Mark complete & continue'}
        </button>
      </div>

      {/* Lesson list drawer */}
      {showList && (
        <div onClick={() => setShowList(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.6)', display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '82%', maxWidth: 360, height: '100%', background: 'var(--bg-elev, #0c1410)', borderLeft: '1px solid rgba(255,255,255,.08)', padding: 16, overflowY: 'auto', paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-strong)' }}>Course content</div>
              <button onClick={() => setShowList(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={18} color="var(--text-mid-60)" /></button>
            </div>
            <div className="t3" style={{ fontSize: 12, marginBottom: 14 }}>{completed.size}/{flat.length} complete</div>
            {course?.modules.map((m, mi) => (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-mid-60)', marginBottom: 6 }}>{mi + 1}. {m.title}</div>
                {m.lessons.map(l => {
                  const isDone = completed.has(l.id)
                  const isCurrent = l.id === lessonId
                  const locked = l.locked && !l.is_preview
                  return (
                    <button key={l.id} onClick={() => { if (!locked) { setShowList(false); go(l) } }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, marginBottom: 3, cursor: locked ? 'default' : 'pointer', fontFamily: 'Outfit', textAlign: 'left', background: isCurrent ? 'rgba(0,200,83,.12)' : 'transparent', border: `1px solid ${isCurrent ? 'rgba(0,200,83,.3)' : 'transparent'}` }}>
                      <Icon name={isDone ? 'check' : locked ? 'lock' : l.is_preview ? 'eye' : l.type === 'pdf' ? 'doc' : 'play'} size={14} color={isDone ? 'var(--gl)' : locked ? 'var(--text-mid-50)' : 'var(--text-strong)'} />
                      <span style={{ flex: 1, fontSize: 13, color: isCurrent ? 'var(--text-strong)' : 'var(--text-mid-60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn = (disabled: boolean): React.CSSProperties => ({
  width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const cardBox: React.CSSProperties = { marginTop: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 14 }
const sectionHead: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, color: 'var(--text-mid-60)' }
