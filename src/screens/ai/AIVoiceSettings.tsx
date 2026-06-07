import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { AI_VOICES, resolveVoiceId } from '../../data/aiVoices'
import { synthesize } from '../../lib/voiceChat'
import type { AISettings } from '../../mock/db'

export function AIVoiceSettings() {
  const { t } = useTranslation()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')
  const update = useEndpointMutation('api.ai.settings.update', { invalidates: ['api.ai.settings.get'] })

  const [previewing, setPreviewing] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (!s) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const set = (key: keyof AISettings, value: unknown) => update.mutate({ body: { [key]: value } })
  const selected = resolveVoiceId(s.voice)
  const speed = s.voiceSpeed ?? 1

  const preview = async (id: string, name: string) => {
    if (audioRef.current) { try { audioRef.current.pause() } catch { /* */ } audioRef.current = null }
    setPreviewing(id)
    try {
      const blob = await synthesize(`Hi, I'm ${name}. I'll be your CrymadX voice assistant.`, id)
      const url = URL.createObjectURL(blob)
      const a = new Audio(url)
      a.playbackRate = speed
      audioRef.current = a
      a.onended = a.onerror = () => { URL.revokeObjectURL(url); setPreviewing(p => (p === id ? null : p)) }
      await a.play()
    } catch {
      setPreviewing(p => (p === id ? null : p))
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.voiceSettingsHeader')} />

      <h3>{t('ai.voiceHeader')}</h3>
      {AI_VOICES.map(v => {
        const active = selected === v.id
        const loading = previewing === v.id
        return (
          <button key={v.id} className="li" onClick={() => set('voice', v.id)} style={{ width: '100%', textAlign: 'left', border: active ? '1px solid rgba(0,200,83,.35)' : undefined }}>
            <div className="li-i" style={{ background: active ? 'rgba(0,200,83,.15)' : undefined }}>
              <Icon name="volume" size={16} />
            </div>
            <div className="li-c" style={{ minWidth: 0 }}>
              <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {v.name}
                {active && <span className="grn" style={{ fontSize: 13 }}>✓</span>}
              </div>
              <div className="li-s">{v.desc}</div>
            </div>
            <div className="li-r" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Preview ${v.name}`}
                onClick={e => { e.stopPropagation(); if (!loading) void preview(v.id, v.name) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (!loading) void preview(v.id, v.name) } }}
                style={{ display: 'flex', cursor: 'pointer', padding: 4 }}
              >
                <Icon name={loading ? 'volume' : 'play'} size={15} color={loading ? 'var(--gl)' : 'var(--text-mid-40)'} />
              </span>
            </div>
          </button>
        )
      })}

      <h3 style={{ marginTop: 10 }}>{t('ai.speechHeader')}</h3>
      <div className="g" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span className="t2">{t('ai.speed')}</span>
          <span style={{ color: 'var(--text-strong)' }}>{speed.toFixed(1)}x</span>
        </div>
        <input type="range" min={0.5} max={2.0} step={0.1} value={speed} onChange={e => set('voiceSpeed', parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--gl)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', marginTop: 2 }}>
          <span>0.5x</span><span>2.0x</span>
        </div>
      </div>

      <div className="g" style={{ padding: 2, marginTop: 6 }}>
        <Toggle name={t('ai.pushToTalk')}    desc={t('ai.pushToTalkSub')}    on={s.pushToTalk}   onClick={() => set('pushToTalk', !s.pushToTalk)} />
        <Toggle name={t('ai.wakeWord')}      desc={t('ai.wakeWordSub')}      on={s.wakeWord}     onClick={() => set('wakeWord', !s.wakeWord)} />
        <Toggle name={t('ai.autoLanguage')}  desc={t('ai.autoLanguageSub')}  on={s.autoLanguage} onClick={() => set('autoLanguage', !s.autoLanguage)} />
      </div>
    </PhoneShell>
  )
}

function Toggle({ name, desc, on, onClick }: { name: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
      <div className="li-c">
        <div className="li-n">{name}</div>
        <div className="li-s">{desc}</div>
      </div>
      <button className={`tgl ${on ? 'on' : 'off'}`} onClick={onClick} aria-label={name} />
    </div>
  )
}
