import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { NFT } from '../../mock/db'

const CATEGORIES = ['All', 'PFP', 'Art', 'Gaming', 'Music', 'Photography', 'Domains'] as const

export function NFTMarketplace() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [cat, setCat] = useState<typeof CATEGORIES[number]>('All')
  const { data } = useEndpoint<{ items: NFT[] }>('api.nft.market')

  const items = data?.items ?? []

  const catLabel = (c: typeof CATEGORIES[number]) =>
    c === 'All' ? t('nft.catAll') :
    c === 'PFP' ? t('nft.catPfp') :
    c === 'Art' ? t('nft.catArt') :
    c === 'Gaming' ? t('nft.catGaming') :
    c === 'Music' ? t('nft.catMusic') :
    c === 'Photography' ? t('nft.catPhoto') :
    t('nft.catDomains')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('nft.marketTitle')} rightIcons={['settings']} />

      <div className="inp" style={{ marginTop: 6 }}>
        <Icon name="search" size={14} />
        <input placeholder={t('nft.marketSearch')} style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '6px 0', overflowX: 'auto' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`badge ${cat === c ? 'badge-g' : ''}`} style={{ whiteSpace: 'nowrap', cursor: 'pointer', background: cat === c ? 'var(--g)' : 'var(--surface-soft)', color: cat === c ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: '4px 8px' }} onClick={() => setCat(c)}>{catLabel(c)}</button>
        ))}
      </div>

      <h3>{t('nft.trending')}</h3>
      {items.slice(0, 3).map(n => (
        <div key={n.id} className="li">
          <div style={{ width: 38, height: 38, borderRadius: 8, background: n.imageGradient, flexShrink: 0 }} />
          <div className="li-c">
            <div className="li-n">{n.collection}</div>
            <div className="li-s">{t('nft.floorPrice', { price: n.price, currency: n.priceCurrency })}</div>
          </div>
          <div className="li-r"><div className="t3">{t('nft.trendingDelta')}</div></div>
        </div>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('nft.featuredDrops')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {items.map(n => (
          <button key={n.id} className="g" style={{ overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => nav(routeFor('route.nft.detail', { nftId: n.id }))}>
            <div style={{ height: 80, background: n.imageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 800, letterSpacing: 1 }}>{t('nft.drop')}</div>
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{n.name}</div>
              <div className="t3" style={{ fontSize: 10 }}>{n.chain} · {n.collection}</div>
              <div style={{ fontSize: 13, color: 'var(--gl)', marginTop: 2, fontWeight: 700 }}>{n.price} {n.priceCurrency}</div>
            </div>
          </button>
        ))}
      </div>
    </PhoneShell>
  )
}
