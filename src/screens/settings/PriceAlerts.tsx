import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { PriceAlert } from '../../mock/db'

export function PriceAlerts() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<'active' | 'paused'>('active')
  const { data } = useEndpoint<{ items: PriceAlert[] }>('api.settings.alerts.list')
  const update = useEndpointMutation('api.settings.alerts.update', { invalidates: ['api.settings.alerts.list'] })

  const items = (data?.items ?? []).filter(a => tab === 'active' ? a.active : !a.active)
  const counts = { active: (data?.items ?? []).filter(a => a.active).length, paused: (data?.items ?? []).filter(a => !a.active).length }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('settings.priceAlerts')}</h2>
        <button onClick={() => nav(ROUTES['route.settings.alert-edit'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="plus" size={16} color="var(--gl)" />
        </button>
      </div>
      <div className="t2">{t('settings.getNotified')}</div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{counts.active}</div><div className="stat-l">{t('settings.active')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>12</div><div className="stat-l">{t('settings.triggered')}</div></div>
        <div className="stat"><div className="stat-v gld" style={{ fontSize: 18 }}>{counts.paused}</div><div className="stat-l">{t('settings.paused')}</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        <button className={`tab ${tab === 'active' ? 'a' : ''}`} onClick={() => setTab('active')}>{t('settings.tabActive')}</button>
        <button className={`tab ${tab === 'paused' ? 'a' : ''}`} onClick={() => setTab('paused')}>{t('settings.tabPaused')}</button>
      </div>

      {items.map(a => {
        return (
          <div key={a.id} className="li">
            <CoinIcon symbol={a.asset} size={30} />
            <div className="li-c">
              <div className="li-n">{a.asset} · {a.condition === 'above' ? t('settings.above') : t('settings.below')} ${a.thresholdValue}</div>
              <div className="li-s">{t('settings.currentlyWatching')}</div>
            </div>
            <div className="li-r">
              <button className={`tgl ${a.active ? 'on' : 'off'}`} onClick={() => update.mutate({ pathParams: { alertId: a.id }, body: { active: !a.active } })} aria-label="Toggle" />
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('settings.noAlertsTab', { tab: tab === 'active' ? t('settings.tabActiveLower') : t('settings.tabPausedLower') })}</div>
        </div>
      )}
    </PhoneShell>
  )
}
