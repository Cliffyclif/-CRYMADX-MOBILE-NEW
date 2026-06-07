/**
 * useVoiceCall — drives the AI voice loop for VoiceMode:
 *   listening (mic+silence) → thinking (STT + AI stream) → speaking (TTS) → repeat
 * Sentence-streams the reply to TTS for low latency. Tap-to-interrupt (barge-in).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getMic, recordTurn, transcribe, synthesize, createConversation, streamAssistant,
  SpeechQueue, type TurnController,
} from './voiceChat'
import { resolveVoiceId } from '../data/aiVoices'

export type CallStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'
export interface TranscriptLine { role: 'user' | 'ai'; text: string }

export function useVoiceCall(opts: { voice: string; speed: number; enabled: boolean }) {
  const [status, setStatus] = useState<CallStatus>('connecting')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [muted, setMuted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const aliveRef = useRef(true)
  const micRef = useRef<MediaStream | null>(null)
  const convRef = useRef<string | null>(null)
  const recRef = useRef<TurnController | null>(null)
  const queueRef = useRef<SpeechQueue | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const turnRef = useRef<{ streamDone: boolean; synthPending: number }>({ streamDone: true, synthPending: 0 })

  const voiceRef = useRef(resolveVoiceId(opts.voice))
  voiceRef.current = resolveVoiceId(opts.voice)
  const speedRef = useRef(opts.speed)
  speedRef.current = opts.speed

  const setAiText = (text: string) => setTranscript(t => {
    const c = t.slice()
    const last = c[c.length - 1]
    if (last && last.role === 'ai') c[c.length - 1] = { ...last, text }
    return c
  })

  // Decide when a turn is fully done (stream complete + all TTS played) → listen again.
  const maybeAdvance = useCallback(() => {
    if (!aliveRef.current) return
    const q = queueRef.current
    const turn = turnRef.current
    if (turn.streamDone && turn.synthPending === 0 && q && q.idle) {
      listenRef.current()
    }
  }, [])

  const speak = useCallback(async (sentence: string) => {
    const turn = turnRef.current
    turn.synthPending++
    try {
      const blob = await synthesize(sentence, voiceRef.current)
      if (!aliveRef.current) return
      const q = queueRef.current!
      q.rate = speedRef.current
      q.enqueue(blob)
    } catch { /* skip this sentence on TTS failure */ }
    finally {
      turn.synthPending--
      maybeAdvance()
    }
  }, [maybeAdvance])

  const respond = useCallback(async (userText: string) => {
    if (!aliveRef.current) return
    setStatus('thinking')
    try {
      if (!convRef.current) convRef.current = await createConversation()
    } catch { setErrorMsg('ai'); setStatus('error'); return }
    if (!aliveRef.current) return

    const turn = { streamDone: false, synthPending: 0 }
    turnRef.current = turn
    setTranscript(t => [...t, { role: 'ai', text: '' }])

    const ctrl = new AbortController()
    abortRef.current = ctrl
    let acc = ''
    let pending = ''

    const flushSentences = (force = false) => {
      // Emit complete sentences as they form (low latency); flush remainder on force.
      let m: RegExpMatchArray | null
      while ((m = pending.match(/^([\s\S]*?[.!?。！？\n])\s*/))) {
        const sentence = m[1].trim()
        pending = pending.slice(m[0].length)
        if (sentence) void speak(sentence)
      }
      if (force) {
        const rest = pending.trim()
        pending = ''
        if (rest) void speak(rest)
      }
    }

    try {
      await streamAssistant(convRef.current!, userText, {
        signal: ctrl.signal,
        onDelta: d => {
          acc += d
          pending += d
          setAiText(acc)
          flushSentences(false)
        },
      })
      flushSentences(true)
    } catch {
      if (!ctrl.signal.aborted) { /* network/AI error — keep transcript, just advance */ }
    }
    turn.streamDone = true
    maybeAdvance()
  }, [speak, maybeAdvance])

  const listen = useCallback(() => {
    if (!aliveRef.current || !micRef.current) return
    setStatus('listening')
    recRef.current = recordTurn(micRef.current, {
      silenceMs: 1300,
      maxMs: 20000,
      onStop: async blob => {
        if (!aliveRef.current) return
        // Too short to contain speech → keep listening.
        if (blob.size < 1600) { listen(); return }
        setStatus('thinking')
        let text = ''
        try { text = await transcribe(blob) } catch { /* */ }
        if (!aliveRef.current) return
        if (!text) { listen(); return }
        setTranscript(t => [...t, { role: 'user', text }])
        void respond(text)
      },
    })
  }, [respond])

  // Stable ref so maybeAdvance (defined first) can call the latest listen.
  const listenRef = useRef(listen)
  listenRef.current = listen

  // Barge-in / restart.
  const interrupt = useCallback(() => {
    if (!aliveRef.current) return
    abortRef.current?.abort()
    queueRef.current?.stop()
    recRef.current?.cancel()
    turnRef.current = { streamDone: true, synthPending: 0 }
    listen()
  }, [listen])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      queueRef.current?.setMuted(next)
      return next
    })
  }, [])

  // Setup / teardown.
  useEffect(() => {
    if (!opts.enabled) return
    aliveRef.current = true
    const q = new SpeechQueue()
    q.onSpeakingChange = speaking => {
      if (!aliveRef.current) return
      if (speaking) setStatus('speaking')
      else maybeAdvance()
    }
    queueRef.current = q

    ;(async () => {
      try {
        micRef.current = await getMic()
        if (!aliveRef.current) { micRef.current?.getTracks().forEach(t => t.stop()); return }
        listen()
      } catch {
        setErrorMsg('mic')
        setStatus('error')
      }
    })()

    return () => {
      aliveRef.current = false
      abortRef.current?.abort()
      recRef.current?.cancel()
      queueRef.current?.stop()
      micRef.current?.getTracks().forEach(t => t.stop())
      micRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled])

  return { status, transcript, muted, errorMsg, interrupt, toggleMute }
}
