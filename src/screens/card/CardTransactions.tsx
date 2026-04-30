import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint } from '../../api/hooks'
import type { CardTransaction, CardSettings } from '../../mock/db'

const TABS = ['all', 'approved', 'declined', 'pending'] as const

export function CardTransactions() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { data: card } = useEndpoint<CardSettings>('api.card.get')
  const { data } = useEndpoint<{ items: CardTransaction[] }>('api.card.transactions')

  const items = (data?.items ?? []).filter(tx => tab === 'all' || tx.status === tab)

  const tabLabel = (k: typeof TABS[number]) =>
    k === 'all' ? t('card.tabAll') :
    k === 'approved' ? t('card.tabApproved') :
    k === 'declined' ? t('card.tabDeclined') :
    t('card.tabPending')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('card.cardActivity')} rightIcons={['search', 'settings']} />

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>${card?.spentMonth ?? '0'}</div><div className="stat-l">{t('card.thisMonth')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 16 }}>+${card?.cashbackEarned ?? '0'}</div><div className="stat-l">{t('card.cashback')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{card?.txnsThisMonth ?? 0}</div><div className="stat-l">{t('card.txns')}</div></div>
      </div>

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(k => (
          <button key={k} className={`tab ${tab === k ? 'a' : ''}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>
        ))}
      </div>

      {items.map(tx => (
        <div key={tx.id} className="li">
          <div className="li-i" style={{ background: `rgba(${tx.merchantTint},.12)`, width: 28, height: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: `rgb(${tx.merchantTint})` }}>{tx.merchant[0]}</div>
          </div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>{tx.merchant}</div>
            <div className="li-s">{tx.category} · {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
          <div className="li-r">
            <div className="li-v" style={{ fontSize: 13, color: tx.status === 'declined' ? 'var(--r)' : tx.status === 'pending' ? 'var(--gd)' : 'var(--text-strong)' }}>
              {tx.status === 'declined' ? '✕' : ''} ${tx.amount}
            </div>
            <div className="li-d" style={{ color: tx.status === 'approved' ? 'var(--gl)' : tx.status === 'declined' ? 'var(--r)' : 'var(--text-mid-40)' }}>{tx.cashback}</div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('card.noTxnsTab', { tab: tab === 'all' ? '' : tabLabel(tab).toLowerCase() })}</div>
        </div>
      )}
    </PhoneShell>
  )
}
