import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { SavingsProduct, SavingsPosition } from '../../mock/db'

const TABS = ['all', 'flexible', 'locked', 'active'] as const

export function Savings() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data: products } = useEndpoint<{ items: SavingsProduct[] }>('api.earn.savings.products')
  const { data: positions } = useEndpoint<{ items: SavingsPosition[] }>('api.earn.savings.positions')

  const list = products?.items ?? []
  const filtered = tab === 'all' ? list
    : tab === 'flexible' ? list.filter(p => p.type === 'flexible')
    : tab === 'locked' ? list.filter(p => p.type === 'locked')
    : []
  const totalSaved = positions?.items?.reduce((s, p) => s + parseFloat(p.amount), 0) ?? 0
  const totalEarned = positions?.items?.reduce((s, p) => s + parseFloat(p.earned), 0) ?? 0
  const positionsCount = positions?.items?.length ?? 0

  const tabLabel = (tab: typeof TABS[number]) => {
    if (tab === 'all') return t('earn.tabAll')
    if (tab === 'flexible') return t('earn.tabFlexible')
    if (tab === 'locked') return t('earn.tabLocked')
    return t('earn.tabActiveCount', { count: positionsCount })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('earn.savingsTitle')} />

      <div className="g" style={{ padding: 12 }}>
        <div className="t3">{t('earn.mySavings')}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>${totalSaved.toFixed(2)}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 2 }}>
          <span className="grn">+${totalEarned.toFixed(2)} {t('earn.earnedSuffix')}</span>
          <span className="t3">{positionsCount} {t('earn.activeSuffix')}</span>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(tk => (
          <button key={tk} className={`tab ${tab === tk ? 'a' : ''}`} onClick={() => setTab(tk)}>
            {tabLabel(tk)}
          </button>
        ))}
      </div>

      {tab === 'active' ? (
        positions?.items?.length === 0
          ? <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('earn.noActivePositions')}</div></div>
          : positions?.items?.map(p => (
            <div key={p.id} className="li">
              <CoinIcon symbol={p.asset} size={32} />
              <div className="li-c">
                <div className="li-n">{p.amount} {p.asset} · {p.apy}% APY</div>
                <div className="li-s">{p.endDate ? t('earn.lockedUntil', { date: new Date(p.endDate).toLocaleDateString() }) : t('earn.flexibleLabel')}</div>
              </div>
              <div className="li-r"><div className="li-v grn">+${p.earned}</div></div>
            </div>
          ))
      ) : (
        <>
          <h3 style={{ marginTop: 8 }}>{t('earn.topProducts')}</h3>
          {filtered.map(p => {
            return (
              <button key={p.id} className="li" onClick={() => nav(routeFor('route.earn.savings.detail', { productId: p.id }))} style={{ width: '100%', textAlign: 'left' }}>
                <CoinIcon symbol={p.asset} size={30} />
                <div className="li-c">
                  <div className="li-n">{p.asset}</div>
                  <div className="li-s">{p.type === 'flexible' ? t('earn.flexibleAnytime') : t('earn.lockedTerm', { days: p.termDays })}</div>
                </div>
                <div className="li-r">
                  <div className="li-v grn" style={{ fontSize: 18, fontWeight: 800 }}>{p.apy}%</div>
                  <div className="li-d">{t('earn.apy')}</div>
                </div>
              </button>
            )
          })}
        </>
      )}
    </PhoneShell>
  )
}
