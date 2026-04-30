import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import { usePrivacy, maskIfHidden } from '../../stores/privacy'
import type { Balance } from '../../api/endpoints'

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether USD', USDC: 'USD Coin',
  SOL: 'Solana', MATIC: 'Polygon', BNB: 'BNB', XRP: 'XRP', ADA: 'Cardano',
  DOGE: 'Dogecoin', DOT: 'Polkadot', AVAX: 'Avalanche', LINK: 'Chainlink',
  TRX: 'TRON', LTC: 'Litecoin', BCH: 'Bitcoin Cash', XLM: 'Stellar',
  ATOM: 'Cosmos', NEAR: 'NEAR Protocol', TON: 'Toncoin', SUI: 'Sui',
  ARB: 'Arbitrum', OP: 'Optimism', SHIB: 'Shiba Inu', PEPE: 'Pepe',
}

type Tab = 'funding' | 'earn' | 'trading'

interface SavingsPosition { id: string; asset: string; amount: string; usdValue?: string; apy?: string; productName?: string }
interface StakingPosition { id: string; asset: string; amount: string; usdValue?: string; apy?: string; tier?: string; positionId?: string }
interface VaultPosition { id: string; asset: string; amount: string; usdValue?: string; plan?: string; lockedUntil?: string }
interface OpenOrder { id: string; pair: string; side: 'buy' | 'sell'; type: string; price: string; amount: string; filled?: string; status: string; createdAt: string }

export function Wallet() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('funding')
  const [hideZero, setHideZero] = useState(false)
  const [search, setSearch] = useState('')
  const hidden = usePrivacy(s => s.hidden)
  const togglePrivacy = usePrivacy(s => s.toggle)

  // Funding (default view) — main spot balances
  const { data, refetch, isFetching } = useEndpoint<{ total: string; change24h: string; changeAbs: string; btcEquivalent?: string; items: Balance[] }>('api.wallet.balances.list')

  // Earn — only fetched when the Earn tab is opened
  const { data: savingsRes }  = useEndpoint<{ items: SavingsPosition[] }>('api.earn.savings.positions',  {}, { enabled: tab === 'earn' })
  const { data: stakingRes }  = useEndpoint<{ items: StakingPosition[] }>('api.earn.staking.positions',  {}, { enabled: tab === 'earn' })
  const { data: vaultRes }    = useEndpoint<{ items: VaultPosition[]   }>('api.earn.vault.list',          {}, { enabled: tab === 'earn' })

  // Trading — open orders, only fetched when Trading tab is opened
  const { data: openOrdersRes } = useEndpoint<{ items: OpenOrder[] }>('api.trading.orders.open', {}, { enabled: tab === 'trading', refetchInterval: tab === 'trading' ? 10_000 : false })

  // Filtered funding list
  const fundingItems = useMemo(() => {
    let list = data?.items ?? []
    if (hideZero) list = list.filter(b => parseFloat(b.amount) > 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.asset.toLowerCase().includes(q) ||
        (ASSET_NAMES[b.asset] ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [data?.items, hideZero, search])

  // Earn aggregate — flatten the three position types into one list with type tags
  const earnItems = useMemo(() => {
    const out: Array<{ id: string; asset: string; amount: string; usdValue?: string; tag: string; tagColor: string; apy?: string; href?: string }> = []
    for (const s of savingsRes?.items ?? []) {
      out.push({ id: 's_' + s.id, asset: s.asset, amount: s.amount, usdValue: s.usdValue, tag: 'Savings', tagColor: 'g', apy: s.apy, href: ROUTES['route.earn.savings'].path })
    }
    for (const st of stakingRes?.items ?? []) {
      out.push({ id: 'k_' + (st.positionId ?? st.id), asset: st.asset, amount: st.amount, usdValue: st.usdValue, tag: st.tier ? `Staking · ${st.tier}` : 'Staking', tagColor: 'gd', apy: st.apy, href: ROUTES['route.earn.staking'].path })
    }
    for (const v of vaultRes?.items ?? []) {
      const days = v.lockedUntil ? Math.max(0, Math.ceil((new Date(v.lockedUntil).getTime() - Date.now()) / 86_400_000)) : null
      out.push({ id: 'v_' + v.id, asset: v.asset, amount: v.amount, usdValue: v.usdValue, tag: v.plan ? `Vault · ${v.plan}` : 'Vault', tagColor: 'g', apy: days != null ? `${days}d left` : undefined, href: ROUTES['route.earn.vault'].path })
    }
    return out
  }, [savingsRes?.items, stakingRes?.items, vaultRes?.items])

  // Trading open orders — locked balances in unfilled limit orders
  const tradingItems = openOrdersRes?.items ?? []

  // Derived totals shown in the pill header
  const earnTotalUsd = useMemo(() => earnItems.reduce((s, x) => s + parseFloat((x.usdValue ?? '0').replace(/,/g, '')), 0), [earnItems])
  const tradingLockedUsd = useMemo(() =>
    tradingItems.reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseFloat(o.amount) || 0), 0),
  [tradingItems])

  return (
    <PhoneShell bottomNav={<BottomNav />} onRefresh={async () => { await refetch() }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('wallet.title')}</h2>
        <button onClick={() => refetch()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
          <Icon name="refresh" size={16} color={isFetching ? 'var(--gl)' : undefined} />
        </button>
      </div>

      <div className="g" style={{ padding: 14, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="t3">
            {tab === 'funding' ? t('wallet.totalBalance') : tab === 'earn' ? 'Earn balance' : 'Trading locked'}
          </div>
          <button onClick={togglePrivacy} aria-label={hidden ? 'Show balance' : 'Hide balance'} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
            <Icon name="eye" size={14} color={hidden ? 'var(--gl)' : 'var(--text-mid-30)'} />
          </button>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>
          {hidden ? '••••••' : `$${
            tab === 'funding' ? (data?.total ?? '0.00')
            : tab === 'earn' ? earnTotalUsd.toFixed(2)
            : tradingLockedUsd.toFixed(2)
          }`}
        </div>
        {tab === 'funding' && (
          <div className="t3">
            ≈ {hidden ? '••••' : (data?.btcEquivalent ?? '0')} BTC
            {data && !hidden && parseFloat(data.total) > 0 && (
              <> · <span className={parseFloat(data.change24h) >= 0 ? 'grn' : 'red'}>{data.change24h}%</span></>
            )}
          </div>
        )}
        {tab === 'earn' && (
          <div className="t3">{earnItems.length} active position{earnItems.length === 1 ? '' : 's'}</div>
        )}
        {tab === 'trading' && (
          <div className="t3">{tradingItems.length} open order{tradingItems.length === 1 ? '' : 's'}</div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'funding' ? 'a' : ''}`} onClick={() => setTab('funding')}>Funding</button>
        <button className={`tab ${tab === 'earn' ? 'a' : ''}`} onClick={() => setTab('earn')}>Earn</button>
        <button className={`tab ${tab === 'trading' ? 'a' : ''}`} onClick={() => setTab('trading')}>Trading</button>
      </div>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.deposit-pick'].path)}><Icon name="dl" size={18} /><span>{t('wallet.deposit')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.withdraw'].path)}><Icon name="arrow" size={18} /><span>{t('wallet.withdraw')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.convert'].path)}><Icon name="swap" size={18} /><span>{t('wallet.convert')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.fiat.buy'].path)}><Icon name="dollar" size={18} /><span>{t('wallet.buy')}</span></button>
      </div>

      {/* ── Funding tab ───────────────────────────────────────── */}
      {tab === 'funding' && (
        <>
          <div className="inp" style={{ fontSize: 13 }}>
            <Icon name="search" size={14} />
            <input
              placeholder={t('wallet.searchAssets') as string}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-mid-30)' }}>{t('wallet.hideZero')}</span>
            <button className={`tgl ${hideZero ? 'on' : 'off'}`} onClick={() => setHideZero(z => !z)} style={{ marginLeft: 4 }} aria-label="Hide zero balances" />
          </div>

          {fundingItems.length === 0 ? (
            <div className="g" style={{ padding: 14, textAlign: 'center', marginTop: 8 }}>
              <div className="t3">{search ? `No assets match "${search}"` : 'No assets yet — deposit to get started'}</div>
            </div>
          ) : fundingItems.map(b => (
            <button key={b.id} className="li" onClick={() => nav(routeFor('route.wallet.asset', { symbol: b.asset }))} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <CoinIcon symbol={b.asset} size={32} />
              <div className="li-c">
                <div className="li-n">{b.asset}</div>
                <div className="li-s">{ASSET_NAMES[b.asset] ?? b.asset}</div>
              </div>
              <div className="li-r">
                <div className="li-v">{hidden ? '••••' : `$${b.usdValue}`}</div>
                <div className="li-d">{maskIfHidden(b.amount, hidden)}</div>
              </div>
            </button>
          ))}
        </>
      )}

      {/* ── Earn tab ───────────────────────────────────────────── */}
      {tab === 'earn' && (
        earnItems.length === 0 ? (
          <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 30 }}>💰</div>
            <div className="t2" style={{ marginTop: 4 }}>No earn positions yet</div>
            <div className="t3" style={{ marginTop: 4 }}>Stake, save, or lock in a vault to earn rewards.</div>
            <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => nav(ROUTES['route.earn.hub'].path)}>
              <Icon name="zap" size={12} color="#fff" /> Browse Earn products
            </button>
          </div>
        ) : earnItems.map(p => (
          <button key={p.id} className="li" onClick={() => p.href && nav(p.href)} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <CoinIcon symbol={p.asset} size={32} />
            <div className="li-c">
              <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.asset}
                <span className={`badge badge-${p.tagColor}`} style={{ fontSize: 9 }}>{p.tag}</span>
              </div>
              <div className="li-s">{p.apy ?? ''}</div>
            </div>
            <div className="li-r">
              <div className="li-v">{hidden ? '••••' : `$${p.usdValue ?? '0.00'}`}</div>
              <div className="li-d">{maskIfHidden(p.amount, hidden)}</div>
            </div>
          </button>
        ))
      )}

      {/* ── Trading tab ────────────────────────────────────────── */}
      {tab === 'trading' && (
        tradingItems.length === 0 ? (
          <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 30 }}>📊</div>
            <div className="t2" style={{ marginTop: 4 }}>No open orders</div>
            <div className="t3" style={{ marginTop: 4 }}>Limit orders waiting to fill will appear here with the assets they have locked.</div>
            <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => nav(ROUTES['route.tab.markets'].path)}>
              <Icon name="chart" size={12} color="#fff" /> Open Markets
            </button>
          </div>
        ) : tradingItems.map(o => {
          const [base, quote] = o.pair.split('/')
          const total = (parseFloat(o.price) * parseFloat(o.amount)).toFixed(2)
          const sideColor = o.side === 'buy' ? 'var(--gl)' : 'var(--r)'
          return (
            <button key={o.id} className="li" onClick={() => nav(routeFor('route.trading.spot', { pair: o.pair }))} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <CoinIcon symbol={base} size={32} />
              <div className="li-c">
                <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {o.pair}
                  <span className="badge" style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', color: sideColor, border: `1px solid ${sideColor}33`, padding: '2px 6px' }}>
                    {o.side.toUpperCase()} · {o.type}
                  </span>
                </div>
                <div className="li-s">@{o.price} · {new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="li-r">
                <div className="li-v">{hidden ? '••••' : `${o.amount} ${base}`}</div>
                <div className="li-d">{hidden ? '••••' : `≈ $${total} ${quote}`}</div>
              </div>
            </button>
          )
        })
      )}
    </PhoneShell>
  )
}
