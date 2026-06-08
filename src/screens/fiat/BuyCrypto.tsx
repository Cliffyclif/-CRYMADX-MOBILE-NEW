/**
 * BuyCrypto — fiat on-ramp via Guardarian.
 *
 * Mirrors src/screens/fiat/FiatScreen.tsx (production):
 *   GET  /api/fiat/currencies        → supported fiat, crypto, payment methods
 *   POST /api/fiat/buy/estimate      → live quote (debounced)
 *   POST /api/fiat/buy/create        → returns { checkoutUrl, redirectUrl, widgetUrl, orderId }
 *
 * Filtering rules (matching production):
 *   - Each fiat currency has an optional `paymentMethodIds: string[]` listing
 *     which payment methods it supports. We filter the payment dropdown by it.
 *   - When the selected fiat changes and the current payment isn't supported,
 *     auto-select the first available method.
 *   - When crypto changes, default the network to that asset's defaultNetwork.
 *
 * UI uses bottom-sheet pickers (search + icons) instead of native dropdowns.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { CheckoutModal } from '../../components/CheckoutModal'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { api, getToken } from '../../api/client'
import { fmt } from '../../lib/format'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { haptics } from '../../lib/haptics'
import { useAuth } from '../../stores/auth'
import { ROUTES } from '../../routes'
import { COUNTRIES } from '../../data/countries'

type FiatCurrency = {
  code: string
  name: string
  symbol?: string
  flag?: string
  minAmount?: number
  maxAmount?: number
  paymentMethodIds?: string[]
  isPayOutAllowed?: boolean
}
type CryptoCurrency = { symbol: string; name?: string; networks?: string[]; defaultNetwork?: string }
type PaymentMethod = { id: string; name: string; logo?: string; icon?: string; processingTime?: string; description?: string }
type CurrenciesResponse = { fiat: FiatCurrency[]; crypto: CryptoCurrency[]; paymentMethods: PaymentMethod[]; isLive?: boolean }

type Quote = {
  quoteId: string
  fiatAmount: string
  cryptoAmount: string
  rate: string
  fee: string
  networkFee: string
  validForSec: number
  minAmount?: number
  maxAmount?: number
}

const FALLBACK_FIAT: FiatCurrency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'us' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: 'eu' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: 'gb' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: 'ng' },
]

/**
 * Convert a 2-letter country/region code to its flag emoji.
 * "us" → 🇺🇸, "gb" → 🇬🇧, "eu" → 🇪🇺
 *
 * Uses Unicode regional indicator symbols (U+1F1E6 to U+1F1FF) which combine
 * pairs to form flag emojis on every modern browser/OS.
 */
function flagEmoji(code: string | undefined | null): string {
  if (!code) return '💵'
  const c = code.trim().toLowerCase()
  // Already an emoji (length > 2 or first char is a high surrogate)
  if (c.length > 3 || /\p{Emoji}/u.test(c.charAt(0))) return code
  // Currency code → country code: take first two letters (e.g. "USD" → "us")
  const cc = c.slice(0, 2)
  if (cc.length !== 2 || !/^[a-z]{2}$/.test(cc)) return '💵'
  const A = 0x1F1E6
  const codePoints = [
    A + (cc.charCodeAt(0) - 'a'.charCodeAt(0)),
    A + (cc.charCodeAt(1) - 'a'.charCodeAt(0)),
  ]
  return String.fromCodePoint(...codePoints)
}
const FALLBACK_CRYPTO: CryptoCurrency[] = [
  { symbol: 'BTC', name: 'Bitcoin', networks: ['Bitcoin'], defaultNetwork: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', networks: ['Ethereum'], defaultNetwork: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether', networks: ['TRON', 'Ethereum', 'BNB Chain'], defaultNetwork: 'TRON' },
  { symbol: 'USDC', name: 'USD Coin', networks: ['Ethereum', 'Polygon', 'Solana'], defaultNetwork: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana', networks: ['Solana'], defaultNetwork: 'Solana' },
]
const FALLBACK_PAY: PaymentMethod[] = [
  { id: 'card', name: 'Credit / Debit Card', icon: 'card' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'bank' },
  { id: 'apple_pay', name: 'Apple Pay', icon: 'apple' },
]

/**
 * Normalize whatever the profile has stored under `country` into an ISO-2 code.
 * Accepts the ISO-2 code directly ("US"), the ISO-3 code ("USA" → first match
 * by `code` is best-effort), or the country name ("United States"). Returns
 * empty string when no match — caller should treat that as "country unknown".
 */
function toCountryAlpha2(input: string | undefined | null): string {
  if (!input) return ''
  const v = input.trim()
  if (!v) return ''
  if (v.length === 2 && /^[A-Za-z]{2}$/.test(v)) return v.toUpperCase()
  const byName = COUNTRIES.find(c => c.name.toLowerCase() === v.toLowerCase())
  if (byName) return byName.code
  // Try contains-match — handles "Republic of X" vs "X" mismatches
  const fuzzy = COUNTRIES.find(c =>
    c.name.toLowerCase().includes(v.toLowerCase()) ||
    v.toLowerCase().includes(c.name.toLowerCase()),
  )
  return fuzzy?.code ?? ''
}

export function BuyCrypto() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)

  const { data: currencies } = useEndpoint<CurrenciesResponse>('api.fiat.currencies')
  const fiatList = currencies?.fiat?.length ? currencies.fiat : FALLBACK_FIAT
  const cryptoList = currencies?.crypto?.length ? currencies.crypto : FALLBACK_CRYPTO
  const payList = currencies?.paymentMethods?.length ? currencies.paymentMethods : FALLBACK_PAY

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [fiatCode, setFiatCode] = useState('USD')
  const [cryptoSymbol, setCryptoSymbol] = useState('BTC')
  const [network, setNetwork] = useState('')
  const [fiatAmount, setFiatAmount] = useState('100')
  const [paymentId, setPaymentId] = useState<string>('card')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Picker open states
  const [openPicker, setOpenPicker] = useState<null | 'fiat' | 'crypto' | 'payment'>(null)

  // In-app checkout iframe state
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  const selectedCrypto = useMemo(() => cryptoList.find(c => c.symbol === cryptoSymbol) ?? cryptoList[0], [cryptoList, cryptoSymbol])
  const selectedFiat = useMemo(() => fiatList.find(f => f.code === fiatCode) ?? fiatList[0], [fiatList, fiatCode])

  // Filter payment methods for the selected fiat (production rule:
  // selectedFiat.paymentMethodIds is the whitelist; empty = all allowed)
  const availablePayments = useMemo<PaymentMethod[]>(() => {
    if (!selectedFiat?.paymentMethodIds?.length) return payList
    return payList.filter(p => selectedFiat.paymentMethodIds!.includes(p.id))
  }, [selectedFiat, payList])

  const selectedPayment = useMemo(
    () => availablePayments.find(p => p.id === paymentId) ?? availablePayments[0] ?? payList[0],
    [availablePayments, paymentId, payList],
  )

  // Auto-fix invalid payment when fiat changes (production behavior)
  useEffect(() => {
    if (!selectedFiat || !payList.length) return
    const ids = selectedFiat.paymentMethodIds
    if (ids?.length && !ids.includes(paymentId)) {
      const first = payList.find(p => ids.includes(p.id))
      if (first) setPaymentId(first.id)
    }
  }, [selectedFiat, payList, paymentId])

  // When crypto changes, reset network to its default
  useEffect(() => {
    if (!selectedCrypto) return
    const def = selectedCrypto.defaultNetwork ?? selectedCrypto.networks?.[0] ?? ''
    setNetwork(def)
  }, [selectedCrypto])

  // Debounced live quote
  useEffect(() => {
    if (!user) { setQuote(null); return } // fiat ramp needs a signed-in account
    if (!fiatAmount || parseFloat(fiatAmount) <= 0 || !selectedCrypto || !selectedFiat || !selectedPayment) {
      setQuote(null); return
    }
    let cancelled = false
    setQuoteLoading(true)
    const t = setTimeout(async () => {
      try {
        const q = await api<Quote>('api.fiat.quote', {
          body: {
            fiatAmount: parseFloat(fiatAmount),
            fiatCurrency: selectedFiat.code,
            cryptoAsset: selectedCrypto.symbol,
            network: network || selectedCrypto.defaultNetwork || '',
            paymentMethod: selectedPayment.id,
          },
        })
        if (!cancelled) { setQuote(q); setError(null) }
      } catch (err) {
        if (!cancelled) {
          setQuote(null)
          const msg = (err as Error).message ?? 'Quote unavailable'
          setError(msg.length > 200 ? 'Quote unavailable for this combination' : msg)
        }
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [user, fiatAmount, fiatCode, cryptoSymbol, network, paymentId, selectedCrypto, selectedFiat, selectedPayment])

  const createOrder = useEndpointMutation<{ body: any }, any>('api.fiat.order.create')
  const refreshOrder = useEndpointMutation<{ pathParams: { orderId: string } }, any>('api.fiat.order.refresh')

  // Mints a fresh Guardarian checkout URL for an existing order (called
  // by CheckoutModal on retry / reopen). Returns null if refresh fails.
  const onRefreshCheckoutUrl = async (orderId: string): Promise<string | null> => {
    try {
      const r = await refreshOrder.mutateAsync({ pathParams: { orderId } })
      const fresh = r?.checkoutUrl ?? r?.redirectUrl ?? r?.checkout_url ?? r?.redirect_url ?? null
      if (fresh) setCheckoutUrl(fresh)
      return fresh
    } catch (err) {
      console.error('[BuyCrypto] refresh checkout failed:', err)
      return null
    }
  }

  const submit = async () => {
    if (!quote || !selectedCrypto || !selectedFiat || !selectedPayment) return
    setError(null)
    let walletAddress = ''
    try {
      const t = getToken()
      const headers: Record<string, string> = { 'Accept': 'application/json' }
      if (t) headers['Authorization'] = `Bearer ${t}`
      const root = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')
      const res = await fetch(`${root}/user/wallets`, { headers })
      if (res.ok) {
        const data = await res.json()
        const w: any = data?.wallets
        if (Array.isArray(w)) {
          const target = (network || selectedCrypto.defaultNetwork || '').toLowerCase()
          const found = w.find((x: any) => String(x.chain ?? '').toLowerCase() === target)
            ?? w.find((x: any) => String(x.chain ?? '').toLowerCase().startsWith(selectedCrypto.symbol.toLowerCase()))
            ?? w[0]
          walletAddress = found?.address ?? ''
        } else if (w && typeof w === 'object') {
          const candidates = [selectedCrypto.symbol.toUpperCase(), 'ETH']
          for (const k of candidates) if (w[k]?.address) { walletAddress = w[k].address; break }
        }
      }
    } catch { /* fall through */ }

    if (!walletAddress) {
      setError(`No ${selectedCrypto.symbol} wallet found for delivery. Set up your wallet first.`)
      return
    }

    // Pre-fill Guardarian with whatever profile data we have so the user
    // isn't asked to re-enter email + country inside the iframe. Backend
    // forwards these as Guardarian's `customer.contact_info.email` and
    // `customer.billing_info.{first_name,last_name,country_alpha_2}` —
    // when those are present Guardarian skips its manual-entry step.
    // Only the fields we actually have are sent; missing pieces (DOB,
    // street address) Guardarian collects on its own as needed.
    const userData = user
      ? (() => {
          const country = toCountryAlpha2(user.country)
          const data: Record<string, any> = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
          if (user.phone) data.phone = user.phone
          if (country) data.address = { country }
          return data
        })()
      : undefined

    try {
      const order = await createOrder.mutateAsync({
        body: {
          quoteId: quote.quoteId,
          fiatAmount: parseFloat(fiatAmount),
          fiatCurrency: selectedFiat.code,
          cryptoAsset: selectedCrypto.symbol,
          network: network || selectedCrypto.defaultNetwork || '',
          paymentMethod: selectedPayment.id,
          walletAddress,
          userData,
        },
      }) as { checkoutUrl?: string; redirectUrl?: string; widgetUrl?: string; orderId?: string; checkout_url?: string; redirect_url?: string; widget_url?: string; order_id?: string }

      // The response adapter normalizes both shapes; raw fields kept as fallback.
      const redirectUrl = order.checkoutUrl ?? order.redirectUrl ?? order.widgetUrl
        ?? (order as any).checkout_url ?? (order as any).redirect_url ?? (order as any).widget_url
      const orderId = order.orderId ?? (order as any).transaction_id ?? (order as any).order_id

      if (redirectUrl) {
        // Open the checkout inside an in-app iframe modal — popups get blocked
        // on mobile, especially after an async chain. The modal surfaces a
        // close X and listens for postMessage completion events.
        haptics.medium()
        setPendingOrderId(orderId ?? null)
        setCheckoutUrl(String(redirectUrl))
      } else if (orderId) {
        nav(`/buy/status/${encodeURIComponent(orderId)}`)
      } else {
        toast.error(t('buy.noCheckoutUrl') || 'Provider did not return a checkout URL')
      }
    } catch (err) {
      setError((err as Error).message ?? 'Could not create order')
    }
  }

  const onCheckoutComplete = (status: 'completed' | 'failed' | 'cancelled') => {
    if (status === 'completed') haptics.success()
    else if (status === 'failed') haptics.error()
    if (pendingOrderId) {
      nav(`/buy/status/${encodeURIComponent(pendingOrderId)}`)
    }
  }

  // Fiat on/off-ramp needs a signed-in account (the provider quote + order are
  // user-scoped). Without it the backend returns "No token provided" — so show a
  // clear sign-in prompt instead of a cryptic error.
  if (!user) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('buy.title')} />
        <div className="g" style={{ padding: 24, marginTop: 16, textAlign: 'center' }}>
          <div className="ic" style={{ width: 48, height: 48, margin: '0 auto 10px', background: 'rgba(0,200,83,.12)' }}><Icon name="lock" size={22} color="var(--gl)" /></div>
          <h3 style={{ margin: 0 }}>{t('buy.signInTitle') || 'Sign in to buy crypto'}</h3>
          <div className="t3" style={{ marginTop: 8, lineHeight: 1.5, maxWidth: 300, marginInline: 'auto' }}>
            The fiat on-ramp is powered by Guardarian and needs a verified account. Sign in to get a live quote and check out.
          </div>
          <button className="btn btn-g" style={{ marginTop: 16, maxWidth: 220, marginInline: 'auto' }} onClick={() => nav(ROUTES['route.auth.login'].path)}>
            {t('common.signIn') || 'Sign in'}
          </button>
        </div>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={side === 'buy' ? t('buy.title') : t('buy.sellTitle')} />

      <div className="tabs">
        <button className={`tab ${side === 'buy' ? 'a' : ''}`} onClick={() => setSide('buy')}>{t('buy.tabBuy')}</button>
        <button className={`tab ${side === 'sell' ? 'a' : ''}`} onClick={() => setSide('sell')}>{t('buy.tabSell')}</button>
      </div>

      {/* You Pay */}
      <div style={{ marginTop: 8 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{side === 'buy' ? t('buy.youPay') : t('buy.youSell')}</div>
        <div className="g" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" inputMode="decimal" placeholder="100" value={fiatAmount} onChange={e => setFiatAmount(e.target.value)}
            style={{ flex: 1, fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Outfit', minWidth: 0 }}
          />
          <PickerButton
            onClick={() => setOpenPicker('fiat')}
            leading={<span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(selectedFiat?.flag ?? selectedFiat?.code)}</span>}
            primary={selectedFiat?.code ?? 'USD'}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
          {['50', '100', '250', '500', '1000'].map(p => (
            <button key={p} className={`badge ${fiatAmount === p ? 'badge-g' : ''}`} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', background: fiatAmount === p ? 'var(--g)' : 'var(--surface-soft)', color: fiatAmount === p ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: 5 }} onClick={() => setFiatAmount(p)}>{selectedFiat?.symbol ?? '$'}{p}</button>
          ))}
        </div>
      </div>

      {/* You Receive */}
      <div style={{ marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{side === 'buy' ? 'You receive' : 'You receive (fiat)'}</div>
        <div className="g" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, fontSize: 22, fontWeight: 800, color: quote ? 'var(--gl)' : 'var(--text-mid-30)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {quoteLoading ? '…' : (quote ? fmt(quote.cryptoAmount, { grouping: false }) : '0.00')}
          </div>
          <PickerButton
            onClick={() => setOpenPicker('crypto')}
            leading={<CoinIcon symbol={cryptoSymbol} size={20} />}
            primary={cryptoSymbol}
          />
        </div>
      </div>

      {/* Network */}
      {selectedCrypto?.networks && selectedCrypto.networks.length > 1 && (
        <div className="g" style={{ padding: 10, marginTop: 6, display: 'flex', alignItems: 'center' }}>
          <div className="t3" style={{ flex: 1 }}>Network</div>
          <select
            value={network}
            onChange={e => setNetwork(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--gl)', fontSize: 14, fontFamily: 'Outfit', cursor: 'pointer', fontWeight: 700, textAlign: 'right' }}
          >
            {selectedCrypto.networks.map(n => <option key={n} value={n} style={{ color: '#000' }}>{n}</option>)}
          </select>
        </div>
      )}

      {/* Order summary */}
      {quote && (
        <div className="g" style={{ padding: 10, marginTop: 8 }}>
          <h3 style={{ fontSize: 14, marginBottom: 6 }}>Order Summary</h3>
          {[
            ['You pay', `${selectedFiat?.symbol ?? ''}${fmt(fiatAmount)} ${selectedFiat?.code ?? ''}`],
            ['Service fee', `${selectedFiat?.symbol ?? ''}${fmt(quote.fee)}`],
            ['Transaction fee', `~${selectedFiat?.symbol ?? ''}${fmt(quote.networkFee)}`],
            ['Rate', `1 ${cryptoSymbol} = ${selectedFiat?.symbol ?? ''}${fmt(quote.rate)}`],
            ['You receive', `${fmt(quote.cryptoAmount)} ${cryptoSymbol}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
              <span className="t3">{k}</span>
              <span style={{ color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment method */}
      <h3 style={{ marginTop: 8 }}>Payment method</h3>
      <button
        type="button"
        className="g"
        onClick={() => setOpenPicker('payment')}
        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: 12, border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 30, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, rgba(27,140,62,.15), rgba(0,200,83,.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="card" size={14} color="var(--gl)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: 'var(--text-strong)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedPayment?.name ?? 'Select payment method'}
          </div>
          <div className="t3">
            {availablePayments.length} method{availablePayments.length === 1 ? '' : 's'} available for {selectedFiat?.code}
          </div>
        </div>
        <span style={{ color: 'var(--text-mid-30)', fontSize: 14 }}>▾</span>
      </button>

      {error && (
        <div className="g" style={{ padding: 10, marginTop: 6, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>
          {error}
        </div>
      )}

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={!quote || createOrder.isPending}>
        {createOrder.isPending ? t('buy.creating') : t('buy.buyAction', { amount: quote?.cryptoAmount ?? '...', symbol: cryptoSymbol })}
      </button>
      <div className="t3" style={{ textAlign: 'center', marginTop: 6 }}>Powered by <span className="grn">Guardarian</span> · KYC required</div>

      {/* Sheets */}
      {openPicker === 'fiat' && (
        <FiatSheet
          options={fiatList}
          selected={fiatCode}
          onPick={(code) => { setFiatCode(code); setOpenPicker(null) }}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'crypto' && (
        <CryptoSheet
          options={cryptoList}
          selected={cryptoSymbol}
          onPick={(symbol) => { setCryptoSymbol(symbol); setOpenPicker(null) }}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'payment' && (
        <PaymentSheet
          options={availablePayments}
          selected={selectedPayment?.id ?? ''}
          fiatCode={selectedFiat?.code ?? ''}
          onPick={(id) => { setPaymentId(id); setOpenPicker(null) }}
          onClose={() => setOpenPicker(null)}
        />
      )}

      {/* In-app checkout iframe — replaces popups blocked on mobile. */}
      <CheckoutModal
        open={!!checkoutUrl}
        url={checkoutUrl}
        title={`${selectedFiat?.code ?? ''} → ${cryptoSymbol}`}
        onClose={() => setCheckoutUrl(null)}
        onComplete={onCheckoutComplete}
        orderId={pendingOrderId}
        onRefreshUrl={onRefreshCheckoutUrl}
      />
    </PhoneShell>
  )
}

// ─── Trigger button ─────────────────────────────────────────────
function PickerButton({ onClick, leading, primary }: { onClick: () => void; leading: React.ReactNode; primary: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'rgba(27,140,62,.08)',
        border: '1px solid rgba(27,140,62,.18)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {leading}
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gl)', lineHeight: 1.1 }}>{primary}</span>
      <Icon name="arrow" size={10} color="var(--gl)" />
    </button>
  )
}

// ─── Sheets ─────────────────────────────────────────────────────
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  const dismiss = useSheetDismiss({ onDismiss: onClose })
  return (
    <div
      role="dialog"
      aria-modal="true"
      data-no-swipe-back
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '82vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 6px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ flex: 1, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FiatSheet({ options, selected, onPick, onClose }: { options: FiatCurrency[]; selected: string; onPick: (code: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const filtered = options.filter(f =>
    !q.trim() ||
    f.code.toLowerCase().includes(q.toLowerCase()) ||
    f.name.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <Sheet title="Select currency" onClose={onClose}>
      <div className="inp" style={{ marginBottom: 8 }}>
        <Icon name="search" size={13} color="var(--text-mid-30)" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${options.length} currencies...`} style={{ flex: 1 }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(f => (
          <button
            key={f.code}
            onClick={() => onPick(f.code)}
            className="li"
            style={{ width: '100%', border: f.code === selected ? '1px solid rgba(0,200,83,.35)' : 'none', cursor: 'pointer', textAlign: 'left', background: f.code === selected ? 'rgba(0,200,83,.06)' : undefined }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, lineHeight: 1 }}>
              {flagEmoji(f.flag ?? f.code)}
            </div>
            <div className="li-c">
              <div className="li-n">{f.code} {f.code === selected && <span className="grn" style={{ fontSize: 14 }}>✓</span>}</div>
              <div className="li-s">{f.name}</div>
            </div>
            {f.symbol && <div className="li-r"><div className="li-d" style={{ fontSize: 15, color: 'var(--text-strong)' }}>{f.symbol}</div></div>}
          </button>
        ))}
        {filtered.length === 0 && <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">No currencies match "{q}"</div></div>}
      </div>
    </Sheet>
  )
}

function CryptoSheet({ options, selected, onPick, onClose }: { options: CryptoCurrency[]; selected: string; onPick: (sym: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const filtered = options.filter(c =>
    !q.trim() ||
    c.symbol.toLowerCase().includes(q.toLowerCase()) ||
    (c.name ?? '').toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <Sheet title="Select cryptocurrency" onClose={onClose}>
      <div className="inp" style={{ marginBottom: 8 }}>
        <Icon name="search" size={13} color="var(--text-mid-30)" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${options.length} cryptocurrencies...`} style={{ flex: 1 }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(c => (
          <button
            key={c.symbol}
            onClick={() => onPick(c.symbol)}
            className="li"
            style={{ width: '100%', border: c.symbol === selected ? '1px solid rgba(0,200,83,.35)' : 'none', cursor: 'pointer', textAlign: 'left', background: c.symbol === selected ? 'rgba(0,200,83,.06)' : undefined }}
          >
            <CoinIcon symbol={c.symbol} size={32} />
            <div className="li-c">
              <div className="li-n">{c.symbol} {c.symbol === selected && <span className="grn" style={{ fontSize: 14 }}>✓</span>}</div>
              <div className="li-s">{c.name ?? c.symbol}</div>
            </div>
            {c.networks && c.networks.length > 0 && (
              <div className="li-r">
                <span className="badge badge-g" style={{ fontSize: 9 }}>
                  {c.networks.length === 1 ? c.networks[0] : `${c.networks.length} networks`}
                </span>
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && <div className="g" style={{ padding: 16, textAlign: 'center' }}><div className="t3">No matches for "{q}"</div></div>}
      </div>
    </Sheet>
  )
}

function PaymentSheet({ options, selected, fiatCode, onPick, onClose }: { options: PaymentMethod[]; selected: string; fiatCode: string; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <Sheet title={`Payment for ${fiatCode}`} onClose={onClose}>
      {options.length === 0 ? (
        <div className="g" style={{ padding: 16, textAlign: 'center' }}>
          <div className="t3">No payment methods available for {fiatCode}.</div>
          <div className="t3" style={{ fontSize: 11, marginTop: 4 }}>Try a different fiat currency.</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {options.map(p => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="li"
              style={{ width: '100%', border: p.id === selected ? '1px solid rgba(0,200,83,.35)' : 'none', cursor: 'pointer', textAlign: 'left', background: p.id === selected ? 'rgba(0,200,83,.06)' : undefined }}
            >
              <div style={{ width: 36, height: 26, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="card" size={14} color="var(--gl)" />
              </div>
              <div className="li-c">
                <div className="li-n" style={{ fontSize: 15 }}>{p.name} {p.id === selected && <span className="grn" style={{ fontSize: 14 }}>✓</span>}</div>
                <div className="li-s">{p.processingTime ?? p.description ?? ''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}
