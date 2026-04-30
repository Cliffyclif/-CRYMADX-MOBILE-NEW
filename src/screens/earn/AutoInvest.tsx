import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { AutoInvestPlan } from '../../mock/db'

export function AutoInvest() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ items: AutoInvestPlan[] }>('api.earn.autoinvest.list')
  const [showNew, setShowNew] = useState(false)
  const [asset, setAsset] = useState('BTC')
  const [amount, setAmount] = useState('10')
  const [cadence, setCadence] = useState<AutoInvestPlan['cadence']>('daily')
  const create = useEndpointMutation('api.earn.autoinvest.create', { invalidates: ['api.earn.autoinvest.list'] })
  const update = useEndpointMutation('api.earn.autoinvest.update', { invalidates: ['api.earn.autoinvest.list'] })

  const items = data?.items ?? []
  const totalInvested = items.reduce((s, p) => s + parseFloat(p.totalInvested), 0)
  const avgPnl = items.length > 0 ? items.reduce((s, p) => s + parseFloat(p.pnlPct), 0) / items.length : 0
  const active = items.filter(p => p.status === 'active').length

  const submit = async () => {
    if (!amount) return
    await create.mutateAsync({ body: { asset, fundingAsset: 'USD', amount, cadence, totalCycles: 12 } })
    setShowNew(false); setAmount('10')
  }

  const toggle = (p: AutoInvestPlan) => {
    update.mutate({ pathParams: { id: p.id }, body: { status: p.status === 'active' ? 'paused' : 'active' } })
  }

  const cadenceLabel = (c: AutoInvestPlan['cadence']) =>
    c === 'daily' ? t('earn.cadenceDaily') :
    c === 'weekly' ? t('earn.cadenceWeekly') :
    c === 'biweekly' ? t('earn.cadenceBiweekly') :
    t('earn.cadenceMonthly')

  const perLabel = (c: AutoInvestPlan['cadence']) =>
    c === 'daily' ? t('earn.perDay') :
    c === 'weekly' ? t('earn.perWeek') :
    cadenceLabel(c)

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('earn.autoInvestTitle')} actions={<button onClick={() => setShowNew(s => !s)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}><Icon name="plus" size={16} color="var(--gl)" /></button>} />
      <div className="t2">{t('earn.autoInvestSubtitle')}</div>

      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>${totalInvested.toFixed(0)}</div><div className="stat-l">{t('earn.investedLabel')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>+{avgPnl.toFixed(2)}%</div><div className="stat-l">{t('earn.pnlLabel')}</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{active}</div><div className="stat-l">{t('earn.activeLabel')}</div></div>
      </div>

      {showNew && (
        <div className="g" style={{ padding: 12, marginTop: 8 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 6 }}>{t('earn.newPlan')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="inp" style={{ flex: 1, color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 15 }}>
              {['BTC', 'ETH', 'SOL'].map(a => <option key={a} value={a} style={{ color: '#000' }}>{a}</option>)}
            </select>
            <select value={cadence} onChange={e => setCadence(e.target.value as AutoInvestPlan['cadence'])} className="inp" style={{ flex: 1, color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 15 }}>
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map(c => <option key={c} value={c} style={{ color: '#000' }}>{cadenceLabel(c)}</option>)}
            </select>
          </div>
          <div className="inp"><span style={{ color: 'var(--text-mid-40)' }}>$</span><input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10" /></div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn-o" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={() => setShowNew(false)}>{t('common.cancel')}</button>
            <button className="btn btn-g" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={submit} disabled={create.isPending}>
              {create.isPending ? t('earn.creatingPlan') : t('earn.createPlan')}
            </button>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 10 }}>{t('earn.activePlans')}</h3>
      {items.length === 0 ? <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">{t('earn.noPlans')}</div></div> : items.map(p => {
        const fillPct = (p.cyclesCompleted / Math.max(p.cyclesTotal, 1)) * 100
        return (
          <div key={p.id} className="g" style={{ padding: 12, margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoinIcon symbol={p.asset} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{p.asset} · {cadenceLabel(p.cadence)} DCA</div>
                <div className="t3">${p.amount}/{perLabel(p.cadence)} · {t('earn.nextRun', { date: new Date(p.nextRunAt).toLocaleDateString() })}</div>
              </div>
              <button className={`badge badge-${p.status === 'active' ? 'g' : 'gd'}`} style={{ fontSize: 9, cursor: 'pointer', border: 'none' }} onClick={() => toggle(p)}>
                {p.status.toUpperCase()}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
              <span className="t3">{t('earn.investedPrefix')} ${p.totalInvested}</span>
              <span className={parseFloat(p.pnlPct) >= 0 ? 'grn' : 'red'}>{p.pnlPct}%</span>
            </div>
            <div className="bar" style={{ marginTop: 4 }}><div className="fl" style={{ width: `${fillPct}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid-30)', marginTop: 2 }}>
              <span>{t('earn.buysProgress', { done: p.cyclesCompleted, total: p.cyclesTotal })}</span>
              <span>{t('earn.remaining', { n: p.cyclesTotal - p.cyclesCompleted })}</span>
            </div>
          </div>
        )
      })}

      {!showNew && (
        <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => setShowNew(true)}>
          <Icon name="plus" size={14} color="#fff" /> {t('earn.newPlanBtn')}
        </button>
      )}
    </PhoneShell>
  )
}
