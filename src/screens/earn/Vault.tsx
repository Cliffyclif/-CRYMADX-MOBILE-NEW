import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'

// ── Backend shapes ─────────────────────────────────────────
type Plan = {
  planId: string; name: string; description: string; asset: string
  allowedChains: string[]; planType: 'fixed' | 'flexible'; lockDays: number | null
  apyPercent: number; earlyPenaltyPercent: number; flexibleFeePercent: number
  minDeposit: number; maxDeposit: number | null
}
type Position = {
  positionId: string; planName: string; asset: string; chain: string
  principal: number; planType: 'fixed' | 'flexible'; apyPercent: number
  accruedInterest: number; status: 'active' | 'matured' | 'unlocked'
  maturesAt: string | null; daysLeft?: number | null
}
type AutoSave = {
  configId: string; planName: string; asset: string; triggerType: string
  amount?: number; intervalDays?: number; roundupTo?: number; depositPercent?: number
}
type Stats = { totalLocked: number; totalInterestEarned: number; activeCount: number }

const n = (v: number | string | null | undefined, dp = 2) =>
  (Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: dp })

export function Vault() {
  const { t } = useTranslation()
  const plansQ = useEndpoint<{ plans: Plan[] }>('api.earn.vault.plans')
  const posQ = useEndpoint<{ positions: Position[] }>('api.earn.vault.positions', { query: { status: 'all' } })
  const statsQ = useEndpoint<Stats>('api.earn.vault.stats')
  const autoQ = useEndpoint<{ configs: AutoSave[] }>('api.earn.vault.autosave.list')

  const invalidates = ['api.earn.vault.positions', 'api.earn.vault.stats', 'api.earn.vault.plans'] as const
  const subscribe = useEndpointMutation('api.earn.vault.subscribe', { invalidates: [...invalidates] })
  const unlock = useEndpointMutation('api.earn.vault.unlock', { invalidates: [...invalidates] })
  const topup = useEndpointMutation('api.earn.vault.topup', { invalidates: [...invalidates] })
  const setAuto = useEndpointMutation('api.earn.vault.autosave.set', { invalidates: ['api.earn.vault.autosave.list'] })
  const delAuto = useEndpointMutation('api.earn.vault.autosave.delete', { invalidates: ['api.earn.vault.autosave.list'] })

  const plans = (plansQ.data?.plans ?? []).filter(p => (p as any).status !== 'paused')
  const positions = posQ.data?.positions ?? []
  const active = positions.filter(p => p.status !== 'unlocked')
  const stats = statsQ.data
  const autoRules = autoQ.data?.configs ?? []

  // form state
  const [openPlan, setOpenPlan] = useState<string | null>(null)
  const [subChain, setSubChain] = useState('')
  const [subAmount, setSubAmount] = useState('')
  const [topupId, setTopupId] = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [showAuto, setShowAuto] = useState(false)
  const [autoPlan, setAutoPlan] = useState('')
  const [autoAmount, setAutoAmount] = useState('20')
  const [autoInterval, setAutoInterval] = useState('7')
  const [msg, setMsg] = useState('')

  const fmtTerm = (p: { planType: string; lockDays: number | null }) =>
    p.planType === 'flexible' ? 'Flexible' : `${p.lockDays}d lock`

  const doSubscribe = async (plan: Plan) => {
    setMsg('')
    const amt = parseFloat(subAmount)
    if (!amt || amt <= 0) { setMsg('Enter an amount'); return }
    try {
      await subscribe.mutateAsync({ body: { planId: plan.planId, chain: subChain || plan.allowedChains[0] || 'ETH', amount: amt } })
      setOpenPlan(null); setSubAmount('')
    } catch (e: any) { setMsg(e?.message || 'Failed to subscribe') }
  }

  const doUnlock = async (p: Position) => {
    setMsg('')
    try { await unlock.mutateAsync({ pathParams: { id: p.positionId } }) }
    catch (e: any) { setMsg(e?.message || 'Unlock failed') }
  }

  const doTopup = async (p: Position) => {
    setMsg('')
    const amt = parseFloat(topupAmount)
    if (!amt || amt <= 0) { setMsg('Enter an amount'); return }
    try {
      await topup.mutateAsync({ pathParams: { id: p.positionId }, body: { amount: amt } })
      setTopupId(null); setTopupAmount('')
    } catch (e: any) { setMsg(e?.message || 'Top-up failed') }
  }

  const doAutoSave = async () => {
    setMsg('')
    const plan = plans.find(p => p.planId === autoPlan) || plans[0]
    if (!plan) { setMsg('No plan selected'); return }
    const amt = parseFloat(autoAmount), days = parseInt(autoInterval)
    if (!amt || amt <= 0) { setMsg('Enter an amount'); return }
    if (!days || days < 1) { setMsg('Enter days'); return }
    try {
      await setAuto.mutateAsync({ body: {
        planId: plan.planId, chain: plan.allowedChains[0] || 'ETH',
        triggerType: 'interval', amount: amt, intervalDays: days, enabled: true,
      } })
      setShowAuto(false)
    } catch (e: any) { setMsg(e?.message || 'Failed to set auto-save') }
  }

  const canUnlock = (p: Position) =>
    p.planType === 'flexible' || !p.maturesAt || new Date() >= new Date(p.maturesAt)

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('earn.vaultTitle')} actions={<span className="badge badge-gd" style={{ fontSize: 10 }}>APY</span>} />
      <div className="t2">Earn APY on your stablecoins</div>

      {/* Stats */}
      <div className="stats" style={{ marginTop: 6 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>${n(stats?.totalLocked)}</div><div className="stat-l">Locked</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>${n(stats?.totalInterestEarned)}</div><div className="stat-l">Interest</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{stats?.activeCount ?? 0}</div><div className="stat-l">Active</div></div>
      </div>

      {msg && <div className="g" style={{ padding: 10, marginTop: 8, borderColor: 'var(--r)' }}><div className="t3" style={{ color: 'var(--r)' }}>{msg}</div></div>}

      {/* Plans */}
      <h3 style={{ marginTop: 10 }}>Savings Plans</h3>
      {plans.length === 0 && <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">No plans available right now</div></div>}
      {plans.map(plan => (
        <div key={plan.planId} className="g" style={{ padding: 12, margin: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoinIcon symbol={plan.asset} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{plan.name}</div>
              <div className="t3">{fmtTerm(plan)} · min {n(plan.minDeposit)} {plan.asset}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="grn" style={{ fontSize: 16, fontWeight: 800 }}>{plan.apyPercent}%</div>
              <div className="t3" style={{ fontSize: 9 }}>APY</div>
            </div>
          </div>
          {openPlan === plan.planId ? (
            <div style={{ marginTop: 8 }}>
              {plan.allowedChains.length > 1 && (
                <select value={subChain || plan.allowedChains[0]} onChange={e => setSubChain(e.target.value)} className="inp" style={{ color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 15, marginBottom: 6 }}>
                  {plan.allowedChains.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                </select>
              )}
              <div className="inp"><input type="number" inputMode="decimal" value={subAmount} onChange={e => setSubAmount(e.target.value)} placeholder={`Amount in ${plan.asset}`} /></div>
              <div className="t3" style={{ marginTop: 4 }}>
                {plan.planType === 'fixed'
                  ? `${plan.earlyPenaltyPercent}% penalty if you exit early`
                  : `${plan.flexibleFeePercent}% fee on unlock`}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="btn btn-o" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={() => setOpenPlan(null)}>{t('common.cancel')}</button>
                <button className="btn btn-g" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={() => doSubscribe(plan)} disabled={subscribe.isPending}>
                  {subscribe.isPending ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-g" style={{ marginTop: 8, padding: 8, fontSize: 14 }}
              onClick={() => { setOpenPlan(plan.planId); setSubChain(plan.allowedChains[0] || 'ETH'); setSubAmount(''); setMsg('') }}>
              Subscribe
            </button>
          )}
        </div>
      ))}

      {/* Auto-Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <h3 style={{ margin: 0 }}>Auto-Save</h3>
        <button onClick={() => { setShowAuto(s => !s); setAutoPlan(plans[0]?.planId || ''); setMsg('') }}
          style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }} disabled={plans.length === 0}>
          <Icon name="plus" size={16} color="var(--gl)" />
        </button>
      </div>
      {showAuto && (
        <div className="g" style={{ padding: 12, marginTop: 6 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 6 }}>New recurring rule</div>
          <select value={autoPlan} onChange={e => setAutoPlan(e.target.value)} className="inp" style={{ color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 15, marginBottom: 6 }}>
            {plans.map(p => <option key={p.planId} value={p.planId} style={{ color: '#000' }}>{p.name} — {p.apyPercent}%</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="inp" style={{ flex: 1 }}><input type="number" inputMode="decimal" value={autoAmount} onChange={e => setAutoAmount(e.target.value)} placeholder="Amount" /></div>
            <div className="inp" style={{ flex: 1 }}><input type="number" value={autoInterval} onChange={e => setAutoInterval(e.target.value)} placeholder="Every N days" /></div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn-o" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={() => setShowAuto(false)}>{t('common.cancel')}</button>
            <button className="btn btn-g" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={doAutoSave} disabled={setAuto.isPending}>
              {setAuto.isPending ? 'Saving…' : 'Turn On'}
            </button>
          </div>
        </div>
      )}
      {autoRules.map(r => (
        <div key={r.configId} className="g" style={{ padding: 10, margin: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="refresh" size={14} color="var(--gl)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{r.planName}</div>
            <div className="t3">
              {r.triggerType === 'interval' ? `${n(r.amount)} ${r.asset} every ${r.intervalDays}d`
                : r.triggerType === 'roundup' ? `Round up to ${r.roundupTo} ${r.asset}`
                : `${r.depositPercent}% of each deposit`}
            </div>
          </div>
          <button className="badge badge-r" style={{ fontSize: 9, cursor: 'pointer', border: 'none' }}
            onClick={() => delAuto.mutate({ pathParams: { id: r.configId } })}>REMOVE</button>
        </div>
      ))}
      {autoRules.length === 0 && !showAuto && (
        <div className="g" style={{ padding: 14, textAlign: 'center', marginTop: 4 }}><div className="t3">No auto-save rules yet</div></div>
      )}

      {/* Positions */}
      <h3 style={{ marginTop: 12 }}>Your Positions</h3>
      {active.length === 0 && <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">No active positions</div></div>}
      {active.map(p => (
        <div key={p.positionId} className="g" style={{ padding: 12, margin: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoinIcon symbol={p.asset} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{p.planName}</div>
              <div className="t3">
                {p.apyPercent}% APY · {p.planType === 'fixed'
                  ? (canUnlock(p) ? 'Matured' : `${p.daysLeft ?? 0}d left`)
                  : 'Flexible'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>{n(p.principal, 4)} {p.asset}</div>
              <div className="grn" style={{ fontSize: 11 }}>+{n(p.accruedInterest, 6)}</div>
            </div>
          </div>
          {topupId === p.positionId ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <div className="inp" style={{ flex: 1 }}><input type="number" inputMode="decimal" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="Top-up amount" /></div>
              <button className="btn btn-g" style={{ padding: 8, margin: 0, fontSize: 14 }} onClick={() => doTopup(p)} disabled={topup.isPending}>Add</button>
              <button className="btn btn-o" style={{ padding: 8, margin: 0, fontSize: 14 }} onClick={() => setTopupId(null)}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {p.planType === 'flexible' && (
                <button className="btn btn-o" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }}
                  onClick={() => { setTopupId(p.positionId); setTopupAmount(''); setMsg('') }}>Top up</button>
              )}
              <button className="btn btn-g" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }}
                onClick={() => doUnlock(p)} disabled={unlock.isPending || !canUnlock(p)}>
                {!canUnlock(p) ? `${p.daysLeft ?? 0}d left` : unlock.isPending ? 'Unlocking…' : 'Unlock'}
              </button>
            </div>
          )}
        </div>
      ))}
    </PhoneShell>
  )
}
