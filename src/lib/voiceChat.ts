/**
 * Voice-call plumbing for VoiceMode: microphone capture (with silence
 * auto-stop), ElevenLabs STT/TTS via the backend proxy, the existing AI chat
 * SSE brain, and a sequential audio playback queue.
 *
 * Keys live server-side; this only talks to /api/ai/voice/* and /api/ai/web/*.
 */
import { getToken } from '../api/client'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')
const ROOT = API_BASE.replace(/\/api$/, '')
// Shared voice + chat endpoints (same ones the web exchange uses):
//   /voice/transcribe (faster-whisper STT), /tts + /voices (Edge TTS + ElevenLabs)
const CHAT_BASE = `${ROOT}/api/ai/web`

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken()
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

// ── STT / TTS (shared ai-gateway /api/ai/web routes) ─────────────────────────
export async function transcribe(blob: Blob): Promise<string> {
  const fd = new FormData()
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
  fd.append('audio', blob, `voice.${ext}`)
  const res = await fetch(`${CHAT_BASE}/voice/transcribe`, { method: 'POST', headers: authHeaders(), body: fd })
  if (!res.ok) throw new Error(`STT ${res.status}`)
  const j = await res.json()
  return (j.text || '').trim()
}

export async function synthesize(text: string, voiceId: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(`${CHAT_BASE}/tts`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'audio/mpeg' }),
    body: JSON.stringify({ text, voice: voiceId }),
    signal,
  })
  if (!res.ok) throw new Error(`TTS ${res.status}`)
  return res.blob()
}

// ── AI chat brain (reuses the same SSE endpoint AIChat uses) ─────────────────
export async function createConversation(): Promise<string> {
  const res = await fetch(`${CHAT_BASE}/conversations`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title: '' }),
  })
  if (!res.ok) throw new Error(`conversation ${res.status}`)
  const j = await res.json()
  return j.conversation?._id ?? j.conversation?.id
}

/** Stream an assistant reply; calls onDelta as tokens arrive. Returns full text. */
export async function streamAssistant(
  convId: string,
  content: string,
  opts: { onDelta?: (d: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const res = await fetch(`${CHAT_BASE}/conversations/${convId}/messages`, {
    method: 'POST',
    signal: opts.signal,
    headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'text/event-stream' }),
    body: JSON.stringify({ content, pinVerified: false }),
  })
  if (!res.ok || !res.body) throw new Error(`chat ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let pendingEvent: string | null = null
  let acc = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '')
      buf = buf.slice(nl + 1)
      if (line === '') { pendingEvent = null; continue }
      if (line.startsWith('event:')) { pendingEvent = line.slice(6).trim(); continue }
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim()
        if (!pendingEvent) continue
        try {
          const parsed = JSON.parse(data)
          if (pendingEvent === 'delta') {
            const piece = typeof parsed.content === 'string' ? parsed.content : ''
            if (piece) { acc += piece; opts.onDelta?.(piece) }
          } else if (pendingEvent === 'assistant_message') {
            const full = parsed?.content
            if (typeof full === 'string' && full.length > acc.length) {
              const extra = full.slice(acc.length)
              acc = full
              if (extra) opts.onDelta?.(extra)
            }
          }
        } catch { /* ignore malformed line */ }
      }
    }
  }
  return acc
}

// ── Microphone capture with silence auto-stop ────────────────────────────────
function pickMime(): string {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

export async function getMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
}

export interface TurnController { stop: () => void; cancel: () => void }

/**
 * Record one turn on an existing mic stream, auto-stopping after `silenceMs` of
 * quiet (once the user has actually spoken) or `maxMs`. Calls onStop(blob) unless
 * cancelled.
 */
export function recordTurn(
  stream: MediaStream,
  opts: { onStop: (blob: Blob) => void; silenceMs?: number; maxMs?: number },
): TurnController {
  const mime = pickMime()
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks: Blob[] = []
  let finished = false
  let cancelled = false

  const ac = new AudioContext()
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  const srcNode = ac.createMediaStreamSource(stream)
  const analyser = ac.createAnalyser()
  analyser.fftSize = 2048
  srcNode.connect(analyser)
  const data = new Uint8Array(analyser.fftSize)

  const silenceMs = opts.silenceMs ?? 1300
  const maxMs = opts.maxMs ?? 20000
  const startedAt = Date.now()
  let lastLoud = Date.now()
  let spoke = false
  let raf = 0

  const cleanup = () => {
    cancelAnimationFrame(raf)
    try { srcNode.disconnect() } catch { /* */ }
    try { ac.close() } catch { /* */ }
  }

  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) }
  mr.onstop = () => {
    cleanup()
    if (!cancelled) opts.onStop(new Blob(chunks, { type: mime || 'audio/webm' }))
  }

  const finish = () => { if (finished) return; finished = true; try { mr.stop() } catch { cleanup() } }

  const tick = () => {
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v }
    const rms = Math.sqrt(sum / data.length)
    const now = Date.now()
    if (rms > 0.025) { lastLoud = now; spoke = true }
    if ((spoke && now - lastLoud > silenceMs) || now - startedAt > maxMs) { finish(); return }
    raf = requestAnimationFrame(tick)
  }

  mr.start()
  raf = requestAnimationFrame(tick)

  return {
    stop: finish,
    cancel: () => { cancelled = true; finish() },
  }
}

// ── Sequential audio playback ────────────────────────────────────────────────
export class SpeechQueue {
  private q: Blob[] = []
  private current: HTMLAudioElement | null = null
  private playing = false
  rate = 1
  muted = false
  onSpeakingChange?: (speaking: boolean) => void

  get idle(): boolean { return !this.playing && this.q.length === 0 }

  enqueue(blob: Blob): void { this.q.push(blob); void this.pump() }

  private async pump(): Promise<void> {
    if (this.playing) return
    const blob = this.q.shift()
    if (!blob) { this.onSpeakingChange?.(false); return }
    this.playing = true
    this.onSpeakingChange?.(true)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.playbackRate = this.rate
    audio.muted = this.muted
    this.current = audio
    const next = () => {
      URL.revokeObjectURL(url)
      this.current = null
      this.playing = false
      void this.pump()
    }
    audio.onended = next
    audio.onerror = next
    try { await audio.play() } catch { next() }
  }

  setMuted(m: boolean): void { this.muted = m; if (this.current) this.current.muted = m }

  stop(): void {
    this.q = []
    if (this.current) { try { this.current.pause() } catch { /* */ } this.current = null }
    this.playing = false
    this.onSpeakingChange?.(false)
  }
}
