import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { AIVoiceOrb, type OrbState } from '../../components/AIVoiceOrb'

export function VoiceMode() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [state, setState] = useState<OrbState>('listening')
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const cycle: OrbState[] = ['listening', 'thinking', 'speaking', 'listening']
    let i = 0
    const tm = setInterval(() => {
      i = (i + 1) % cycle.length
      setState(cycle[i])
    }, 4000)
    return () => clearInterval(tm)
  }, [])

  const stateLabel = state === 'listening' ? t('ai.stateListening') : state === 'thinking' ? t('ai.stateThinking') : t('ai.stateSpeaking')

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="grn" style={{ fontSize: 14 }}>●</span>
          <span className="t2">{t('ai.liveModel')}</span>
        </div>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} color="var(--text-mid-50)" />
        </button>
      </div>

      <img src="/crymadx-ai-full.png" alt="" style={{ width: 120, margin: '4px auto 0' }} />

      <div style={{ marginTop: 16 }}><AIVoiceOrb state={state} /></div>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 800, letterSpacing: 1 }}>{stateLabel}</div>
        <div className="t2" style={{ marginTop: 4 }}>{t('ai.tapInterrupt')}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 10, width: '100%' }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('ai.youLabel')}</div>
        <div style={{ fontSize: 14, color: 'var(--text-strong)', lineHeight: 1.5 }}>{t('ai.demoUserMsg')}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6, width: '100%', background: 'rgba(0,200,83,.05)', borderLeft: '3px solid var(--gl)' }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}><span style={{ color: 'var(--gl)' }}>{t('ai.aiLabel')}</span></div>
        <div style={{ fontSize: 14, color: 'var(--text-strong)', lineHeight: 1.5 }}>{t('ai.demoAiMsg')}</div>
      </div>

      <div style={{ display: 'flex', gap: 14, width: '100%', marginTop: 'auto', paddingTop: 14, alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => setMuted(m => !m)} style={{ background: 'none', border: 'none', textAlign: 'center', cursor: 'pointer' }}>
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
