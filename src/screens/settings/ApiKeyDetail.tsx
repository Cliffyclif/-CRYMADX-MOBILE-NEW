import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { APIKey } from '../../mock/db'

export function ApiKeyDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { keyId = '' } = useParams()
  const { data: list } = useEndpoint<{ items: APIKey[] }>('api.settings.api-keys.list')
  const key = list?.items?.find(k => k.id === keyId)
  const [revealed, setRevealed] = useState(false)
  const remove = useEndpointMutation('api.settings.api-keys.delete', { invalidates: ['api.settings.api-keys.list'] })

  if (!key) return <PhoneShell noTabs><ScreenHeader title={t('settings.keyDetailHeader')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const usagePct = (key.callsLast30d / key.callsQuotaMonthly) * 100

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.keyDetailHeader')} />

      <div className="g" style={{ padding: 14 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('settings.keyName')}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>{key.name}</div>
        <div className={`badge badge-${key.status === 'live' ? 'g' : key.status === 'expiring' ? 'r' : 'gd'}`} style={{ marginTop: 6, fontSize: 10 }}>{key.status.toUpperCase()}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('settings.publicKeyVisible')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.2)', padding: 8, borderRadius: 8 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-strong)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{key.publicKey}</div>
          <button onClick={() => navigator.clipboard.writeText(key.publicKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="copy" size={12} color="var(--gl)" />
          </button>
        </div>

        <div className="t3" style={{ margin: '8px 0 4px' }}>{t('settings.secretKeyOnce')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,.04)', padding: 8, borderRadius: 8, border: '1px solid rgba(239,68,68,.1)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-mid-40)', flex: 1 }}>{revealed ? key.secretKeyPreview : 'sk_live_••••••••••••••••••••'}</div>
          <button className="grn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 13 }} onClick={() => setRevealed(r => !r)}>{revealed ? t('settings.hide') : t('settings.reveal')}</button>
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('settings.scopesLabel')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {[
          [t('settings.scopeReadDesc'),     key.scopes.read],
          [t('settings.scopeTradeDesc'),    key.scopes.trade],
          [t('settings.scopeWithdrawDesc'), key.scopes.withdraw],
          [t('settings.scopeManageDesc'),   key.scopes.manage],
        ].map(([n, on]) => (
          <div key={n as string} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10 }}>
            <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{n}</div></div>
            <button className={`tgl ${on ? 'on' : 'off'}`} aria-label={n as string} />
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 8 }}>{t('settings.ipAllowlist')}</h3>
      <div className="g" style={{ padding: 8 }}>
        <div className="t3" style={{ lineHeight: 1.5 }}>
          {key.ipAllowlist.length > 0 ? key.ipAllowlist.map(ip => <div key={ip}>{ip}</div>) : t('settings.noRestrictions')}
        </div>
        <div className="grn" style={{ marginTop: 4, fontSize: 13, cursor: 'pointer' }}>{t('settings.addIp')}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3">{t('settings.last7Days', { n: key.callsLast30d.toLocaleString() })}</div>
        <div className="bar" style={{ marginTop: 4 }}><div className="fl" style={{ width: `${usagePct}%` }} /></div>
        <div className="t3" style={{ marginTop: 2, fontSize: 10 }}>{t('settings.monthlyQuota', { pct: usagePct.toFixed(0), quota: (key.callsQuotaMonthly / 1_000_000).toFixed(0) })}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }}><Icon name="refresh" size={10} /> {t('settings.rotateBtn')}</button>
        <button className="btn btn-r" style={{ flex: 1, padding: 9, margin: 0, fontSize: 13 }} onClick={() => { remove.mutate({ pathParams: { keyId } }); nav(ROUTES['route.settings.api-keys'].path) }}>{t('settings.revokeBtn')}</button>
      </div>
    </PhoneShell>
  )
}
