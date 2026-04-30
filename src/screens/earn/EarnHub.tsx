import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, type RouteId } from '../../routes'
import { useEndpoint } from '../../api/hooks'
import type { SavingsPosition, StakingPosition } from '../../mock/db'

interface Tile {
  icon: IconName
  titleKey: string
  descKey: string
  badgeKey: string
  badgeVars?: Record<string, string | number>
  routeId: RouteId
  tone: 'g' | 'gd'
}

export function EarnHub() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: sav } = useEndpoint<{ items: SavingsPosition[] }>('api.earn.savings.positions')
  const { data: stk } = useEndpoint<{ items: StakingPosition[] }>('api.earn.staking.positions')

  const totalEarned = (sav?.items?.reduce((s, p) => s + parseFloat(p.earned || '0'), 0) ?? 0) + (stk?.items?.reduce((s, p) => s + parseFloat(p.earned || '0'), 0) ?? 0)
  const positions = (sav?.items?.length ?? 0) + (stk?.items?.length ?? 0)

  const TILES: Tile[] = [
    { icon: 'wallet',   titleKey: 'earn.tile_flexibleSavings', descKey: 'earn.tile_flexibleSavings_desc', badgeKey: 'earn.badge_productsCount', badgeVars: { count: 248 }, routeId: 'route.earn.savings',    tone: 'g'  },
    { icon: 'lock',     titleKey: 'earn.tile_lockedSavings',   descKey: 'earn.tile_lockedSavings_desc',   badgeKey: 'earn.badge_productsCount', badgeVars: { count: 120 }, routeId: 'route.earn.savings',    tone: 'gd' },
    { icon: 'zap',      titleKey: 'earn.tile_liquidStaking',   descKey: 'earn.tile_liquidStaking_desc',   badgeKey: 'earn.badge_protocols',     badgeVars: { count: 12 },  routeId: 'route.earn.staking',    tone: 'g'  },
    { icon: 'trend-up', titleKey: 'earn.tile_autoInvest',      descKey: 'earn.tile_autoInvest_desc',      badgeKey: 'earn.badge_active',                               routeId: 'route.earn.autoinvest', tone: 'g'  },
    { icon: 'target',   titleKey: 'earn.tile_vault',           descKey: 'earn.tile_vault_desc',           badgeKey: 'earn.badge_vaults',        badgeVars: { count: 24 },  routeId: 'route.earn.vault',      tone: 'gd' },
  ]

  return (
    <PhoneShell noTabs>
      <h2>{t('earn.title')}</h2>
      <div className="t2">{t('earn.subtitle')}</div>

      <div className="g" style={{ padding: 14, marginTop: 8 }}>
        <div className="t3">{t('earn.totalEarnings')}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gl)', margin: '4px 0' }}>+${totalEarned.toFixed(2)}</div>
        <div className="t3">{t('earn.acrossProducts', { count: positions })}</div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('earn.products')}</h3>
      {TILES.map(tile => (
        <button key={tile.titleKey} className="g" onClick={() => nav(ROUTES[tile.routeId].path)} style={{ padding: 12, margin: '4px 0', display: 'flex', alignItems: 'center', gap: 10, width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 38, height: 38, background: tile.tone === 'g' ? 'rgba(0,200,83,.12)' : 'rgba(212,165,60,.12)' }}>
            <Icon name={tile.icon} size={18} color={tile.tone === 'g' ? 'var(--gl)' : 'var(--gd)'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{t(tile.titleKey)}</div>
            <div className="t3" style={{ marginTop: 1 }}>{t(tile.descKey)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={`badge badge-${tile.tone}`} style={{ fontSize: 9 }}>{t(tile.badgeKey, tile.badgeVars)}</div>
            <div className="t3" style={{ fontSize: 14, marginTop: 2 }}>›</div>
          </div>
        </button>
      ))}

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">💡</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="grn">{t('earn.proTipPrefix')}</span> {t('earn.proTip')}
        </div>
      </div>
    </PhoneShell>
  )
}
