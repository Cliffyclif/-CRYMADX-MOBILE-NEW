/**
 * NetworkPicker — sleek chain selector for the Withdraw flow. A full-width
 * tappable card (clearly labelled "Network") that opens a polished bottom sheet
 * to pick the chain (ETH / Polygon / BSC / …), mirroring AssetPicker's look so
 * the UI stays consistent and nothing overflows the layout.
 */
import { useEffect, useState } from 'react'
import { CoinIcon } from './CoinIcon'
import { Icon } from './Icon'
import { useSheetDismiss } from '../hooks/useSheetDismiss'

export type Net = { id: string; name: string; description?: string; recommended?: boolean }

type Props = {
  asset: string
  networks: Net[]
  value: string
  onChange: (id: string) => void
  /** Per-network funding balance for the asset (NaN amt ⇒ unknown). */
  balanceFor?: (netId: string) => { amt: number; usd?: number }
}

// Map a network id/name to the chain's native-token symbol for the coin icon.
function iconSymbol(net: Net): string {
  const k = `${net.id} ${net.name}`.toLowerCase()
  if (/polygon|matic|pol\b/.test(k)) return 'MATIC'
  if (/bsc|binance|bnb/.test(k)) return 'BNB'
  if (/arbitrum|arb\b/.test(k)) return 'ARB'
  if (/avalanche|avax/.test(k)) return 'AVAX'
  if (/optimism|\bop\b/.test(k)) return 'OP'
  if (/\bbase\b/.test(k)) return 'ETH'
  if (/solana|\bsol\b/.test(k)) return 'SOL'
  if (/tron|trx/.test(k)) return 'TRX'
  if (/bitcoin|\bbtc\b/.test(k)) return 'BTC'
  if (/litecoin|\bltc\b/.test(k)) return 'LTC'
  if (/dogecoin|doge/.test(k)) return 'DOGE'
  if (/ripple|\bxrp\b/.test(k)) return 'XRP'
  if (/ethereum|erc.?20|\beth\b/.test(k)) return 'ETH'
  return 'ETH'
}

const fmtAmt = (n: number) => (Number.isNaN(n) ? '' : n.toLocaleString(undefined, { maximumFractionDigits: 6 }))

export function NetworkPicker({ asset, networks, value, onChange, balanceFor }: Props) {
  const [open, setOpen] = useState(false)
  const dismiss = useSheetDismiss({ onDismiss: () => setOpen(false) })

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const sel = networks.find(n => n.id === value)

  return (
    <>
      {/* Trigger — full-width, clearly labelled, never overflows */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          marginTop: 6,
          borderRadius: 12,
          background: 'rgba(27,140,62,.06)',
          border: '1px solid rgba(27,140,62,.18)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <CoinIcon symbol={sel ? iconSymbol(sel) : 'ETH'} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-mid-40)' }}>
            Network
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gl)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sel?.name ?? 'Choose chain'}
          </div>
        </div>
        {sel?.recommended && (
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gl)', background: 'rgba(27,140,62,.14)', padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
            REC
          </span>
        )}
        <Icon name="arrow" size={11} color="var(--gl)" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select network"
          data-no-swipe-back
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '82vh',
              background: 'var(--bg)',
              borderRadius: '20px 20px 0 0',
              padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
              boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
              display: 'flex',
              flexDirection: 'column',
              transform: `translateY(${dismiss.translateY}px)`,
              transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
              touchAction: 'pan-y',
            }}
          >
            <div {...dismiss.bind} style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}>
              <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ flex: 1, margin: 0 }}>Select Network</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="t3" style={{ marginBottom: 8 }}>Choose the chain to send {asset} on.</div>

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {networks.map(n => {
                const isCurrent = n.id === value
                const b = balanceFor?.(n.id)
                const balText = b ? fmtAmt(b.amt) : ''
                return (
                  <button
                    key={n.id}
                    onClick={() => { onChange(n.id); setOpen(false) }}
                    className="li"
                    style={{
                      width: '100%',
                      border: isCurrent ? '1px solid rgba(0,200,83,.35)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isCurrent ? 'rgba(0,200,83,.06)' : undefined,
                    }}
                  >
                    <CoinIcon symbol={iconSymbol(n)} size={32} />
                    <div className="li-c">
                      <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {n.name}
                        {isCurrent && <span className="grn" style={{ fontSize: 14 }}>✓</span>}
                      </div>
                      <div className="li-s">
                        {n.recommended ? 'Recommended' : (n.description || 'Tap to select')}
                      </div>
                    </div>
                    {balText && (
                      <div className="li-r" style={{ textAlign: 'right' }}>
                        <div className="li-v" style={{ fontSize: 14 }}>{balText}</div>
                        <div className="li-d">{asset}</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
