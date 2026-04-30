import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { APIKey } from '../../mock/db'

export function ApiKeys() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<{ items: APIKey[] }>('api.settings.api-keys.list')
  const remove = useEndpointMutation('api.settings.api-keys.delete', { invalidates: ['api.settings.api-keys.list'] })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.apiKeys')} actions={<Icon name="plus" size={16} color="var(--gl)" />} />
      <div className="t2">{t('settings.manageProgAccess')}</div>

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--r)' }}>
        <span className="red">🔒</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="red">{t('settings.neverShareKeys')}</span> {t('settings.treatLikePasswords')}
        </div>
      </div>

      {data?.items?.map(k => {
        const tone = k.status === 'live' ? 'g' : k.status === 'expiring' ? 'r' : 'gd'
        const tint = tone === 'g' ? '0,200,83' : tone === 'r' ? '239,68,68' : '212,165,60'
        const color = tone === 'g' ? 'var(--gl)' : tone === 'r' ? 'var(--r)' : 'var(--gd)'
        return (
          <button key={k.id} onClick={() => nav(routeFor('route.settings.api-key', { keyId: k.id }))} className="g" style={{ padding: 12, margin: '6px 0', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
                <Icon name="key" size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{k.name}</div>
                <div className="t3" style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 1 }}>{k.publicKey.slice(0, 22)}...</div>
              </div>
              <span className={`badge badge-${tone}`} style={{ fontSize: 8 }}>{k.status === 'live' ? t('settings.statusLive') : k.status === 'test' ? t('settings.statusTest') : t('settings.statusExpiring')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
              <div>
                <div className="t3">{t('settings.scopesLabel')}</div>
                <div style={{ color: 'var(--text-strong)', marginTop: 1 }}>
                  {[k.scopes.read && t('settings.scopeRead'), k.scopes.trade && t('settings.scopeTrade'), k.scopes.withdraw && t('settings.scopeWithdraw'), k.scopes.manage && t('settings.scopeManage')].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="t3">{t('settings.usageLabel')}</div>
                <div style={{ color: 'var(--text-strong)', marginTop: 1 }}>{t('settings.callsPerMonth', { n: k.callsLast30d.toLocaleString() })}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <Icon name="eye"     size={12} color="var(--text-mid-40)" />
              <Icon name="copy"    size={12} color="var(--text-mid-40)" />
              <Icon name="refresh" size={12} color="var(--text-mid-40)" />
              <button onClick={(e) => { e.stopPropagation(); remove.mutate({ pathParams: { keyId: k.id } }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <Icon name="trash" size={12} color="var(--r)" />
              </button>
            </div>
          </button>
        )
      })}
    </PhoneShell>
  )
}
