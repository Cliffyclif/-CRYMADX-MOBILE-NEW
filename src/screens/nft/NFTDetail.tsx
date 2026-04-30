import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import { useAuth } from '../../stores/auth'
import { fmt } from '../../lib/format'
import type { NFT } from '../../mock/db'

export function NFTDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const { nftId = '' } = useParams()
  const { data: nft, isLoading } = useEndpoint<NFT>('api.nft.detail', { pathParams: { nftId } })
  const { data: prices } = useEndpoint<{ prices: Array<{ symbol: string; price: number }> }>('api.prices.list')
  const priceMap: Record<string, number> = (() => {
    const m: Record<string, number> = { USDT: 1, USDC: 1 }
    for (const p of (prices?.prices ?? [])) m[p.symbol.toUpperCase()] = p.price
    return m
  })()

  if (isLoading) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  if (!nft) return <PhoneShell noTabs><div className="g" style={{ padding: 14, color: 'var(--r)' }}>{t('nft.nftNotFound')}</div></PhoneShell>

  const owned = nft.ownerId === user?.id

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
        </button>
        <h2 style={{ flex: 1, fontSize: 18 }}>{nft.name}</h2>
        <Icon name="share" size={16} />
        <Icon name="bookmark" size={16} />
      </div>

      <div className="g" style={{ marginTop: 8, overflow: 'hidden' }}>
        <div style={{ height: 200, background: nft.imageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: 'rgba(255,255,255,.2)' }}>{nft.tokenId}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: nft.imageGradient }} />
        <span className="t3">{nft.collection}</span>
        {nft.collectionVerified && <span className="badge badge-g" style={{ fontSize: 8 }}>{t('nft.verifiedTick')}</span>}
      </div>

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="t3">{t('nft.currentPrice')}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gl)', marginTop: 2 }}>{nft.price} {nft.priceCurrency}</div>
            <div className="t2">≈ ${fmt(parseFloat(nft.price) * (priceMap[nft.priceCurrency.toUpperCase()] ?? 0))}</div>
          </div>
          {nft.lastSale && (
            <div style={{ textAlign: 'right' }}>
              <div className="t3">{t('nft.lastSale')}</div>
              <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 700, marginTop: 2 }}>{nft.lastSale}</div>
              <div className="grn" style={{ fontSize: 13 }}>{nft.lastSaleChange}</div>
            </div>
          )}
        </div>
      </div>

      {nft.traits.length > 0 && <>
        <h3 style={{ marginTop: 8 }}>{t('nft.properties')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {nft.traits.map(tr => (
            <div key={tr.key} className="g" style={{ padding: 6, textAlign: 'center' }}>
              <div className="t3" style={{ fontSize: 10, letterSpacing: 0.5 }}>{tr.key.toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', margin: '2px 0' }}>{tr.value}</div>
              <div className="grn" style={{ fontSize: 10 }}>{tr.rarity}</div>
            </div>
          ))}
        </div>
      </>}

      <h3 style={{ marginTop: 8 }}>{t('nft.details')}</h3>
      <div className="g" style={{ padding: 8 }}>
        {[
          [t('nft.tokenId'), nft.tokenId],
          [t('nft.contract'), nft.contractAddress],
          [t('nft.standard'), 'ERC-721'],
          [t('nft.chainLabel'), nft.chain],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '2px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {owned ? <>
          <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 14 }} onClick={() => nav(routeFor('route.nft.send', { nftId: nft.id }))}>
            <Icon name="send" size={12} /> {t('nft.send')}
          </button>
          <button className="btn btn-g" style={{ flex: 1.5, padding: 10, margin: 0 }}>
            <Icon name="dollar" size={12} color="#fff" /> {t('nft.listForSale')}
          </button>
        </> : <>
          <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 14 }}>
            <Icon name="bookmark" size={12} /> {t('nft.watch')}
          </button>
          <button className="btn btn-g" style={{ flex: 1.5, padding: 10, margin: 0 }}>
            <Icon name="dollar" size={12} color="#fff" /> {t('nft.buyAmt', { amount: nft.price, currency: nft.priceCurrency })}
          </button>
        </>}
      </div>
    </PhoneShell>
  )
}
