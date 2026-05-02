import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { getToken } from '../../api/client'
import { routeFor } from '../../routes'

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type CreateResponse = { ticket: { id: string } } | { id: string }

const CATS: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'wallet', value: 'wallet',   label: 'Wallet' },
  { icon: 'swap',   value: 'trading',  label: 'Trading' },
  { icon: 'card',   value: 'card',     label: 'Card' },
  { icon: 'shield', value: 'security', label: 'Security' },
  { icon: 'user',   value: 'kyc',      label: 'KYC/Account' },
  { icon: 'help',   value: 'other',    label: 'Other' },
]

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
}

const ETA_FOR_PRIORITY: Record<Priority, string> = {
  low: 'within 24 hours',
  medium: '2–6 hours',
  high: '1–2 hours',
  urgent: 'under 30 min',
}

const MAX_FILES = 5
const MAX_BYTES = 10 * 1024 * 1024

export function Contact() {
  const nav = useNavigate()
  const [category, setCategory] = useState('wallet')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const create = useEndpointMutation<{ body: { subject: string; message: string; category: string; priority: Priority; attachments: string[] } }, CreateResponse>(
    'api.support.tickets.create',
    { invalidates: ['api.support.tickets.list'] },
  )

  const addFiles = (incoming: File[]) => {
    setFileError(null)
    const next: File[] = [...files]
    for (const f of incoming) {
      if (next.length >= MAX_FILES) { setFileError(`Maximum ${MAX_FILES} attachments`); break }
      if (f.size > MAX_BYTES) { setFileError(`${f.name} exceeds 10MB`); continue }
      next.push(f)
    }
    setFiles(next)
  }

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const uploadAll = async (): Promise<string[]> => {
    if (files.length === 0) return []
    const token = getToken()
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    const res = await fetch('/api/support/tickets/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`Attachment upload failed: ${txt || res.status}`)
    }
    const json = await res.json() as { urls?: string[] }
    return json.urls ?? []
  }

  const submit = async () => {
    setError(null)
    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required')
      return
    }
    try {
      let urls: string[] = []
      if (files.length > 0) {
        setUploading(true)
        urls = await uploadAll()
        setUploading(false)
      }
      const result = await create.mutateAsync({
        body: {
          subject: subject.trim(),
          message: description.trim(),
          category,
          priority,
          attachments: urls,
        },
      })
      const ticketId = (result as any)?.ticket?.id ?? (result as any)?.id
      if (ticketId) {
        nav(routeFor('route.support.ticket', { ticketId }), { replace: true })
      } else {
        nav('/help/tickets', { replace: true })
      }
    } catch (err) {
      setUploading(false)
      setError((err as Error).message)
    }
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <Icon name="arrow-l" size={18} />
        </button>
        <h2 style={{ flex: 1, margin: 0 }}>New Ticket</h2>
      </div>
      <div className="t2">Tell us what's wrong — we'll fix it</div>

      <h3 style={{ marginTop: 10 }}>Category</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {CATS.map(c => {
          const active = category === c.value
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="g"
              style={{
                padding: 10, display: 'flex', alignItems: 'center', gap: 6,
                border: active ? '1px solid var(--gl)' : '1px solid transparent',
                background: active ? 'rgba(0,200,83,.06)' : undefined,
                cursor: 'pointer', width: '100%',
              }}
            >
              <div className="li-i" style={{ width: 24, height: 24 }}><Icon name={c.icon} size={12} color={active ? 'var(--gl)' : undefined} /></div>
              <div style={{ flex: 1, fontSize: 14, color: 'var(--text-strong)', textAlign: 'left' }}>{c.label}</div>
              {active ? <div className="grn" style={{ fontSize: 14 }}>●</div> : <div className="t3" style={{ fontSize: 14 }}>○</div>}
            </button>
          )
        })}
      </div>

      <h3 style={{ marginTop: 10 }}>Subject</h3>
      <div className="inp" style={{ padding: 10 }}>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Brief summary (e.g. Withdrawal stuck)"
          maxLength={120}
          style={{ flex: 1, color: 'var(--text-strong)', fontSize: 14 }}
        />
      </div>

      <h3 style={{ marginTop: 8 }}>Description</h3>
      <div className="g" style={{ padding: 10, border: '1px solid var(--divider-soft)' }}>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Tell us exactly what happened. Include any TXIDs, dates, error messages."
          style={{ width: '100%', minHeight: 100, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-strong)', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, resize: 'vertical' }}
        />
      </div>

      <h3 style={{ marginTop: 10 }}>Attachments</h3>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={e => {
          const list = Array.from(e.target.files ?? [])
          addFiles(list)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />
      {files.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="g"
          style={{
            padding: 14, width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            border: '2px dashed rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div className="li-i" style={{ width: 32, height: 32, background: 'rgba(0,200,83,.08)' }}><Icon name="paperclip" size={14} color="var(--gl)" /></div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 600 }}>Tap to attach files</div>
            <div className="t3">Up to 5 files, 10 MB each. PNG, JPG, PDF, MP4 supported.</div>
          </div>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} className="g" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="li-i" style={{ width: 28, height: 28, background: 'rgba(0,200,83,.08)' }}>
                <Icon name="paperclip" size={12} color="var(--gl)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div className="t3" style={{ fontSize: 11 }}>{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} aria-label={`Remove ${f.name}`}>
                <Icon name="x" size={12} color="var(--text-mid-50)" />
              </button>
            </div>
          ))}
          {files.length < MAX_FILES && (
            <button onClick={() => fileInputRef.current?.click()} className="grn" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 700, padding: '6px 0' }}>
              + Add another file
            </button>
          )}
        </div>
      )}
      {fileError && <div className="t3" style={{ color: 'var(--r)', marginTop: 4 }}>{fileError}</div>}

      <h3 style={{ marginTop: 10 }}>Priority</h3>
      <div className="tabs">
        {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
          <button key={p} className={`tab ${priority === p ? 'a' : ''}`} onClick={() => setPriority(p)}>{PRIORITY_LABEL[p]}</button>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <Icon name="clock" size={14} color="var(--gl)" />
        <div className="t3" style={{ lineHeight: 1.4 }}>
          Average response time: <span className="grn" style={{ fontWeight: 700 }}>{ETA_FOR_PRIORITY[priority]}</span>
        </div>
      </div>

      {error && (
        <div className="g" style={{ padding: 10, marginTop: 8, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 13 }}>{error}</div>
      )}

      <button
        className="btn btn-g"
        style={{ marginTop: 12 }}
        onClick={submit}
        disabled={create.isPending || uploading || !subject.trim() || !description.trim()}
      >
        {uploading ? 'Uploading attachments…' : create.isPending ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </PhoneShell>
  )
}
