import { useEffect, useMemo, useRef, useState } from 'react'
import { COUNTRIES, flagEmoji, type Country } from '../data/countries'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (c: Country) => void
  // 'name'  → "United Kingdom" on the row right side
  // 'dial'  → "+44" on the row right side
  variant?: 'name' | 'dial'
  selectedCode?: string  // ISO-2 of currently-picked country, highlights row
}

export function CountryPicker({ open, onClose, onSelect, variant = 'name', selectedCode }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      // Autofocus search after the sheet animates in.
      const id = window.setTimeout(() => inputRef.current?.focus(), 80)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dial.includes(q.replace(/^\+/, ''))
    )
  }, [query])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select country"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, height: '78vh',
          background: 'var(--surface, #0f1611)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 30px rgba(0,0,0,.4)',
        }}
      >
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Select country</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', color: 'var(--text-mid-40)', cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search country or code"
            style={{
              width: '100%', padding: '10px 12px',
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, color: 'var(--text-strong)',
              fontSize: 15, outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-mid-40)' }}>
              No matches
            </div>
          ) : (
            filtered.map(c => {
              const selected = c.code === selectedCode
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onSelect(c); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px',
                    background: selected ? 'rgba(27,140,62,.10)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,.04)',
                    cursor: 'pointer', textAlign: 'left',
                    color: 'var(--text-strong)',
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{flagEmoji(c.code)}</span>
                  <span style={{ flex: 1, fontSize: 15 }}>{c.name}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-mid-40)' }}>
                    {variant === 'dial' ? `+${c.dial}` : c.code}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
