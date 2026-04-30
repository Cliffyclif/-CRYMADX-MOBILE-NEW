import { useState } from 'react'
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

export function Wallet() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [hideZero, setHideZero] = useState(false)
  const hidden = usePrivacy(s => s.hidden)
  const togglePrivacy = usePrivacy(s => s.toggle)
  const { data, refetch, isFetching } = useEndpoint<{ total: string; change24h: string; changeAbs: string; btcEquivalent?: string; items: Balance[] }>('api.wallet.balances.list')

  const items = (data?.items ?? []).filter(b => !hideZero || parseFloat(b.amount) > 0)

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
          <div className="t3">{t('wallet.totalBalance')}</div>
          <button
            onClick={togglePrivacy}
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
          >
            <Icon name="eye" size={14} color={hidden ? 'var(--gl)' : 'var(--text-mid-30)'} />
          </button>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>
          {hidden ? '••••••' : `$${data?.total ?? '0.00'}`}
        </div>
        <div className="t3">
          ≈ {hidden ? '••••' : (data?.btcEquivalent ?? '0')} BTC
          {data && !hidden && parseFloat(data.total) > 0 && (
            <> · <span className={parseFloat(data.change24h) >= 0 ? 'grn' : 'red'}>{data.change24h}%</span></>
          )}
        </div>
      </div>

      <div className="tabs">
        <div className="tab a">Funding</div>
        <div className="tab">Earn</div>
        <div className="tab">Trading</div>
      </div>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.deposit-pick'].path)}><Icon name="dl" size={18} /><span>{t('wallet.deposit')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.withdraw'].path)}><Icon name="arrow" size={18} /><span>{t('wallet.withdraw')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.convert'].path)}><Icon name="swap" size={18} /><span>{t('wallet.convert')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.fiat.buy'].path)}><Icon name="dollar" size={18} /><span>{t('wallet.buy')}</span></button>
      </div>

      <div className="inp" style={{ fontSize: 13 }}>
        <Icon name="search" size={14} />
        <input placeholder={t('wallet.searchAssets') as string} style={{ flex: 1 }} />
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-mid-30)' }}>{t('wallet.hideZero')}</span>
        <button className={`tgl ${hideZero ? 'on' : 'off'}`} onClick={() => setHideZero(z => !z)} style={{ marginLeft: 4 }} aria-label="Hide zero balances" />
      </div>

      {items.map(b => (
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
    </PhoneShell>
  )
}
