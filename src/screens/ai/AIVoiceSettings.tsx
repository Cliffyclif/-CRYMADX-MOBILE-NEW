import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { AISettings } from '../../mock/db'

const VOICES = [
  { id: 'Mira',  desc: 'Warm · Female',    locale: 'en-US' },
  { id: 'Nova',  desc: 'Bright · Female',  locale: 'en-US' },
  { id: 'Kai',   desc: 'Calm · Male',      locale: 'en-US' },
  { id: 'Atlas', desc: 'Deep · Male',      locale: 'en-GB' },
  { id: 'Aria',  desc: 'Soft · Neutral',   locale: 'multi' },
]

export function AIVoiceSettings() {
  const { t } = useTranslation()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')
  const update = useEndpointMutation('api.ai.settings.update', { invalidates: ['api.ai.settings.get'] })

  if (!s) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const set = (key: keyof AISettings, value: unknown) => update.mutate({ body: { [key]: value } })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.voiceSettingsHeader')} />

      <h3>{t('ai.voiceHeader')}</h3>
      {VOICES.map(v => {
        const active = s.voice === v.id
        return (
          <button key={v.id} className="li" onClick={() => set('voice', v.id)} style={{ width: '100%', textAlign: 'left' }}>
            <div className="li-i" style={{ background: active ? 'rgba(0,200,83,.15)' : undefined }}>
              <Icon name="volume" size={16} />
            </div>
            <div className="li-c">
              <div className="li-n">{v.id}</div>
              <div className="li-s">{v.desc}</div>
            </div>
            <div className="li-r" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-g" style={{ fontSize: 9 }}>{v.locale}</span>
              <Icon name={active ? 'check' : 'play'} size={14} color={active ? 'var(--gl)' : undefined} />
            </div>
          </button>
        )
      })}

      <h3 style={{ marginTop: 10 }}>{t('ai.speechHeader')}</h3>
      <div className="g" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span className="t2">{t('ai.speed')}</span>
          <span style={{ color: 'var(--text-strong)' }}>{s.voiceSpeed.toFixed(1)}x</span>
        </div>
        <input type="range" min={0.5} max={2.0} step={0.1} value={s.voiceSpeed} onChange={e => set('voiceSpeed', parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--gl)' }} />
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
