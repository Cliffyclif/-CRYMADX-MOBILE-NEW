import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { Session, LoginEvent } from '../../mock/db'

type DeviceRow = { id: string; device: string; deviceIcon: 'phone' | 'grid' | 'globe'; os: string; lastActive: string }

const TABS = ['active', 'history', 'devices'] as const

export function Sessions() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('active')
  const { data } = useEndpoint<{ active: Session[]; history: LoginEvent[]; devices: DeviceRow[] }>('api.security.sessions.list')
  const revoke = useEndpointMutation('api.security.sessions.revoke', { invalidates: ['api.security.sessions.list'] })
  const revokeAll = useEndpointMutation('api.security.sessions.revoke-all', { invalidates: ['api.security.sessions.list'] })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('security.sessionsAndDevices')} />

      <div className="tabs">
        <button className={`tab ${tab === 'active' ? 'a' : ''}`} onClick={() => setTab('active')}>{t('security.tabActiveSessions')} ({data?.active.length ?? 0})</button>
        <button className={`tab ${tab === 'history' ? 'a' : ''}`} onClick={() => setTab('history')}>{t('security.tabHistory')}</button>
        <button className={`tab ${tab === 'devices' ? 'a' : ''}`} onClick={() => setTab('devices')}>{t('security.tabDevices')}</button>
      </div>

      {tab === 'active' && <>
        <h3 style={{ marginTop: 6 }}>{t('security.activeSessionsTitle')}</h3>
        {(data?.active?.length ?? 0) === 0 && (
          <div className="g" style={{ padding: 14, marginTop: 4, textAlign: 'center' }}><div className="t3">No active sessions found.</div></div>
        )}
        {data?.active?.map(s => (
          <div key={s.id} className="g" style={{ padding: 12, margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="li-i"><Icon name={s.deviceIcon as IconName} size={16} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, color: 'var(--text-strong)', fontWeight: 700 }}>
                  {s.device}
                  {s.isCurrent && <span className="badge badge-g" style={{ fontSize: 8 }}>{t('security.currentBadge')}</span>}
                </div>
                <div className="t3">{s.location}</div>
                <div className="t3" style={{ marginTop: 1, fontSize: 10 }}>{s.app}</div>
              </div>
              {!s.isCurrent && (
                <button className="grn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit' }} onClick={() => revoke.mutate({ pathParams: { sessionId: s.id } })}>{t('security.revoke')}</button>
              )}
            </div>
          </div>
        ))}
      </>}

      {tab === 'history' && <>
        <h3 style={{ marginTop: 6 }}>{t('security.loginHistoryTitle')}</h3>
        {(data?.history?.length ?? 0) === 0 && (
          <div className="g" style={{ padding: 14, marginTop: 4, textAlign: 'center' }}><div className="t3">No login history yet.</div></div>
        )}
        {data?.history?.map(e => {
          const ok = e.result === 'success'
          return (
            <div key={e.id} className="li">
              <div className="li-i" style={{ background: ok ? 'rgba(0,200,83,.1)' : 'rgba(239,68,68,.1)' }}>
                <Icon name={e.deviceIcon as IconName} size={12} color={ok ? 'var(--gl)' : 'var(--r)'} />
              </div>
              <div className="li-c">
                <div className="li-n" style={{ fontSize: 14 }}>{e.device}</div>
                <div className="li-s">{new Date(e.at).toLocaleString()}</div>
              </div>
              <div className="li-r">
                <span className={`badge badge-${ok ? 'g' : 'r'}`} style={{ fontSize: 9 }}>{ok ? t('security.successBadge') : t('security.failedBadge', { reason: e.failureReason })}</span>
              </div>
            </div>
          )
        })}
      </>}

      {tab === 'devices' && <>
        <h3 style={{ marginTop: 6 }}>{t('security.trustedDevicesTitle')}</h3>
        {(data?.devices?.length ?? 0) === 0 && (
          <div className="g" style={{ padding: 14, marginTop: 4, textAlign: 'center' }}><div className="t3">No trusted devices yet.</div></div>
        )}
        {data?.devices?.map(d => (
          <div key={d.id} className="li">
            <div className="li-i"><Icon name={d.deviceIcon as IconName} size={16} /></div>
            <div className="li-c">
              <div className="li-n">{d.device}</div>
              <div className="li-s">{d.os || d.lastActive}</div>
            </div>
            <div className="li-r"><span className="badge badge-g" style={{ fontSize: 9 }}>{t('security.trustedBadge')}</span></div>
          </div>
        ))}
      </>}

      <button
        className="btn btn-r"
        style={{ marginTop: 8 }}
        onClick={() => revokeAll.mutate({})}
        disabled={revokeAll.isPending || (data?.active?.length ?? 0) <= 1}
      >
        {revokeAll.isPending ? t('auth.verifying') : t('security.signOutAllOthers')}
      </button>
    </PhoneShell>
  )
}
