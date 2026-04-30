import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { Transaction } from '../../api/endpoints'

type State = { from: string; to: string; fromAmount: string; toAmount: string; rate: string; feeUsdt: string; slippage: string; quoteId: string; validForSec: number }

export function ConvertConfirm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const state = loc.state as State | null
  const [seconds, setSeconds] = useState(state?.validForSec ?? 0)
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation<{ body: { fromAsset: string; toAsset: string; fromAmount: string; toAmount: string; quoteId: string } }, Transaction>('api.wallet.convert.execute', {
    invalidates: ['api.wallet.balances.list', 'api.tx.list'],
  })

  useEffect(() => {
    if (seconds <= 0) return
    const i = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(i)
  }, [seconds])

  if (!state) {
    nav(ROUTES['route.wallet.convert'].path, { replace: true })
    return null
  }

  const submit = async () => {
    setError(null)
    try {
      const tx = await m.mutateAsync({ body: { fromAsset: state.from, toAsset: state.to, fromAmount: state.fromAmount, toAmount: state.toAmount, quoteId: state.quoteId } })
      nav(routeFor('route.wallet.tx-detail', { txId: tx.id }), { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('convert.confirmSwap')} />

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        <Row label={t('common.from')} value={`${state.fromAmount} ${state.from}`} />
        <div style={{ height: 1, background: 'var(--divider)', margin: '8px 0', position: 'relative' }}>
          <div className="ic" style={{ width: 24, height: 24, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg)' }}>
            <Icon name="swap" size={12} />
          </div>
        </div>
        <Row label={t('common.to')} value={`${state.toAmount} ${state.to}`} valueClass="grn" />
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('common.rate'), `1 ${state.from} = ${state.rate} ${state.to}`],
          [t('convert.feePct', { pct: '0.25' }), `${state.feeUsdt} USDT`],
          [t('convert.slippage'), `${state.slippage}%`],
          [t('convert.quoteIdLabel'), `#${state.quoteId.slice(-9)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 8, marginTop: 6, textAlign: 'center' }}>
        <div className="t3">{t('convert.quoteExpiresIn')}</div>
        <div className="grn" style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{seconds.toString().padStart(2, '0')}s</div>
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" onClick={() => nav(-1)} style={{ flex: 1, padding: 10, margin: 0 }}>{t('common.cancel')}</button>
        <button className="btn btn-g" onClick={submit} style={{ flex: 1, padding: 10, margin: 0 }} disabled={m.isPending || seconds <= 0}>
          <Icon name="fp" size={12} color="#fff" />
          {m.isPending ? t('convert.swapping') : t('common.confirm')}
        </button>
      </div>
    </PhoneShell>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="t3">{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: valueClass === 'grn' ? 'var(--gl)' : 'var(--text-strong)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
