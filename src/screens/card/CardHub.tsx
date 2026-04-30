import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CardFace } from '../../components/CardFace'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { CardSettings, CardTransaction } from '../../mock/db'
import { ApiError } from '../../api/client'

export function CardHub() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: card, error } = useEndpoint<CardSettings>('api.card.get')
  const { data: txs } = useEndpoint<{ items: CardTransaction[] }>('api.card.transactions', {}, { enabled: !!card })
  const freeze = useEndpointMutation('api.card.freeze', { invalidates: ['api.card.get'] })

  if (error && error instanceof ApiError && error.code === 'NO_CARD') {
    nav(ROUTES['route.card.onboarding'].path, { replace: true })
    return null
  }
  if (!card) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime()
    const d = Math.floor(ms / 86_400_000)
    if (d < 1) return t('card.today')
    if (d < 7) return t('card.daysAgo', { n: d })
    return t('card.weeksAgo', { n: Math.floor(d / 7) })
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>{t('card.myCard')}</h2>
        <button onClick={() => nav(ROUTES['route.card.settings'].path)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="settings" size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <CardFace last4={card.cardLast4} cardholderName={card.cardholderName} size="medium" />
      </div>

      <div className="g" style={{ padding: 14, marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="t3">{t('card.available')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', marginTop: 2 }}>${card.balance}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="t3">{t('card.spentThisMonth')}</div>
            <div style={{ color: 'var(--text-strong)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>${card.spentMonth}</div>
          </div>
        </div>
      </div>

      <div className="qa">
        <button className="qa-b" onClick={() => nav(ROUTES['route.card.topup'].path)}><Icon name="plus" size={16} /><span>{t('card.topUp')}</span></button>
        <button className="qa-b" onClick={() => freeze.mutate({ body: { freeze: card.status !== 'frozen' } })}>
          <Icon name="lock" size={16} color={card.status === 'frozen' ? 'var(--r)' : undefined} />
          <span>{card.status === 'frozen' ? t('card.unfreeze') : t('card.freeze')}</span>
        </button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.card.settings'].path)}><Icon name="settings" size={16} /><span>{t('card.settings')}</span></button>
        <button className="qa-b" onClick={() => nav(ROUTES['route.card.transactions'].path)}><Icon name="chart" size={16} /><span>{t('card.stats')}</span></button>
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{card.cashbackPct}%</div><div className="stat-l">{t('card.cashback')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 16 }}>${card.cashbackEarned}</div><div className="stat-l">{t('card.earned')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 16 }}>{card.txnsThisMonth}</div><div className="stat-l">{t('card.txns')}</div></div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('card.recentSpend')}</h3>
      {txs?.items?.slice(0, 4).map(tx => (
        <div key={tx.id} className="li">
          <div className="li-i" style={{ background: `rgba(${tx.merchantTint},.12)`, width: 28, height: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: `rgb(${tx.merchantTint})` }}>{tx.merchant[0]}</div>
          </div>
          <div className="li-c">
            <div className="li-n" style={{ fontSize: 14 }}>{tx.merchant}</div>
            <div className="li-s">{tx.category}</div>
          </div>
          <div className="li-r">
            <div className="li-v" style={{ fontSize: 13 }}>${tx.amount}</div>
            <div className="li-d">{relativeTime(tx.createdAt)}</div>
          </div>
        </div>
      ))}
    </PhoneShell>
  )
}
