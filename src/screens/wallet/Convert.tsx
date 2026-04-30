import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { AssetPicker } from '../../components/AssetPicker'
import { useEndpoint } from '../../api/hooks'
import { api, getSupportedAssets } from '../../api/client'
import { ROUTES } from '../../routes'
import type { Balance } from '../../api/endpoints'

export function Convert() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [from, setFrom] = useState('BTC')
  const [to, setTo] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<{ toAmount: string; rate: string; feeUsdt: string; slippage: string; quoteId: string } | null>(null)
  const [validForSec, setValidForSec] = useState(0)

  const fromBal = bal?.items?.find(b => b.asset === from)

  // Full supported list, sorted: held with USD value first, then alphabetical
  const allSupported = useMemo(() => getSupportedAssets(), [])
  const heldUsd = useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of (bal?.items ?? [])) {
      m[b.asset] = parseFloat(String(b.usdValue).replace(/,/g, '')) || 0
    }
    return m
  }, [bal])
  const sortedAssets = useMemo(() => {
    return [...allSupported].sort((a, b) => {
      const av = heldUsd[a] ?? 0, bv = heldUsd[b] ?? 0
      if (av && !bv) return -1
      if (!av && bv) return 1
      if (av && bv) return bv - av
      return a.localeCompare(b)
    })
  }, [allSupported, heldUsd])

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const q = await api<{ toAmount: string; rate: string; feeUsdt: string; slippage: string; quoteId: string; validForSec: number }>('api.wallet.convert.quote', {
          body: { fromAsset: from, toAsset: to, fromAmount: amount },
        })
        if (cancelled) return
        setQuote(q); setValidForSec(q.validForSec)
      } catch {
        if (!cancelled) setQuote(null)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [from, to, amount])

  useEffect(() => {
    if (!validForSec) return
    const i = setInterval(() => setValidForSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(i)
  }, [validForSec])

  const swap = () => { setFrom(to); setTo(from); setAmount('') }

  const continueToConfirm = () => {
    if (!quote) return
    nav(ROUTES['route.wallet.convert.confirm'].path, { state: { from, to, fromAmount: amount, ...quote } })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('convert.title')} />
      <div className="t2">{t('convert.subtitle')}</div>

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('convert.youSend')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number" inputMode="decimal" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Outfit' }}
            step="any"
          />
          <AssetPicker value={from} onChange={setFrom} options={sortedAssets} caption="From" />
        </div>
        <div className="t3" style={{ marginTop: 2 }}>Avail: {fromBal?.amount ?? '0'} {from}</div>
      </div>

      <div style={{ textAlign: 'center', margin: '4px 0' }}>
        <button onClick={swap} className="ic" style={{ width: 36, height: 36, margin: '0 auto', background: 'linear-gradient(135deg, var(--g), var(--gl))', boxShadow: '0 4px 16px rgba(27,140,62,.3)' }}>
          <Icon name="swap" size={16} color="#fff" />
        </button>
      </div>

      <div className="g" style={{ padding: 14 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('convert.youReceiveEst')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, fontSize: 22, fontWeight: 800, color: quote ? 'var(--gl)' : 'var(--text-mid-30)' }}>
            {quote?.toAmount ?? '0.00'}
          </div>
          <AssetPicker value={to} onChange={setTo} options={sortedAssets.filter(s => s !== from)} caption="To" />
        </div>
        {quote && <div className="t3" style={{ marginTop: 2 }}>Rate: 1 {from} = {quote.rate} {to}</div>}
      </div>

      {quote && (
        <div className="g" style={{ padding: 8, marginTop: 8 }}>
          <Row k={`Fee (0.25%)`} v={`${quote.feeUsdt} USDT`} />
          <Row k="Slippage" v={`${quote.slippage}%`} valueClass="grn" />
          <Row k="Quote valid for" v={validForSec > 0 ? `${validForSec}s` : 'expired'} />
        </div>
      )}

      <button className="btn btn-g" onClick={continueToConfirm} style={{ marginTop: 8 }} disabled={!quote || validForSec <= 0}>
        {!amount ? t('convert.enterAmount') : !quote ? t('convert.gettingQuote') : validForSec <= 0 ? t('convert.refreshQuote') : t('common.continue')}
      </button>
    </PhoneShell>
  )
}

function Row({ k, v, valueClass }: { k: string; v: string; valueClass?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '2px 0' }}>
      <span className="t3">{k}</span>
      <span style={{ color: valueClass === 'grn' ? 'var(--gl)' : 'var(--text-strong)' }}>{v}</span>
    </div>
  )
}

