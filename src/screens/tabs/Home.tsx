import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { BottomNav } from '../../components/BottomNav'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { ServicesGrid } from '../../components/ServicesGrid'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import { useAuth } from '../../stores/auth'
import { usePrivacy, maskIfHidden } from '../../stores/privacy'
import type { Balance, Transaction } from '../../api/endpoints'

type Wallet = { total: string; change24h: string; changeAbs: string; btcEquivalent?: string; items: Balance[] }

export function Home() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const { data: wallet, isLoading, refetch: refetchWallet } = useEndpoint<Wallet>('api.wallet.balances.list')
  const { data: txs, refetch: refetchTxs } = useEndpoint<{ items: Transaction[] }>('api.tx.list', { query: { limit: 4 } })
  const recent = (txs?.items ?? []).slice(0, 4)
  const greet = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('home.greetingMorning')
    if (h < 18) return t('home.greetingAfternoon')
    return t('home.greetingEvening')
  })()
  const firstName = user?.firstName ?? 'there'
  const hidden = usePrivacy(s => s.hidden)
  const togglePrivacy = usePrivacy(s => s.toggle)
  const balanceEl = isLoading
    ? <span style={{ color: 'var(--text-mid-40)' }}>Loading…</span>
    : (hidden ? '••••••' : `$${wallet?.total ?? '0.00'}`)

  return (
    <PhoneShell bottomNav={<BottomNav />} onRefresh={async () => { await Promise.all([refetchWallet(), refetchTxs()]) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="t3">{greet}</div>
          <h2>{firstName} 👋</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => nav(ROUTES['route.engage.notifications'].path)} style={{ background: 'none', border: 'none', position: 'relative', padding: 0, display: 'flex', cursor: 'pointer' }}>
            <Icon name="bell" size={20} color="var(--text-mid-50)" />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: 'var(--r)' }} />
          </button>
          <img src="/crymadx-mark.png" alt="" style={{ width: 28, height: 28, borderRadius: 14 }} />
        </div>
      </div>

      <div className="g" style={{ padding: 14, marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="t3">{t('home.totalBalance')}</div>
          <button
            onClick={togglePrivacy}
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
          >
            <Icon name="eye" size={14} color={hidden ? 'var(--gl)' : 'var(--text-mid-30)'} />
          </button>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>{balanceEl}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div className="t3">≈ {hidden ? '••••' : (wallet?.btcEquivalent ?? '0')} BTC</div>
          {wallet && !hidden && parseFloat(wallet.total) > 0 && (
            <span className="badge badge-g" style={{ fontSize: 10 }}>
              {wallet.changeAbs} ({wallet.change24h}%) {parseFloat(wallet.change24h) >= 0 ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>

      <button className="g" onClick={() => nav(ROUTES['route.tab.ai'].path)} style={{ padding: 10, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, borderLeft: '3px solid var(--gl)', width: '100%', cursor: 'pointer', border: 'none', textAlign: 'left' }}>
        <img src="/crymadx-ai-mark.png" alt="" style={{ width: 36, height: 36, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{t('home.talkToAi')}</div>
          <div className="t3">{t('home.talkToAiSub')}</div>
        </div>
        <Icon name="mic" size={14} />
      </button>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.withdraw'].path)}><Icon name="send" size={18} /><span>{t('home.send')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.deposit-pick'].path)}><Icon name="dl" size={18} /><span>{t('home.receive')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.wallet.convert'].path)}><Icon name="swap" size={18} /><span>{t('home.convert')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.fiat.buy'].path)}><Icon name="dollar" size={18} /><span>{t('home.buy')}</span></button>
      </div>

      <div style={{ marginTop: 10 }}>
        <ServicesGrid />
      </div>

      <h3 style={{ marginTop: 14 }}>{t('home.topAssets')}</h3>
      {wallet?.items?.slice(0, 3).map(b => (
        <button key={b.id} className="li" onClick={() => nav(routeFor('route.wallet.asset', { symbol: b.asset }))} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <CoinIcon symbol={b.asset} size={32} />
          <div className="li-c">
            <div className="li-n">{b.asset}</div>
            <div className="li-s">{maskIfHidden(b.amount, hidden)}</div>
          </div>
          <div className="li-r">
            <div className="li-v">{hidden ? '••••' : `$${b.usdValue}`}</div>
          </div>
        </button>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('home.recentActivity')}</h3>
      {recent.length === 0 && (
        <div className="g" style={{ padding: 12, textAlign: 'center' }}>
          <div className="t3">{t('home.noTransactionsYet')}</div>
        </div>
      )}
      {recent.map(tx => {
        const isOut = tx.type === 'withdraw'
        const isSwap = tx.type === 'convert' || tx.type === 'trade'
        const tint = isOut ? '239,68,68' : isSwap ? '212,165,60' : '0,200,83'
        const color = isOut ? 'var(--r)' : isSwap ? 'var(--gd)' : 'var(--gl)'
        const arrow = tx.type === 'deposit' ? '↓' : isOut ? '↑' : isSwap ? '⇄' : '+'
        const date = (() => { try { return new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '' } })()
        return (
          <button key={tx.id} className="li" onClick={() => nav(routeFor('route.wallet.tx-detail', { txId: tx.id }))} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
              <span style={{ fontSize: 14, color }}>{arrow}</span>
            </div>
            <div className="li-c">
              <div className="li-n">{capitalize(tx.type)} <span style={{ color: 'var(--text-mid-40)', fontSize: 13 }}>{tx.asset}</span></div>
              <div className="li-s">{date}</div>
            </div>
            <div className="li-r">
              <div className="li-v" style={{ color, fontSize: 13 }}>
                {isOut ? '-' : tx.type === 'deposit' || tx.type === 'reward' ? '+' : ''}{tx.amount} {tx.asset}
              </div>
            </div>
          </button>
        )
      })}
      {recent.length > 0 && (
        <button className="li" onClick={() => nav(ROUTES['route.wallet.tx-history'].path)} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <div className="li-i" style={{ background: 'rgba(0,200,83,.1)' }}>
            <Icon name="dl" size={16} />
          </div>
          <div className="li-c">
            <div className="li-n">{t('home.viewAllTransactions')}</div>
            <div className="li-s">{t('home.totalCount', { count: txs?.items?.length ?? 0 })}</div>
          </div>
          <div className="li-r"><span className="grn">›</span></div>
        </button>
      )}
    </PhoneShell>
  )
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
