import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import { allAssets, type AssetConfig } from '../../config/assets'
import type { Balance } from '../../api/endpoints'

type Group = {
  symbol: string
  name: string
  variants: AssetConfig[]
}

export function DepositPick() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [q, setQ] = useState('')

  // Group all assets by symbol (USDT/ERC20 + USDT/TRC20 + USDT/BEP20 → one row)
  const grouped = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const a of allAssets) {
      const existing = map.get(a.symbol)
      if (existing) {
        existing.variants.push(a)
      } else {
        map.set(a.symbol, { symbol: a.symbol, name: a.name, variants: [a] })
      }
    }
    return Array.from(map.values())
  }, [])

  const heldMap = useMemo(() => {
    const m: Record<string, { amount: string; usdValue: string }> = {}
    for (const b of (bal?.items ?? [])) m[b.asset] = { amount: b.amount, usdValue: b.usdValue }
    return m
  }, [bal])

  const filter = q.trim().toUpperCase()
  const matched = grouped.filter(g =>
    !filter || g.symbol.includes(filter) || g.name.toUpperCase().includes(filter),
  )

  // Sort: held first, then by USD value, then alphabetical
  const sorted = [...matched].sort((a, b) => {
    const ah = heldMap[a.symbol], bh = heldMap[b.symbol]
    if (ah && !bh) return -1
    if (!ah && bh) return 1
    if (ah && bh) {
      const av = parseFloat((ah.usdValue || '0').replace(/,/g, ''))
      const bv = parseFloat((bh.usdValue || '0').replace(/,/g, ''))
      return bv - av
    }
    return a.symbol.localeCompare(b.symbol)
  })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('deposit.title')} />
      <div className="t2">{grouped.length} cryptocurrencies · 568 chain combinations</div>

      <div className="inp" style={{ marginTop: 8 }}>
        <input
          placeholder={t('common.search') as string}
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {sorted.map(g => {
        const held = heldMap[g.symbol]
        const networkLabel = g.variants.length === 1
          ? g.variants[0].network
          : `${g.variants.length} networks`
        // First variant is the default — picked when user taps
        const pickAsset = g.variants[0].symbol
        return (
          <button
            key={g.symbol}
            className="li"
            onClick={() => nav(routeFor('route.wallet.deposit', { asset: pickAsset }))}
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <CoinIcon symbol={g.symbol} size={32} />
            <div className="li-c">
              <div className="li-n">{g.symbol}</div>
              <div className="li-s">{g.name}</div>
            </div>
            <div className="li-r" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              {held && parseFloat(held.amount.replace(/,/g, '')) > 0 && (
                <div className="li-v" style={{ fontSize: 13 }}>{held.amount}</div>
              )}
              <span className="badge badge-g" style={{ fontSize: 10 }}>{networkLabel}</span>
            </div>
          </button>
        )
      })}

      {sorted.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">No assets match "{q}"</div>
        </div>
      )}
    </PhoneShell>
  )
}
