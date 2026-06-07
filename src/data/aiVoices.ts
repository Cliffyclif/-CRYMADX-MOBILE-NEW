/**
 * Curated ElevenLabs voices offered in AI Voice Settings. `id` is the real
 * ElevenLabs voice_id sent to the TTS proxy; the names/descriptions are what the
 * user sees. Keep this list small and high-quality.
 */
export type AIVoice = { id: string; name: string; desc: string; locale: string }

export const AI_VOICES: AIVoice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',  desc: 'Female · American · Reassuring',   locale: 'en-US' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Female · American · Playful & warm', locale: 'en-US' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',  desc: 'Female · British · Clear & engaging', locale: 'en-GB' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella',  desc: 'Female · American · Bright & warm',  locale: 'en-US' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',  desc: 'Male · American · Deep & comforting', locale: 'en-US' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric',   desc: 'Male · American · Smooth & trusted',  locale: 'en-US' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',  desc: 'Male · British · Warm storyteller',   locale: 'en-GB' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River',  desc: 'Neutral · American · Calm & clear',   locale: 'en-US' },
]

/** Default AI voice (Sarah) — used when no/legacy voice is stored. */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

/** Resolve a stored value (may be a legacy name like "Mira") to a valid voice_id. */
export function resolveVoiceId(stored: string | undefined | null): string {
  if (stored && AI_VOICES.some(v => v.id === stored)) return stored
  return DEFAULT_VOICE_ID
}

export function voiceName(id: string): string {
  return AI_VOICES.find(v => v.id === id)?.name ?? 'Sarah'
}
