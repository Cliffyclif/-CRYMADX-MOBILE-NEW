import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { StakingProduct, StakingPosition } from '../../mock/db'
import type { Balance } from '../../api/endpoints'

export function Staking() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<{ items: StakingProduct[] }>('api.earn.staking.products')
  const { data: positions } = useEndpoint<{ items: StakingPosition[] }>('api.earn.staking.positions')
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  // Staking stats endpoint returns USD totals (price-converted server-side via
  // Redis-cached token prices). Same numbers the website uses.
  const { data: stats } = useEndpoint<{
    totalStaked: number
    totalRewards: number
    avgApy: number
    positions: number
  }>('api.earn.staking.stats', {}, { refetchInterval: 60_000 })
  // Live token prices — used to enrich each individual position card with a
  // USD equivalent below the token amount (the backend's /positions response
  // returns stakedAmountUsd: '0' as a placeholder, so we compute client-side).
  const { data: priceRes } = useEndpoint<{ prices: { symbol: string; price: number }[] }>('api.prices.list', {}, { refetchInterval: 60_000 })
  const priceFor = (asset: string): number => {
    const list = priceRes?.prices ?? []
    const hit = list.find(p => p.symbol?.toUpperCase() === String(asset).toUpperCase())
    return hit?.price ?? 0
  }

  const [tab, setTab] = useState<'stake' | 'positions' | 'history'>('stake')
  const [protocol, setProtocol] = useState<string>('all')
  const [stakeAmount, setStakeAmount] = useState<Record<string, string>>({})
  const stake = useEndpointMutation('api.earn.staking.stake', { invalidates: ['api.earn.staking.positions', 'api.earn.staking.stats', 'api.wallet.balances.list'] })

  const protocols = Array.from(new Set((data?.items ?? []).map(p => p.protocol)))
  const filtered = (data?.items ?? []).filter(p => protocol === 'all' || p.protocol === protocol)
  // Prefer the server's USD totals (Redis-priced); fall back to a client-side
  // sum if the stats endpoint hasn't responded yet.
  const fallbackStakedUsd = positions?.items?.reduce(
    (s, p) => s + parseFloat(String(p.amount || '0')) * priceFor(p.asset), 0,
  ) ?? 0
  const fallbackRewardsUsd = positions?.items?.reduce(
    (s, p) => s + parseFloat(String(p.earned || '0')) * priceFor(p.asset), 0,
  ) ?? 0
  const totalStakedUsd = stats?.totalStaked ?? fallbackStakedUsd
  const totalEarnedUsd = stats?.totalRewards ?? fallbackRewardsUsd
  const posCount = stats?.positions ?? positions?.items?.length ?? 0

  const onStake = async (product: StakingProduct) => {
    const amount = stakeAmount[product.id] ?? ''
    if (!amount || parseFloat(amount) <= 0) return
    try {
      await stake.mutateAsync({ body: { productId: product.id, amount } })
      setStakeAmount(s => ({ ...s, [product.id]: '' }))
    } catch {}
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('earn.stakingTitle')} rightIcons={['refresh', 'search']} />
      <div className="t2">{t('earn.stakingSubtitle')}</div>

      <div className="hscroll" style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
        <button className={`tab ${protocol === 'all' ? 'a' : ''}`} onClick={() => setProtocol('all')}>{t('earn.tabAll')}</button>
        {protocols.map(p => (
          <button key={p} className={`tab ${protocol === p ? 'a' : ''}`} onClick={() => setProtocol(p)}>{p}</button>
        ))}
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>${totalStakedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div><div className="stat-l">{t('earn.stakedLabel')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 16 }}>+${totalEarnedUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div><div className="stat-l">{t('earn.rewardsLabel')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{posCount}</div><div className="stat-l">{t('earn.activeLabel')}</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        <button className={`tab ${tab === 'stake' ? 'a' : ''}`} onClick={() => setTab('stake')}>{t('earn.tabStake')}</button>
        <button className={`tab ${tab === 'positions' ? 'a' : ''}`} onClick={() => setTab('positions')}>{t('earn.tabPositions', { count: posCount })}</button>
      </div>

      {tab === 'stake' && (
        <>
          <h3 style={{ marginTop: 6 }}>{t('earn.availableAssets')}</h3>
          {filtered.map(p => {
            const myBal = bal?.items?.find(b => b.asset === p.asset)
            const a = stakeAmount[p.id] ?? ''
            return (
              <div key={p.id} className="g" style={{ padding: 10, margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CoinIcon symbol={p.asset} size={30} />
                  <div style={{ flex: 1 }}>
                    <div className="li-n">{p.protocol} · {p.asset}</div>
                    <div className="li-s">{t('earn.liquidLabel')} · {p.liquidToken} · {p.unbondingDays === 0 ? t('earn.instantUnstake') : t('earn.unbondDays', { n: p.unbondingDays })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="li-v grn" style={{ fontSize: 18, fontWeight: 800 }}>{p.apy}%</div>
                    <div className="li-d">{t('earn.apy')}</div>
                  </div>
                </div>
                <div className="inp" style={{ marginTop: 6, padding: 6 }}>
                  <input type="number" inputMode="decimal" placeholder={t('earn.stakeAsset', { asset: p.asset })} value={a} onChange={e => setStakeAmount(s => ({ ...s, [p.id]: e.target.value }))} style={{ flex: 1, fontSize: 15, color: 'var(--text-strong)' }} step="any" />
                  <span className="t3" style={{ marginLeft: 6 }}>{t('earn.availPrefix')} {myBal?.amount ?? '0'}</span>
                  <button className="btn btn-g" style={{ width: 'auto', padding: '4px 10px', margin: 0, fontSize: 13 }} onClick={() => onStake(p)} disabled={!a || stake.isPending}>
                    {t('earn.stake')}
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'positions' && (
        positions?.items?.length === 0
          ? <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('earn.noPositions')}</div></div>
          : positions?.items?.map(p => {
            // Prefer server-supplied USD if non-zero, else compute locally.
            const amountNum = parseFloat(String(p.amount || '0'))
            const earnedNum = parseFloat(String(p.earned || '0'))
            const px = priceFor(p.asset)
            const usdValue = (p as any).usdValue
              ? parseFloat(String((p as any).usdValue))
              : amountNum * px
            const earnedUsd = (p as any).earnedUsd
              ? parseFloat(String((p as any).earnedUsd))
              : earnedNum * px
            return (
              <button key={p.id} className="li" onClick={() => nav(ROUTES['route.earn.unstake'].path, { state: { positionId: p.id } })} style={{ width: '100%', textAlign: 'left' }}>
                <CoinIcon symbol={p.asset} size={32} />
                <div className="li-c">
                  <div className="li-n">{p.amount} {p.asset}</div>
                  <div className="li-s" style={{ fontSize: 11 }}>
                    ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {' · '}
                    {t('earn.earnedShort', { amount: p.earned, liquid: p.liquidAmount })}
                  </div>
                </div>
                <div className="li-r" style={{ textAlign: 'right' }}>
                  <div className="li-v grn">+{p.earned}</div>
                  {earnedUsd > 0 && (
                    <div className="t3" style={{ fontSize: 10, color: 'var(--gl)' }}>
                      ≈ ${earnedUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                  )}
                </div>
              </button>
            )
          })
      )}

      {tab === 'stake' && (
        <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => setTab('positions')}>
          <Icon name="zap" size={14} color="#fff" /> {t('earn.viewMyPositions')}
        </button>
      )}
    </PhoneShell>
  )
}
