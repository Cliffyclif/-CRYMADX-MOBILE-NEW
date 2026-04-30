/**
 * AssetPicker — button that opens a polished bottom sheet for selecting a
 * cryptocurrency. Shows real coin icons, search, and prioritizes held assets.
 *
 * Usage:
 *   <AssetPicker value={asset} onChange={setAsset} />
 *
 * Reads the user's balances automatically so held coins float to the top
 * (sorted by USD value descending), the rest follow alphabetically.
 */
import { useEffect, useMemo, useState } from 'react'
import { CoinIcon } from './CoinIcon'
import { Icon } from './Icon'
import { useEndpoint } from '../api/hooks'
import { allAssets } from '../config/assets'
import { useSheetDismiss } from '../hooks/useSheetDismiss'
import type { Balance } from '../api/endpoints'

type Props = {
  value: string
  onChange: (next: string) => void
  /** Restrict the list of pickable symbols (defaults to all supported) */
  options?: string[]
  /** Optional label shown below the symbol (e.g. "From" / "To") */
  caption?: string
}

const ASSET_NAMES: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const a of allAssets) {
    if (!m[a.symbol.toUpperCase()]) m[a.symbol.toUpperCase()] = a.name
  }
  return m
})()

const ALL_SUPPORTED: string[] = (() => {
  const set = new Set<string>()
  for (const a of allAssets) set.add(a.symbol.toUpperCase())
  return Array.from(set).sort()
})()

export function AssetPicker({ value, onChange, options, caption }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const dismiss = useSheetDismiss({ onDismiss: () => setOpen(false) })
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')

  const heldUsd = useMemo(() => {
    const m: Record<string, { amount: string; usdValue: number }> = {}
    for (const b of (bal?.items ?? [])) {
      m[b.asset] = {
        amount: b.amount,
        usdValue: parseFloat(String(b.usdValue ?? '0').replace(/,/g, '')) || 0,
      }
    }
    return m
  }, [bal])

  const list = useMemo(() => {
    const base = (options ?? ALL_SUPPORTED).map(s => s.toUpperCase())
    const filter = q.trim().toUpperCase()
    const filtered = filter
      ? base.filter(s => s.includes(filter) || (ASSET_NAMES[s] ?? '').toUpperCase().includes(filter))
      : base
    return filtered.sort((a, b) => {
      const av = heldUsd[a]?.usdValue ?? 0
      const bv = heldUsd[b]?.usdValue ?? 0
      if (av && !bv) return -1
      if (!av && bv) return 1
      if (av && bv) return bv - av
      return a.localeCompare(b)
    })
  }, [options, heldUsd, q])

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const valueUpper = (value || '').toUpperCase()
  const valueName = ASSET_NAMES[valueUpper] ?? valueUpper

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setQ('') }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 10,
          background: 'rgba(27,140,62,.08)',
          border: '1px solid rgba(27,140,62,.18)',
          cursor: 'pointer',
        }}
      >
        <CoinIcon symbol={valueUpper} size={22} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gl)', lineHeight: 1.1 }}>{valueUpper}</div>
          {caption && <div style={{ fontSize: 10, color: 'var(--text-mid-40)', lineHeight: 1.1 }}>{caption}</div>}
          {!caption && valueName !== valueUpper && (
            <div style={{ fontSize: 10, color: 'var(--text-mid-40)', lineHeight: 1.1 }}>{valueName}</div>
          )}
        </div>
        <Icon name="arrow" size={10} color="var(--gl)" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select asset"
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
            {/* Drag handle — also acts as the swipe-down-to-dismiss touch target */}
            <div
              {...dismiss.bind}
              style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}
            >
              <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ flex: 1, margin: 0 }}>Select Asset</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="inp" style={{ marginBottom: 8 }}>
              <Icon name="search" size={13} />
              <input
                autoFocus
                placeholder={`Search ${list.length} assets...`}
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{ flex: 1 }}
              />
              {q && (
                <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Icon name="x" size={12} color="var(--text-mid-30)" />
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {list.length === 0 ? (
                <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 8 }}>
                  <div className="t3">No assets match "{q}"</div>
                </div>
              ) : list.map(s => {
                const held = heldUsd[s]
                const isCurrent = s === valueUpper
                return (
                  <button
                    key={s}
                    onClick={() => { onChange(s); setOpen(false) }}
                    className="li"
                    style={{
                      width: '100%',
                      border: isCurrent ? '1px solid rgba(0,200,83,.35)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isCurrent ? 'rgba(0,200,83,.06)' : undefined,
                    }}
                  >
                    <CoinIcon symbol={s} size={32} />
                    <div className="li-c">
                      <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s}
                        {isCurrent && <span className="grn" style={{ fontSize: 14 }}>✓</span>}
                      </div>
                      <div className="li-s">{ASSET_NAMES[s] ?? s}</div>
                    </div>
                    <div className="li-r" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      {held && parseFloat(held.amount.replace(/,/g, '')) > 0 ? (
                        <>
                          <div className="li-v" style={{ fontSize: 14 }}>{held.amount}</div>
                          <div className="li-d">${held.usdValue.toFixed(2)}</div>
                        </>
                      ) : (
                        <div className="t3" style={{ fontSize: 11 }}>0</div>
                      )}
                    </div>
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
