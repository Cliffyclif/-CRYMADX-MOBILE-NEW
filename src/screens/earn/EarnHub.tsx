import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES, type RouteId } from '../../routes'
import { useEndpoint } from '../../api/hooks'

interface VaultPos { id: string; asset: string; amount: string; usdValue?: string }
interface StakingPos { id: string; asset: string; amount: string; usdValue?: string }
interface AutoInvestPlan { id?: string; isActive?: boolean; status?: string }

/**
 * Earn hub — three real products: Vault, Staking, Auto-Invest.
 * The legacy Aave/USDC "Flexible Savings" + "Locked Savings" tiles were
 * deleted backend-side in 2026-03-08; only the vault mechanism remains.
 * No hardcoded counts here — every number comes from the live endpoints.
 */
export function EarnHub() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const { data: vaultRes }    = useEndpoint<{ items: VaultPos[] }>('api.earn.vault.list')
  const { data: stkRes }      = useEndpoint<{ items: StakingPos[] }>('api.earn.staking.positions')
  const { data: autoRes }     = useEndpoint<{ items: AutoInvestPlan[] }>('api.earn.autoinvest.list')

  const vaultPositions    = vaultRes?.items ?? []
  const stakingPositions  = stkRes?.items ?? []
  const autoInvestPlans   = autoRes?.items ?? []
  const activePlans       = autoInvestPlans.filter(p => p.isActive ?? p.status === 'active').length

  // Total USD value across all earning products.
  const sumUsd = (rows: { usdValue?: string }[]) =>
    rows.reduce((s, r) => s + (parseFloat(String(r.usdValue ?? '0').replace(/,/g, '')) || 0), 0)
  const totalEarning = sumUsd(vaultPositions) + sumUsd(stakingPositions)

  const TILES: Array<{
    icon: IconName
    title: string
    desc: string
    badge: string
    badgeTone: 'g' | 'gd' | 'i'
    routeId: RouteId
    accent: string
  }> = [
    {
      icon: 'lock',
      title: t('earn.tile_vault') || 'Vault',
      desc: t('earn.tile_vault_desc') || 'Lock crypto, earn yield, fixed or flexible',
      badge: vaultPositions.length > 0 ? `${vaultPositions.length} active` : 'Open',
      badgeTone: vaultPositions.length > 0 ? 'g' : 'i',
      routeId: 'route.earn.vault',
      accent: 'rgba(0,200,83,.12)',
    },
    {
      icon: 'zap',
      title: t('earn.tile_liquidStaking') || 'Staking',
      desc: t('earn.tile_liquidStaking_desc') || 'Stake ETH, MATIC, AVAX and more',
      badge: stakingPositions.length > 0 ? `${stakingPositions.length} staked` : 'Open',
      badgeTone: stakingPositions.length > 0 ? 'g' : 'i',
      routeId: 'route.earn.staking',
      accent: 'rgba(212,165,60,.12)',
    },
    {
      icon: 'trend-up',
      title: t('earn.tile_autoInvest') || 'Auto-Invest',
      desc: t('earn.tile_autoInvest_desc') || 'Recurring DCA into your favourite assets',
      badge: activePlans > 0 ? `${activePlans} active` : 'Open',
      badgeTone: activePlans > 0 ? 'g' : 'i',
      routeId: 'route.earn.autoinvest',
      accent: 'rgba(0,200,83,.12)',
    },
  ]

  const totalPositions = vaultPositions.length + stakingPositions.length + activePlans

  return (
    <PhoneShell noTabs>
      <h2>{t('earn.title') || 'Earn'}</h2>
      <div className="t2">{t('earn.subtitle') || 'Put your crypto to work'}</div>

      {/* Hero stat — real total across all earning products */}
      <div
        className="g"
        style={{
          padding: 18,
          marginTop: 12,
          background: 'linear-gradient(135deg, rgba(0,200,83,.06), rgba(212,165,60,.04))',
          border: '1px solid rgba(0,200,83,.1)',
          textAlign: 'center',
        }}
      >
        <div className="t3" style={{ fontSize: 11, letterSpacing: '.5px', textTransform: 'uppercase' }}>
          {t('earn.totalEarning') || 'Total earning'}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--gl)',
            margin: '8px 0 4px',
            textShadow: '0 0 20px rgba(0,200,83,.2)',
          }}
        >
          ${totalEarning.toFixed(2)}
        </div>
        <div className="t3" style={{ fontSize: 12 }}>
          {totalPositions === 0
            ? 'No active positions yet — pick a product below to start'
            : `${totalPositions} active position${totalPositions === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Product tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {TILES.map(tile => (
          <button
            key={tile.title}
            onClick={() => nav(ROUTES[tile.routeId].path)}
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(0,200,83,.04)',
              border: '1px solid rgba(255,255,255,.04)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
              fontFamily: 'Outfit',
              transition: 'background .12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,83,.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,83,.04)' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: tile.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={tile.icon} size={20} color="var(--gl)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {tile.title}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background:
                      tile.badgeTone === 'g'
                        ? 'rgba(0,200,83,.16)'
                        : tile.badgeTone === 'gd'
                        ? 'rgba(212,165,60,.16)'
                        : 'rgba(255,255,255,.06)',
                    color:
                      tile.badgeTone === 'g'
                        ? 'var(--gl)'
                        : tile.badgeTone === 'gd'
                        ? 'var(--gd)'
                        : 'var(--text-mid)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.6px',
                  }}
                >
                  {tile.badge}
                </span>
              </div>
              <div className="t3" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                {tile.desc}
              </div>
            </div>
            <Icon name="arrow" size={14} color="var(--text-mid)" />
          </button>
        ))}
      </div>

      <div
        className="g"
        style={{
          padding: 12,
          marginTop: 14,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          borderLeft: '3px solid var(--gl)',
          background: 'rgba(0,200,83,.04)',
        }}
      >
        <Icon name="zap" size={16} color="var(--gl)" />
        <div className="t3" style={{ fontSize: 12, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--gl)' }}>Tip:</strong>{' '}
          Vault gives you fixed-term yield. Staking unlocks liquidity tokens you
          can still trade. Auto-Invest dollar-cost-averages on a schedule.
        </div>
      </div>
    </PhoneShell>
  )
}
