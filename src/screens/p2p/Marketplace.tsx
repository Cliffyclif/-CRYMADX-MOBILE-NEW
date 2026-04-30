import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { P2POffer } from '../../mock/db'

const ASSETS = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB'] as const

export function Marketplace() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [asset, setAsset] = useState<typeof ASSETS[number]>('USDT')
  const { data } = useEndpoint<{ items: P2POffer[] }>('api.p2p.offers.list', { query: { asset } })

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('p2p.title')}</h2>
        <Icon name="plus" size={16} color="var(--gl)" />
        <button onClick={() => nav(ROUTES['route.p2p.payments'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', marginLeft: 8 }}>
          <Icon name="settings" size={16} />
        </button>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        <button className={`tab ${side === 'buy' ? 'a' : ''}`} onClick={() => setSide('buy')}>{t('p2p.tabBuy')}</button>
        <button className={`tab ${side === 'sell' ? 'a' : ''}`} onClick={() => setSide('sell')}>{t('p2p.tabSell')}</button>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
        {ASSETS.map(a => (
          <button key={a} className={`badge ${asset === a ? 'badge-g' : ''}`} style={{ cursor: 'pointer', background: asset === a ? 'var(--g)' : 'var(--surface-soft)', color: asset === a ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: '4px 8px' }} onClick={() => setAsset(a)}>{a}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <div className="inp" style={{ flex: 1, padding: 6 }}><span className="t3">$ NGN ▾</span></div>
        <div className="inp" style={{ flex: 1, padding: 6 }}><span className="t3">All payment ▾</span></div>
        <div className="inp" style={{ flex: 0, padding: 6, width: 36, justifyContent: 'center' }}><Icon name="settings" size={12} /></div>
      </div>

      {data?.items?.map(o => (
        <div key={o.id} className="g" style={{ padding: 12, margin: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: 'linear-gradient(135deg, var(--g), var(--gl))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>{o.sellerInitial}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-strong)', fontWeight: 700 }}>
                {o.sellerName}
                {o.verified && <span className="badge badge-g" style={{ fontSize: 8 }}>✓</span>}
                {o.online && <span className="grn" style={{ fontSize: 10 }}>{t('p2p.online')}</span>}
              </div>
              <div className="t3">{t('p2p.stats', { rep: o.reputationPct, trades: o.reputationCount, minutes: o.avgReleaseMin })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="grn" style={{ fontSize: 18, fontWeight: 800 }}>₦{o.price}</div>
              <div className="t3">{o.asset}</div>
            </div>
          </div>
          <div className="t3" style={{ marginTop: 6 }}>{t('p2p.limitRange', { min: o.minLimit, max: o.maxLimit, asset: o.asset })}</div>
          <div className="t3" style={{ marginTop: 2 }}>{o.paymentMethods.join(' · ')}</div>
          <button className="btn btn-g" style={{ marginTop: 6, padding: 7, fontSize: 14 }} onClick={() => nav(routeFor('route.p2p.offer', { offerId: o.id }))}>
            {side === 'buy' ? t('p2p.buyAsset', { asset: o.asset }) : t('p2p.sellAsset', { asset: o.asset })}
          </button>
        </div>
      ))}
    </PhoneShell>
  )
}
