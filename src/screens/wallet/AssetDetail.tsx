import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { Balance, Transaction } from '../../api/endpoints'

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether USD', USDC: 'USD Coin',
  SOL: 'Solana', MATIC: 'Polygon', BNB: 'BNB', XRP: 'XRP', ADA: 'Cardano',
  DOGE: 'Dogecoin', DOT: 'Polkadot', AVAX: 'Avalanche', LINK: 'Chainlink',
  TRX: 'TRON', LTC: 'Litecoin', BCH: 'Bitcoin Cash', XLM: 'Stellar',
}

const INTERVALS = ['1H', '1D', '1W', '1M', '1Y', 'All'] as const

export function AssetDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { symbol = 'BTC' } = useParams()
  const upper = symbol.toUpperCase()

  const { data: bal } = useEndpoint<Balance>('api.wallet.balance.get', { pathParams: { asset: upper } })
  const { data: pair } = useEndpoint<{ price: string; change24h: string; volume24h: string; high24h: string; low24h: string }>('api.markets.pair', { pathParams: { pair: upper } })
  const { data: txs } = useEndpoint<{ items: Transaction[] }>('api.tx.list')

  const [interval, setInterval] = useState<typeof INTERVALS[number]>('1D')
  const positive = pair && !pair.change24h.startsWith('-')

  const recent = txs?.items?.filter(tx => tx.asset === upper || tx.asset.startsWith(upper + '→') || tx.asset.endsWith('→' + upper)).slice(0, 4) ?? []

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={ASSET_NAMES[upper] ?? upper} actions={<Icon name="star" size={16} color="var(--gd)" />} />

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CoinIcon symbol={upper} size={36} />
          <div style={{ flex: 1 }}>
            <div className="t3">{t('wallet.yourBalance')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)' }}>{bal?.amount ?? '0.0'} {upper}</div>
            <div className="t3">≈ ${bal?.usdValue ?? '0.00'}</div>
          </div>
          {pair && (
            <span className="badge badge-g" style={{ fontSize: 11 }}>
              {positive ? '+' : ''}{pair.change24h}% {positive ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.withdraw'].path)}><Icon name="send" size={16} /><span>{t('home.send')}</span></button>
        <button className="qa-b" onClick={() => nav(routeFor('route.wallet.deposit', { asset: upper }))}><Icon name="dl" size={16} /><span>{t('home.receive')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.convert'].path)}><Icon name="swap" size={16} /><span>{t('wallet.swap')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.fiat.buy'].path)}><Icon name="dollar" size={16} /><span>{t('home.buy')}</span></button>
      </div>

      <div className="tabs" style={{ fontSize: 11 }}>
        {INTERVALS.map(i => (
          <button key={i} className={`tab ${interval === i ? 'a' : ''}`} onClick={() => setInterval(i)}>{i}</button>
        ))}
      </div>

      <FakeChart seed={upper + interval} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div className="t3">${pair?.price ?? '—'} <span className="grn">{positive ? '↑' : '↓'}</span></div>
        <div className="t3">24h: <span className={positive ? 'grn' : 'red'}>{pair?.change24h ?? '—'}%</span></div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('wallet.marketStats')}</h3>
      <div className="g" style={{ padding: 10 }}>
        {[
          [t('wallet.price'), pair ? `$${pair.price}` : '—'],
          [t('wallet.vol24'), pair ? `$${formatBig(pair.volume24h)}` : '—'],
          [t('wallet.high24'), pair ? `$${pair.high24h}` : '—'],
          [t('wallet.low24'), pair ? `$${pair.low24h}` : '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 8 }}>{t('wallet.recentActivity')}</h3>
      {recent.length > 0 ? recent.map(tx => (
        <button key={tx.id} className="li" onClick={() => nav(routeFor('route.wallet.tx-detail', { txId: tx.id }))} style={{ width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ background: 'rgba(0,200,83,.1)' }}>
            <Icon name={tx.type === 'deposit' ? 'dl' : tx.type === 'withdraw' ? 'arrow' : 'swap'} size={14} />
          </div>
          <div className="li-c">
            <div className="li-n">{capitalize(tx.type)}</div>
            <div className="li-s">{new Date(tx.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="li-r">
            <div className="li-v" style={{ fontSize: 13 }}>{tx.amount} {tx.asset.split('→')[0]}</div>
          </div>
        </button>
      )) : <div className="t3" style={{ padding: 12, textAlign: 'center' }}>{t('wallet.noActivityYet')}</div>}
    </PhoneShell>
  )
}

function FakeChart({ seed }: { seed: string }) {
  const candles = Array.from({ length: 38 }, (_, i) => {
    const v = 25 + ((seed.charCodeAt(0) + i * 7) % 50)
    const isGreen = i % 3 !== 0
    return { v, isGreen }
  })
  return (
    <div className="chart">
      {candles.map((c, i) => (
        <div key={i} className="candle" style={{ height: `${c.v}%`, background: c.isGreen ? 'var(--gl)' : 'var(--r)' }} />
      ))}
    </div>
  )
}

function formatBig(s: string): string {
  const n = parseFloat(s)
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return s
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
