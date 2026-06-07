import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { AIVoiceOrb, type OrbState } from '../../components/AIVoiceOrb'
import { useEndpoint } from '../../api/hooks'
import { useVoiceCall } from '../../lib/useVoiceCall'
import { voiceName } from '../../data/aiVoices'
import type { AISettings } from '../../mock/db'

export function VoiceMode() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')

  const { status, transcript, muted, interrupt, toggleMute } = useVoiceCall({
    voice: s?.voice ?? '',
    speed: s?.voiceSpeed ?? 1,
    enabled: !!s, // wait until settings (and resolved voice) are loaded
  })

  // Map call status → orb animation state.
  const orbState: OrbState =
    status === 'speaking' ? 'speaking' : status === 'thinking' ? 'thinking' : 'listening'

  const stateLabel =
    status === 'connecting' ? (t('ai.connecting') || 'Connecting…')
    : status === 'error' ? (t('ai.voiceError') || 'Mic unavailable')
    : status === 'thinking' ? t('ai.stateThinking')
    : status === 'speaking' ? t('ai.stateSpeaking')
    : t('ai.stateListening')

  const lastUser = [...transcript].reverse().find(l => l.role === 'user')
  const lastAi = [...transcript].reverse().find(l => l.role === 'ai')

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="grn" style={{ fontSize: 14 }}>●</span>
          <span className="t2">{s?.voice ? voiceName(s.voice) : t('ai.liveModel')}</span>
        </div>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }} aria-label={t('ai.endCallBtn')}>
          <Icon name="x" size={16} color="var(--text-mid-50)" />
        </button>
      </div>

      <img src="/crymadx-ai-full.png" alt="" style={{ width: 120, margin: '4px auto 0' }} />

      <button
        onClick={interrupt}
        disabled={status === 'connecting' || status === 'error'}
        aria-label={t('ai.tapInterrupt')}
        style={{ marginTop: 16, background: 'none', border: 'none', cursor: status === 'connecting' ? 'default' : 'pointer', display: 'block', width: '100%' }}
      >
        <AIVoiceOrb state={orbState} />
      </button>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: status === 'error' ? 'var(--r)' : 'var(--text-strong)', fontWeight: 800, letterSpacing: 1 }}>{stateLabel}</div>
        <div className="t2" style={{ marginTop: 4 }}>
          {status === 'error'
            ? (t('ai.micHint') || 'Allow microphone access to talk to CrymadX AI.')
            : t('ai.tapInterrupt')}
        </div>
      </div>

      {lastUser && (
        <div className="g" style={{ padding: 10, marginTop: 10, width: '100%' }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('ai.youLabel')}</div>
          <div style={{ fontSize: 14, color: 'var(--text-strong)', lineHeight: 1.5 }}>{lastUser.text}</div>
        </div>
      )}

      {lastAi && lastAi.text && (
        <div className="g" style={{ padding: 10, marginTop: 6, width: '100%', background: 'rgba(0,200,83,.05)', borderLeft: '3px solid var(--gl)' }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}><span style={{ color: 'var(--gl)' }}>{t('ai.aiLabel')}</span></div>
          <div style={{ fontSize: 14, color: 'var(--text-strong)', lineHeight: 1.5 }}>{lastAi.text}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, width: '100%', marginTop: 'auto', paddingTop: 14, alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={toggleMute} style={{ background: 'none', border: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <div className="ic" style={{ width: 42, height: 42, background: 'var(--surface-soft)' }}>
            <Icon name="volume" size={18} color={muted ? 'var(--r)' : 'var(--text-mid-50)'} />
          </div>
          <div className="t3" style={{ marginTop: 4, fontSize: 10 }}>{muted ? t('ai.unmute') : t('ai.mute')}</div>
        </button>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <div className="ic" style={{ width: 60, height: 60, background: 'linear-gradient(135deg, var(--r), #c53030)', boxShadow: '0 6px 24px rgba(239,68,68,.5)' }}>
            <Icon name="phone" size={26} color="#fff" />
          </div>
          <div className="t3" style={{ marginTop: 4, fontWeight: 700 }}>{t('ai.endCallBtn')}</div>
        </button>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <div className="ic" style={{ width: 42, height: 42, background: 'var(--surface-soft)' }}>
            <Icon name="msg" size={18} color="var(--text-mid-50)" />
          </div>
          <div className="t3" style={{ marginTop: 4, fontSize: 10 }}>{t('ai.switch')}</div>
        </button>
      </div>
    </PhoneShell>
  )
}
