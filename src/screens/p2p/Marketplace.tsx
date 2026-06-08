import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { ROUTES, routeFor } from '../../routes'
import type { P2POffer, P2PPaymentMethod } from '../../mock/db'

const ASSETS = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB'] as const
const FIATS = ['NGN', 'USD', 'EUR', 'GBP']
const ASSET_CHAIN: Record<string, string> = { USDT: 'ETH', USDC: 'ETH', BTC: 'BTC', ETH: 'ETH', BNB: 'BSC' }
const FIAT_SYM: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' }

const num = (v: string | number) => (Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })

export function Marketplace() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [asset, setAsset] = useState<typeof ASSETS[number]>('USDT')
  const [fiat, setFiat] = useState('NGN')
  const [posting, setPosting] = useState(false)
  // Backend filters on crypto + fiat + type (the web exchange's convention).
  const { data, isLoading } = useEndpoint<{ items: P2POffer[] }>('api.p2p.offers.list', { query: { crypto: asset, fiat, type: side } })

  const offers = data?.items ?? []

  return (
    <PhoneShell noTabs>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h2 style={{ flex: 1, margin: 0, fontSize: 24 }}>{t('p2p.title')}</h2>
        <button onClick={() => nav(ROUTES['route.p2p.payments'].path)} aria-label="Payment methods" style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface-soft)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="settings" size={17} color="var(--text-mid-50)" />
        </button>
        <button onClick={() => setPosting(true)} aria-label="Post an ad" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gl)', border: 'none', borderRadius: 12, padding: '0 14px', height: 38, cursor: 'pointer', color: '#fff', fontWeight: 800, fontFamily: 'inherit', fontSize: 14, boxShadow: '0 4px 14px rgba(0,200,83,.3)' }}>
          <Icon name="plus" size={15} color="#fff" /> Post
        </button>
      </div>

      {/* Buy / Sell segmented control */}
      <div style={{ display: 'flex', background: 'var(--surface-soft)', borderRadius: 14, padding: 4, marginTop: 12 }}>
        {(['buy', 'sell'] as const).map(s => {
          const on = side === s
          return (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 15,
                background: on ? (s === 'buy' ? 'var(--gl)' : 'var(--r)') : 'transparent',
                color: on ? '#fff' : 'var(--text-mid-40)', transition: 'all .15s',
                boxShadow: on ? `0 4px 14px ${s === 'buy' ? 'rgba(0,200,83,.3)' : 'rgba(239,68,68,.3)'}` : 'none',
              }}
            >
              {s === 'buy' ? t('p2p.tabBuy') : t('p2p.tabSell')}
            </button>
          )
        })}
      </div>

      {/* Asset chips */}
      <div style={{ display: 'flex', gap: 7, marginTop: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        {ASSETS.map(a => {
          const on = asset === a
          return (
            <button key={a} onClick={() => setAsset(a)} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', borderRadius: 999, padding: '7px 12px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: on ? '1px solid var(--gl)' : '1px solid var(--divider-soft)', background: on ? 'rgba(0,200,83,.12)' : 'transparent', color: on ? 'var(--gl)' : 'var(--text-mid-50)' }}>
              <CoinIcon symbol={a} size={17} /> {a}
            </button>
          )
        })}
      </div>

      {/* Fiat filter */}
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        {FIATS.map(f => (
          <button key={f} onClick={() => setFiat(f)} style={{ cursor: 'pointer', borderRadius: 9, padding: '7px 12px', border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, background: fiat === f ? 'var(--text-strong)' : 'var(--surface-soft)', color: fiat === f ? 'var(--bg)' : 'var(--text-mid-40)' }}>{f}</button>
        ))}
      </div>

      {/* Offers */}
      {isLoading && offers.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, marginTop: 12 }}><div className="t3">{t('common.loading') || 'Loading…'}</div></div>
      )}

      {!isLoading && offers.length === 0 && (
        <div className="g" style={{ padding: 28, marginTop: 14, textAlign: 'center', borderRadius: 16 }}>
          <div className="ic" style={{ width: 44, height: 44, margin: '0 auto 8px', background: 'var(--surface-soft)' }}><Icon name="handshake" size={20} color="var(--text-mid-40)" /></div>
          <div className="t3">No {side} offers for {asset}/{fiat} right now</div>
          <button className="btn btn-g" style={{ marginTop: 12, maxWidth: 200, marginInline: 'auto' }} onClick={() => setPosting(true)}>
            <Icon name="plus" size={14} color="#fff" /> Post the first ad
          </button>
        </div>
      )}

      {offers.map(o => {
        const isBuy = side === 'buy'
        const sym = FIAT_SYM[o.fiatCurrency] ?? ''
        const accent = isBuy ? 'var(--gl)' : 'var(--r)'
        return (
          <div key={o.id} style={{ marginTop: 12, background: 'var(--surface-soft)', borderRadius: 18, border: '1px solid var(--divider-soft)', overflow: 'hidden' }}>
            <div style={{ padding: 16 }}>
              {/* trader */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: 'linear-gradient(135deg, var(--g), var(--gl))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{o.sellerInitial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.sellerName}</span>
                    {o.verified && <Icon name="shield" size={13} color="var(--gl)" />}
                    {o.online && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gl)', flexShrink: 0, boxShadow: '0 0 6px var(--gl)' }} />}
                  </div>
                  <div className="t3" style={{ fontSize: 11, marginTop: 3 }}>
                    <span className="grn" style={{ fontWeight: 700 }}>{o.reputationPct}%</span> · {o.reputationCount} trades · ~{o.avgReleaseMin}m
                  </div>
                </div>
              </div>

              {/* price hero */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 14 }}>
                <span style={{ fontSize: 27, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums' }}>{sym}{num(o.price)}</span>
                <span className="t3" style={{ fontSize: 12 }}>{o.fiatCurrency} / {o.asset}</span>
              </div>

              {/* available + limits */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Available</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{num(o.available)} {o.asset}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <div className="t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Limit</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{sym}{num(o.minLimit)} – {sym}{num(o.maxLimit)}</div>
                </div>
              </div>

              {/* payment chips */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {o.paymentMethods.slice(0, 3).map(p => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,.05)', color: 'var(--text-mid-50)', padding: '4px 9px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />{p}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={() => nav(routeFor('route.p2p.offer', { offerId: o.id }))} style={{ width: '100%', padding: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, color: '#fff', background: accent }}>
              {isBuy ? t('p2p.buyAsset', { asset: o.asset }) : t('p2p.sellAsset', { asset: o.asset })}
            </button>
          </div>
        )
      })}

      {posting && <PostAdSheet defaultSide={side} defaultAsset={asset} defaultFiat={fiat} onClose={() => setPosting(false)} />}
    </PhoneShell>
  )
}

function PostAdSheet({ defaultSide, defaultAsset, defaultFiat, onClose }: { defaultSide: 'buy' | 'sell'; defaultAsset: string; defaultFiat: string; onClose: () => void }) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  const nav = useNavigate()
  const { data: pmData } = useEndpoint<{ items: P2PPaymentMethod[] }>('api.p2p.payments.list')
  const create = useEndpointMutation('api.p2p.ad.create', { invalidates: ['api.p2p.offers.list'] })

  const [type, setType] = useState<'buy' | 'sell'>(defaultSide)
  const [crypto, setCrypto] = useState(defaultAsset)
  const [fiat, setFiat] = useState(defaultFiat)
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [minLimit, setMinLimit] = useState('10')
  const [maxLimit, setMaxLimit] = useState('')
  const [pmSel, setPmSel] = useState<string[]>([])

  const methods = pmData?.items ?? []

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const toggle = (label: string) => setPmSel(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label])

  const submit = async () => {
    if (!price || parseFloat(price) <= 0) { toast.error('Enter a valid price'); return }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return }
    const pms = pmSel.length > 0 ? pmSel : methods.map(m => m.label)
    if (pms.length === 0) { toast.error('Add a payment method first'); return }
    try {
      await create.mutateAsync({
        body: {
          type, crypto, chain: ASSET_CHAIN[crypto] ?? 'ETH', fiat,
          price, amount,
          minLimit: minLimit || '10',
          maxLimit: maxLimit || String(parseFloat(amount) * parseFloat(price)),
          paymentMethods: pms,
          timeLimit: 30,
        },
      })
      toast.success('Ad posted!')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Could not post the ad')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Post a P2P ad" data-no-swipe-back onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 14px calc(16px + var(--safe-bottom, 0px))', boxShadow: '0 -10px 40px rgba(0,0,0,.4)', transform: `translateY(${dismiss.translateY}px)`, transition: dismiss.dragging ? 'none' : 'transform .18s ease-out', touchAction: 'pan-y' }}>
        <div {...dismiss.bind} style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ flex: 1, margin: 0 }}>Post an Ad</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
        </div>

        {/* I want to: Buy / Sell */}
        <div style={{ display: 'flex', background: 'var(--surface-soft)', borderRadius: 10, padding: 3, marginBottom: 10 }}>
          {(['buy', 'sell'] as const).map(s => (
            <button key={s} onClick={() => setType(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, background: type === s ? (s === 'buy' ? 'var(--gl)' : 'var(--r)') : 'transparent', color: type === s ? '#fff' : 'var(--text-mid-50)' }}>
              I want to {s}
            </button>
          ))}
        </div>

        {/* Asset + fiat */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Pick label="Asset" value={crypto} options={[...ASSETS]} onChange={setCrypto} />
          <Pick label="Currency" value={fiat} options={FIATS} onChange={setFiat} />
        </div>

        <Field label={`Price (${FIAT_SYM[fiat] ?? ''} per ${crypto})`} value={price} onChange={setPrice} placeholder="0.00" numeric />
        <Field label={`Total amount (${crypto})`} value={amount} onChange={setAmount} placeholder="0.00" numeric />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><Field label={`Min (${FIAT_SYM[fiat] ?? ''})`} value={minLimit} onChange={setMinLimit} placeholder="10" numeric /></div>
          <div style={{ flex: 1 }}><Field label={`Max (${FIAT_SYM[fiat] ?? ''})`} value={maxLimit} onChange={setMaxLimit} placeholder="auto" numeric /></div>
        </div>

        {/* Payment methods */}
        <div style={{ marginTop: 6 }}>
          <div className="t3" style={{ marginBottom: 4 }}>Payment methods</div>
          {methods.length === 0 ? (
            <button className="btn btn-o" style={{ padding: 9, fontSize: 13 }} onClick={() => { onClose(); nav(ROUTES['route.p2p.payments'].path) }}>
              <Icon name="plus" size={13} /> Add a payment method first
            </button>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {methods.map(m => {
                const on = pmSel.includes(m.label)
                return (
                  <button key={m.id} onClick={() => toggle(m.label)} style={{ cursor: 'pointer', borderRadius: 999, padding: '6px 12px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: on ? '1px solid var(--gl)' : '1px solid var(--divider)', background: on ? 'rgba(0,200,83,.12)' : 'transparent', color: on ? 'var(--gl)' : 'var(--text-mid-50)' }}>{m.label}</button>
                )
              })}
            </div>
          )}
        </div>

        <button className="btn btn-g" style={{ marginTop: 14 }} onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Posting…' : 'Post Ad'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, numeric }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="t3" style={{ marginBottom: 4 }}>{label}</div>
      <div className="inp"><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={numeric ? 'decimal' : 'text'} type={numeric ? 'number' : 'text'} style={{ width: '100%', minWidth: 0 }} /></div>
    </div>
  )
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="t3" style={{ marginBottom: 4 }}>{label}</div>
      <div className="inp" style={{ padding: 0 }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-strong)', fontFamily: 'inherit', fontSize: 15, padding: 10, outline: 'none' }}>
          {options.map(o => <option key={o} value={o} style={{ color: '#000' }}>{o}</option>)}
        </select>
      </div>
    </div>
  )
}
