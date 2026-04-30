import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { NFT } from '../../mock/db'

const TABS = ['mine', 'listed', 'history', 'browse'] as const
const CHAINS = ['All chains', 'ETH', 'POLYGON', 'BASE', 'SOL', 'ARB'] as const

export function NFTGallery() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('mine')
  const [chain, setChain] = useState<typeof CHAINS[number]>('All chains')
  const { data } = useEndpoint<{ items: NFT[] }>('api.nft.gallery')

  const items = (data?.items ?? []).filter(n => chain === 'All chains' || n.chain === chain)
  const totalValue = items.reduce((s, n) => s + parseFloat(n.price) * (n.priceCurrency === 'ETH' ? 3824 : n.priceCurrency === 'MATIC' ? 0.55 : 1), 0)

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('nft.myNfts')}</h2>
        <button onClick={() => nav(ROUTES['route.nft.market'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="search" size={16} />
        </button>
        <button style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', marginLeft: 8 }}>
          <Icon name="refresh" size={16} />
        </button>
      </div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{items.length}</div><div className="stat-l">{t('nft.owned')}</div></div>
        <div className="stat"><div className="stat-v gld" style={{ fontSize: 18 }}>2</div><div className="stat-l">{t('nft.listed')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>${totalValue.toFixed(0)}</div><div className="stat-l">{t('nft.floor')}</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        <button className={`tab ${tab === 'mine' ? 'a' : ''}`} onClick={() => setTab('mine')}>{t('nft.myCount', { n: items.length })}</button>
        <button className={`tab ${tab === 'listed' ? 'a' : ''}`} onClick={() => setTab('listed')}>{t('nft.tabListed')}</button>
        <button className={`tab ${tab === 'history' ? 'a' : ''}`} onClick={() => setTab('history')}>{t('nft.tabHistory')}</button>
        <button className={`tab ${tab === 'browse' ? 'a' : ''}`} onClick={() => nav(ROUTES['route.nft.market'].path)}>{t('nft.tabBrowse')}</button>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
        {CHAINS.map(c => (
          <button key={c} className={`badge ${chain === c ? 'badge-g' : ''}`} style={{ cursor: 'pointer', background: chain === c ? 'var(--g)' : 'var(--surface-soft)', color: chain === c ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: '4px 8px', whiteSpace: 'nowrap' }} onClick={() => setChain(c)}>{c === 'All chains' ? t('nft.allChains') : c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {items.map(n => (
          <button key={n.id} className="g" style={{ overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => nav(routeFor('route.nft.detail', { nftId: n.id }))}>
            <div style={{ height: 80, background: n.imageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,.15)' }}>{n.tokenId.replace('#', '')}</div>
              <div className="badge badge-g" style={{ position: 'absolute', top: 4, right: 4, fontSize: 8 }}>{n.chain}</div>
            </div>
            <div style={{ padding: 8 }}>
              <div className="t3" style={{ marginBottom: 2, fontSize: 11 }}>{n.name.split('#')[0]}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gl)' }}>{n.price} {n.priceCurrency}</div>
            </div>
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('nft.noNfts')}</div>
          <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => nav(ROUTES['route.nft.market'].path)}>{t('nft.browseMarket')}</button>
        </div>
      )}
    </PhoneShell>
  )
}
