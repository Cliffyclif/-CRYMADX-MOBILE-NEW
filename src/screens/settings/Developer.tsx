import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, type RouteId } from '../../routes'
import type { APIKey } from '../../mock/db'

interface Row { icon: IconName; name: string; desc: string; right?: string; routeId?: RouteId }

export function Developer() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<{ items: APIKey[] }>('api.settings.api-keys.list')
  const totalCalls = (data?.items ?? []).reduce((s, k) => s + k.callsLast30d, 0)
  const callsM = `${(totalCalls / 1_000_000).toFixed(1)}M`

  const rows: Row[] = [
    { icon: 'key',      name: t('settings.rowApiKeys'),    desc: t('settings.rowApiKeysSub', { count: data?.items?.length ?? 0, expiring: (data?.items ?? []).filter(k => k.status === 'expiring').length }), routeId: 'route.settings.api-keys' },
    { icon: 'link',     name: t('settings.rowWebhooks'),   desc: t('settings.rowWebhooksSub') },
    { icon: 'settings', name: t('settings.rowSandbox'),    desc: t('settings.rowSandboxSub') },
    { icon: 'doc',      name: t('settings.rowApiDocs'),    desc: t('settings.rowApiDocsSub'), right: '↗' },
    { icon: 'chart',    name: t('settings.rowUsage'),      desc: t('settings.rowUsageSub', { used: callsM }) },
    { icon: 'globe',    name: t('settings.rowIp'),         desc: t('settings.rowIpSub') },
    { icon: 'shield',   name: t('settings.rowOauth'),      desc: t('settings.rowOauthSub') },
  ]

  const QUICK = [
    ['Postman Collection', 'One-click import'],
    ['SDK · Node.js',      'npm install crymadx'],
    ['SDK · Python',       'pip install crymadx'],
    ['SDK · Go',           'go get crymadx-go'],
    ['Status Page',        'status.crymadx.io'],
  ]

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.developer')} actions={<span className="badge badge-gd" style={{ fontSize: 10 }}>PRO</span>} />
      <div className="t2">{t('settings.devSubtitle')}</div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{data?.items?.length ?? 0}</div><div className="stat-l">{t('settings.statApiKeys')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>2</div><div className="stat-l">{t('settings.statWebhooks')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 15 }}>{callsM}</div><div className="stat-l">{t('settings.statCalls')}</div></div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('settings.apiAccessProOnly')} <span className="gld">{t('settings.proTierOnly')}</span> · {t('settings.sandboxFree')}</div>
      </div>

      {rows.map(r => (
        <button key={r.name} onClick={() => r.routeId && nav(ROUTES[r.routeId].path)} className="li" style={{ width: '100%', textAlign: 'left', cursor: r.routeId ? 'pointer' : 'default' }}>
          <div className="li-i"><Icon name={r.icon} size={16} /></div>
          <div className="li-c">
            <div className="li-n">{r.name}</div>
            <div className="li-s">{r.desc}</div>
          </div>
          <div className="li-r" style={{ color: 'var(--text-mid-40)' }}>{r.right ?? '›'}</div>
        </button>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('settings.quickLinks')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {QUICK.map(([n, d]) => (
          <div key={n} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 8 }}>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{n}</div>
              <div className="li-s">{d}</div>
            </div>
            <div className="li-r"><Icon name="ext" size={12} color="var(--gl)" /></div>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}
