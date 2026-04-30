import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { AISettings } from '../../mock/db'

export function AIPinSettings() {
  const { t } = useTranslation()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')
  const update = useEndpointMutation('api.ai.settings.update', { invalidates: ['api.ai.settings.get'] })

  if (!s) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const set = (key: keyof AISettings, value: unknown) => update.mutate({ body: { [key]: value } })

  const toggles: Array<[IconName, keyof AISettings, string, string]> = [
    ['shield', 'biometricForActions', t('ai.biometricActions'),  t('ai.biometricActionsSub')],
    ['lock',   'pinForEverySend',     t('ai.pinEverySend'),       t('ai.pinEverySendSub')],
    ['eye',    'showPinOnColdStart',  t('ai.pinColdStart'),       t('ai.pinColdStartSub')],
  ]

  const ttlDisplay = s.pinTokenTtlMin >= 60 ? t('ai.pinHrs', { n: (s.pinTokenTtlMin / 60).toFixed(1) }) : t('ai.pinMins', { n: s.pinTokenTtlMin })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.aiPinPolicy')} />

      <div className="g" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          {t('ai.ttlNote')}
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.pinTtlHeader')}</h3>
      <div className="g" style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
          <span className="t2">{t('ai.autoRelock')}</span>
          <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{ttlDisplay}</span>
        </div>
        <input
          type="range" min={5} max={1440} step={5} value={s.pinTokenTtlMin}
          onChange={e => set('pinTokenTtlMin', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gl)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', marginTop: 2 }}>
          <span>5 min</span><span>1h</span><span>4h</span><span>24h</span>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.perActionPolicy')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {toggles.map(([icon, key, name, desc]) => (
          <div key={key} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
            <div className="li-i"><Icon name={icon} size={16} /></div>
            <div className="li-c">
              <div className="li-n">{name}</div>
              <div className="li-s">{desc}</div>
            </div>
            <button className={`tgl ${(s[key] as boolean) ? 'on' : 'off'}`} onClick={() => set(key, !(s[key] as boolean))} aria-label={name} />
          </div>
        ))}
        <div className="li" style={{ margin: 0, borderRadius: 0, boxShadow: 'none', background: 'transparent' }}>
          <div className="li-i"><Icon name="pin" size={16} /></div>
          <div className="li-c">
            <div className="li-n">{t('ai.pinForSwaps')}</div>
            <div className="li-s">{t('ai.currentlyDollar', { n: s.pinThresholdSwapUsd })}</div>
          </div>
          <div className="li-r" style={{ fontSize: 14, color: 'var(--text-mid-40)' }}>›</div>
        </div>
      </div>

      <button className="btn btn-o" style={{ marginTop: 10 }}>
        <Icon name="refresh" size={14} /> {t('ai.resetAiPin')}
      </button>
    </PhoneShell>
  )
}
