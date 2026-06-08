/**
 * PaymentSheet — Academy checkout bottom sheet.
 *
 * Flow: show the user's balances → pick a coin → we quote the live crypto
 * equivalent (USD price at pay-time) → Pay debits on-chain to the Education
 * Treasury and grants access immediately. Mirrors the web pay sheet.
 */
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { haptics } from '../../lib/haptics'
import { educationService, type EduQuote } from '../../services/educationService'

interface Balance { asset: string; chain: string; balance: string; usdValue?: string; usdValueRaw?: number; name?: string; logo?: string }

interface Props {
  open: boolean
  kind: 'course' | 'lms_access'
  courseId?: string
  title: string
  amountUsd: number
  onClose: () => void
  onPaid: () => void
}

const num = (v: any) => parseFloat(String(v ?? '0').replace(/,/g, '')) || 0

export function PaymentSheet({ open, kind, courseId, title, amountUsd, onClose, onPaid }: Props) {
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list', undefined, { enabled: open })
  const [sel, setSel] = useState<Balance | null>(null)
  const [quote, setQuote] = useState<EduQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')

  // Spendable rows = positive balance, richest first.
  const rows = useMemo(() => {
    const items = (bal?.items ?? []).filter(b => num(b.balance) > 0)
    return items.sort((a, b) => num(b.usdValue ?? b.usdValueRaw) - num(a.usdValue ?? a.usdValueRaw))
  }, [bal])

  useEffect(() => { if (!open) { setSel(null); setQuote(null); setErr('') } }, [open])

  // Re-quote whenever the selected asset changes.
  useEffect(() => {
    if (!sel) { setQuote(null); return }
    let live = true
    setQuoting(true); setErr('')
    educationService.quote({ kind, courseId, asset: sel.asset })
      .then(r => { if (live) setQuote(r.quote) })
      .catch(e => { if (live) setErr(e.message || 'Could not price this asset') })
      .finally(() => { if (live) setQuoting(false) })
    return () => { live = false }
  }, [sel?.asset, sel?.chain, kind, courseId])

  if (!open) return null

  const enough = quote && sel ? num(sel.balance) >= quote.asset_amount : false
  const totalUsd = quote ? quote.amount_usd + quote.fee_usd : amountUsd

  const doPay = async () => {
    if (!sel || !quote || !enough || paying) return
    setPaying(true); setErr('')
    try {
      haptics.medium()
      await educationService.pay({ kind, courseId, asset: sel.asset, chain: sel.chain })
      haptics.success()
      onPaid()
    } catch (e: any) {
      haptics.error()
      setErr(e.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '86vh', background: 'var(--bg-elev, #0c1410)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
          border: '1px solid rgba(255,255,255,.08)', borderBottom: 'none', padding: 18, paddingBottom: 'calc(18px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', animation: 'sheetUp .22s ease',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(255,255,255,.18)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-strong)' }}>Unlock {title}</div>
            <div className="t3" style={{ fontSize: 12.5 }}>
              {kind === 'lms_access' ? 'Full Academy access' : 'One-time course purchase'} · ${amountUsd.toFixed(2)}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}>
            <Icon name="x" size={16} color="var(--text-mid-60)" />
          </button>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '.6px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-mid-50)', margin: '16px 0 8px' }}>
          Pay with
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
          {rows.length === 0 && (
            <div className="t3" style={{ textAlign: 'center', padding: 24, fontSize: 13 }}>
              No spendable balance. Deposit or convert first, then come back to unlock this.
            </div>
          )}
          {rows.map(r => {
            const active = sel?.asset === r.asset && sel?.chain === r.chain
            return (
              <button
                key={`${r.asset}-${r.chain}`}
                onClick={() => { haptics.light(); setSel(r) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, cursor: 'pointer', fontFamily: 'Outfit', textAlign: 'left',
                  background: active ? 'rgba(0,200,83,.10)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${active ? 'rgba(0,200,83,.34)' : 'rgba(255,255,255,.06)'}`,
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.logo ? <img src={r.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gl)' }}>{r.asset.slice(0, 3)}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{r.asset} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-mid-50)' }}>· {r.chain}</span></div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mid-50)' }}>{num(r.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {r.asset}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)' }}>${num(r.usdValue ?? r.usdValueRaw).toFixed(2)}</div>
                  {active && <Icon name="check" size={14} color="var(--gl)" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Quote summary */}
        {sel && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
            {quoting ? (
              <div className="t3" style={{ fontSize: 12.5, textAlign: 'center' }}>Pricing {sel.asset}…</div>
            ) : quote ? (
              <>
                <Row label="Course price" value={`$${quote.amount_usd.toFixed(2)}`} />
                {quote.fee_usd > 0 && <Row label="Network fee" value={`$${quote.fee_usd.toFixed(2)}`} />}
                <Row label={`You pay (${quote.asset})`} value={`${quote.asset_amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}`} strong />
                <Row label="Total" value={`$${totalUsd.toFixed(2)}`} strong />
                {!enough && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>Not enough {sel.asset} on {sel.chain}.</div>}
              </>
            ) : null}
          </div>
        )}

        {err && <div style={{ fontSize: 12.5, color: '#ff6b6b', marginTop: 10, textAlign: 'center' }}>{err}</div>}

        <button
          onClick={doPay}
          disabled={!enough || paying || quoting}
          style={{
            marginTop: 14, height: 52, borderRadius: 14, border: 'none', fontFamily: 'Outfit', fontSize: 15, fontWeight: 800, cursor: enough && !paying ? 'pointer' : 'not-allowed',
            background: enough && !paying ? 'var(--gl)' : 'rgba(255,255,255,.08)',
            color: enough && !paying ? '#04130b' : 'var(--text-mid-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {paying ? 'Processing…' : enough ? <>Pay & unlock <Icon name="lock" size={15} color="#04130b" /></> : 'Select a coin'}
        </button>
        <div className="t3" style={{ fontSize: 10.5, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          Debited on-chain to the CrymadX Education Treasury. Access is granted instantly.
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 12.5, color: strong ? 'var(--text-strong)' : 'var(--text-mid-60)', fontWeight: strong ? 700 : 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: strong ? 'var(--gl)' : 'var(--text-strong)', fontWeight: strong ? 800 : 600 }}>{value}</span>
    </div>
  )
}

export default PaymentSheet
