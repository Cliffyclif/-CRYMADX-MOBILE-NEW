import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpoint } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { Transaction } from '../../api/endpoints'

export function TxHistory() {
  const { t } = useTranslation()
  const nav = useNavigate()
  // Type values mirror src/screens/wallet/HistoryScreen.tsx (production):
  //   deposit | withdraw | convert | stake | unstake
  const TABS: Array<{ id: string; label: string; type?: Transaction['type'] }> = [
    { id: 'all',     label: t('tx.tabAll') },
    { id: 'in',      label: t('tx.tabIn'),      type: 'deposit' },
    { id: 'out',     label: t('tx.tabOut'),     type: 'withdraw' },
    { id: 'convert', label: t('tx.tabConvert'), type: 'convert' },
    { id: 'trade',   label: t('tx.tabTrade'),   type: 'trade' },
  ]
  const [tab, setTab] = useState(TABS[0])
  const { data } = useEndpoint<{ items: Transaction[] }>('api.tx.list', tab.type ? { query: { type: tab.type } } : {})

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('tx.title')} rightIcons={['search', 'settings']} />

      <div className="tabs" style={{ marginTop: 6 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab.id === t.id ? 'a' : ''}`} onClick={() => setTab(t)}>{t.label}</button>
        ))}
      </div>

      {data?.items?.map(tx => {
        const tone = tx.type === 'withdraw' ? 'r' : tx.type === 'convert' ? 'gd' : 'g'
        const arrow = tx.type === 'deposit' ? '↓' : tx.type === 'withdraw' ? '↑' : tx.type === 'convert' ? '⇄' : '📈'
        const tint = tone === 'r' ? '239,68,68' : tone === 'gd' ? '212,165,60' : '0,200,83'
        const color = tone === 'r' ? 'var(--r)' : tone === 'gd' ? 'var(--gd)' : 'var(--gl)'
        return (
          <button key={tx.id} className="li" onClick={() => nav(routeFor('route.wallet.tx-detail', { txId: tx.id }))} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
              <span style={{ fontSize: 18, color }}>{arrow}</span>
            </div>
            <div className="li-c">
              <div className="li-n">{capitalize(tx.type)} <span style={{ color: 'var(--text-mid-40)', fontSize: 13 }}>{tx.asset}</span></div>
              <div className="li-s">{formatDate(tx.createdAt)}</div>
            </div>
            <div className="li-r">
              <div className="li-v" style={{ color, fontSize: 13 }}>
                {tx.type === 'deposit' || tx.type === 'reward' ? '+' : tx.type === 'withdraw' ? '-' : ''}{tx.amount} {tx.asset?.split('→')[0]}
              </div>
              <div className="li-d"><span className={`badge badge-${tone === 'r' && tx.status === 'failed' ? 'r' : 'g'}`} style={{ fontSize: 9 }}>{tx.status}</span></div>
            </div>
          </button>
        )
      })}

      {(data?.items?.length ?? 0) === 0 && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('tx.noTransactions')}</div>
        </div>
      )}
    </PhoneShell>
  )
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
