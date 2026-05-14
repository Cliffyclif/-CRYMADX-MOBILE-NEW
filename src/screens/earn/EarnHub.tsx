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
      <h2 style={{ marginBottom: 4 }}>{t('earn.title') || 'Earn'}</h2>
      <div className="t2" style={{ fontSize: 13 }}>Put your crypto to work — three battle-tested products.</div>

      {/* Hero stat — real total across all earning products */}
      <div
        className="g"
        style={{
          position: 'relative',
          padding: 22,
          marginTop: 16,
          background: 'linear-gradient(135deg, rgba(0,200,83,.10) 0%, rgba(0,200,83,.04) 60%, rgba(212,165,60,.06) 100%)',
          border: '1px solid rgba(0,200,83,.18)',
          borderRadius: 16,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: -40, right: -40,
            width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,83,.18) 0%, transparent 70%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
        <div className="t3" style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
          Your total earning balance
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: 'var(--gl)',
            margin: '10px 0 6px',
            textShadow: '0 0 24px rgba(0,200,83,.3)',
            letterSpacing: '-1px',
            lineHeight: 1.05,
          }}
        >
          ${totalEarning.toFixed(2)}
        </div>
        <div className="t3" style={{ fontSize: 12 }}>
          {totalPositions === 0
            ? "Nothing locked up yet — pick a product below to start earning."
            : `${totalPositions} active position${totalPositions === 1 ? '' : 's'} working for you`}
        </div>
      </div>

      {/* Product tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-mid-50)', marginBottom: 2 }}>
          Earning products
        </div>
        {TILES.map(tile => (
          <button
            key={tile.title}
            onClick={() => nav(ROUTES[tile.routeId].path)}
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,.025)',
              border: '1px solid rgba(255,255,255,.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
              fontFamily: 'Outfit',
              transition: 'all .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,83,.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,200,83,.18)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.025)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.06)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
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
                        : 'var(--text-mid-60)',
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
            <Icon name="arrow" size={14} color="var(--text-mid-60)" />
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
