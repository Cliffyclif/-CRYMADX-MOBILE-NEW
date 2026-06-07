import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { AssetPicker } from '../../components/AssetPicker'
import { useEndpoint } from '../../api/hooks'
import { api, getSupportedAssets } from '../../api/client'
import { ROUTES } from '../../routes'
import type { Balance, SwapQuote } from '../../api/endpoints'

export function Convert() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [from, setFrom] = useState('BTC')
  const [to, setTo] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [validForSec, setValidForSec] = useState(0)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const isMountedRef = useRef(true)

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
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Fetch a fresh quote. Used by both the debounce-on-input effect and the
  // explicit "Refresh quote" button after expiry.
  const fetchQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null)
      setValidForSec(0)
      return
    }
    setQuoteLoading(true)
    try {
      const q = await api<SwapQuote>('api.wallet.convert.quote', {
        body: { fromAsset: from, toAsset: to, fromAmount: amount },
      })
      if (!isMountedRef.current) return
      setQuote(q)
      setValidForSec(q.validForSec)
    } catch {
      if (!isMountedRef.current) return
      setQuote(null)
      setValidForSec(0)
    } finally {
      if (isMountedRef.current) setQuoteLoading(false)
    }
  }, [from, to, amount])

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); setValidForSec(0); return }
    const handle = setTimeout(fetchQuote, 250)
    return () => clearTimeout(handle)
  }, [fetchQuote, amount])

  useEffect(() => {
    if (!validForSec) return
    const i = setInterval(() => setValidForSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(i)
  }, [validForSec])

  const swap = () => { setFrom(to); setTo(from); setAmount('') }
  const isExpired = !!quote && validForSec <= 0

  // Available balance of the `from` asset + a quick % / MAX setter.
  const fromAvail = parseFloat(String(fromBal?.amount ?? '0').replace(/,/g, '')) || 0
  const setPct = (p: number) => {
    if (fromAvail <= 0) return
    const v = (fromAvail * p) / 100
    // Trim trailing zeros; cap precision so the field stays readable.
    setAmount(String(parseFloat(v.toFixed(8))))
  }

  const continueOrRefresh = () => {
    if (isExpired || (!quote && amount)) {
      fetchQuote()
      return
    }
    if (!quote) return
    nav(ROUTES['route.wallet.convert.confirm'].path, { state: { from, to, ...quote, fromAmount: amount } })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('convert.title')} />
      <div className="t2">{t('convert.subtitle')}</div>

      {/* FROM card */}
      <div className="g" style={{ padding: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="t3">{t('convert.youSend')}</div>
          <div className="t3" style={{ fontSize: 11 }}>Avail: {fromBal?.amount ?? '0'} {from}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number" inputMode="decimal" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, minWidth: 0, width: '100%', fontSize: 26, fontWeight: 800, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Outfit' }}
            step="any"
          />
          <div style={{ flexShrink: 0 }}>
            <AssetPicker value={from} onChange={setFrom} options={sortedAssets} caption="From" />
          </div>
        </div>
        {/* Quick percentage / MAX selectors */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[25, 50, 75, 100].map(p => (
            <button
              key={p} type="button" onClick={() => setPct(p)}
              disabled={fromAvail <= 0}
              style={{
                flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 800, borderRadius: 9,
                background: 'rgba(27,140,62,.08)', border: '1px solid rgba(27,140,62,.18)',
                color: 'var(--gl)', cursor: fromAvail > 0 ? 'pointer' : 'not-allowed',
                opacity: fromAvail > 0 ? 1 : 0.4, fontFamily: 'Outfit',
              }}
            >
              {p === 100 ? 'MAX' : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Swap button — overlaps the cards for a modern, less-empty feel */}
      <div style={{ textAlign: 'center', margin: '-12px 0', position: 'relative', zIndex: 2 }}>
        <button onClick={swap} className="ic" aria-label="Swap direction" style={{ width: 40, height: 40, margin: '0 auto', background: 'linear-gradient(135deg, var(--g), var(--gl))', boxShadow: '0 4px 16px rgba(27,140,62,.35)', border: '3px solid var(--bg)' }}>
          <Icon name="swap" size={17} color="#fff" />
        </button>
      </div>

      {/* TO card */}
      <div className="g" style={{ padding: 16 }}>
        <div className="t3" style={{ marginBottom: 8 }}>{t('convert.youReceiveEst')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 26, fontWeight: 800, color: quote ? 'var(--gl)' : 'var(--text-mid-30)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {quote?.toAmount ?? '0.00'}
          </div>
          <div style={{ flexShrink: 0 }}>
            <AssetPicker value={to} onChange={setTo} options={sortedAssets.filter(s => s !== from)} caption="To" />
          </div>
        </div>
      </div>

      {/* Rate + quote details — a filled card so the screen reads complete */}
      <div className="g" style={{ padding: 12, marginTop: 8 }}>
        <Row k="Rate" v={quote ? `1 ${from} = ${quote.rate} ${to}` : '—'} valueClass={quote ? 'grn' : undefined} />
        <Row k="Fee (0.25%)" v={quote ? `${quote.feeUsdt} USDT` : '—'} />
        <Row k="Slippage" v={quote ? `${quote.slippage}%` : '—'} />
        <Row k="Quote valid for" v={!quote ? '—' : validForSec > 0 ? `${validForSec}s` : 'expired'} valueClass={isExpired ? 'red' : undefined} />
      </div>

      <button
        className="btn btn-g"
        onClick={continueOrRefresh}
        style={{ marginTop: 10 }}
        disabled={!amount || quoteLoading}
      >
        {!amount
          ? t('convert.enterAmount')
          : quoteLoading
            ? t('convert.gettingQuote')
            : isExpired
              ? t('convert.refreshQuote', { defaultValue: 'Refresh quote' })
              : !quote
                ? t('convert.gettingQuote')
                : t('common.continue')}
      </button>
    </PhoneShell>
  )
}

function Row({ k, v, valueClass }: { k: string; v: string; valueClass?: string }) {
  const color = valueClass === 'grn' ? 'var(--gl)' : valueClass === 'red' ? 'var(--r)' : 'var(--text-strong)'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
      <span className="t3">{k}</span>
      <span style={{ color, fontWeight: 600 }}>{v}</span>
    </div>
  )
}

