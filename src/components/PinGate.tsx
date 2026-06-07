/**
 * PinGate — transaction-PIN confirmation modal, used imperatively:
 *
 *   const requirePin = usePinGate()
 *   if (!(await requirePin())) return   // user cancelled / failed
 *   // ...proceed with the money-out action
 *
 * Opt-in: if the user has no PIN set, requirePin() resolves true immediately
 * (no gate). When a PIN is set, it shows a keypad → POST /security/pin/verify,
 * which opens the 5-min server-side window the backend enforces.
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useEndpoint, useEndpointMutation } from '../api/hooks'
import { useSheetDismiss } from '../hooks/useSheetDismiss'
import { Icon } from './Icon'

type RequirePin = () => Promise<boolean>
const PinGateCtx = createContext<RequirePin>(async () => true)
export const usePinGate = (): RequirePin => useContext(PinGateCtx)

export function PinGateProvider({ children }: { children: React.ReactNode }) {
  const { data: status } = useEndpoint<{ isSet?: boolean }>('api.security.pin.status')
  const verify = useEndpointMutation('api.security.pin.verify')
  const dismiss = useSheetDismiss({ onDismiss: () => finish(false) })

  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const resolverRef = useRef<((ok: boolean) => void) | null>(null)
  const isSetRef = useRef<boolean>(false)
  isSetRef.current = !!status?.isSet

  const finish = (ok: boolean) => {
    setOpen(false)
    const r = resolverRef.current
    resolverRef.current = null
    r?.(ok)
  }

  const requirePin = useCallback<RequirePin>(() => {
    // No PIN set → opt-in: don't gate.
    if (!isSetRef.current) return Promise.resolve(true)
    return new Promise<boolean>((resolve) => {
      setPin(''); setError(null); setOpen(true)
      resolverRef.current = resolve
    })
  }, [])

  const onDigit = async (d: string) => {
    if (pin.length >= 6 || verify.isPending) return
    const next = pin + d
    setPin(next)
    if (next.length === 6) {
      setError(null)
      try {
        await verify.mutateAsync({ body: { pin: next } })
        finish(true)
      } catch (e) {
        setError((e as Error).message || 'Incorrect PIN')
        setPin('')
      }
    }
  }
  const onBack = () => setPin(p => p.slice(0, -1))

  return (
    <PinGateCtx.Provider value={requirePin}>
      {children}
      {open && (
        <div
          role="dialog" aria-modal="true" aria-label="Enter transaction PIN" data-no-swipe-back
          onClick={() => finish(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, background: 'var(--bg)', borderRadius: '20px 20px 0 0',
              padding: '12px 16px calc(18px + var(--safe-bottom, 0px))', boxShadow: '0 -10px 40px rgba(0,0,0,.45)',
              transform: `translateY(${dismiss.translateY}px)`, transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out', touchAction: 'pan-y',
            }}
          >
            <div {...dismiss.bind} style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}>
              <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div className="ic" style={{ width: 48, height: 48, margin: '4px auto 8px' }}><Icon name="pin" size={24} /></div>
              <h3 style={{ margin: 0 }}>Enter your PIN</h3>
              <div className="t3" style={{ marginTop: 4 }}>Confirm with your 6-digit transaction PIN</div>
            </div>

            {error && <div style={{ color: 'var(--r)', fontSize: 13, textAlign: 'center', marginTop: 6 }}>{error}</div>}

            <div className="pdots" style={{ margin: '14px auto' }}>{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`pdot ${pin.length > i ? 'f' : ''}`} />)}</div>

            <div className="kpad" style={{ gap: 10, padding: '0 6px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((v, i) => (
                <button
                  key={i} className="kk"
                  style={{ width: '100%', height: 60, fontSize: 24, fontWeight: 700, borderRadius: 16, visibility: v === '' ? 'hidden' : 'visible' }}
                  onClick={() => v === '⌫' ? onBack() : v !== '' ? onDigit(String(v)) : null}
                >
                  {v}
                </button>
              ))}
            </div>

            <button onClick={() => finish(false)} style={{ background: 'none', border: 'none', color: 'var(--text-mid-50)', fontSize: 14, cursor: 'pointer', display: 'block', margin: '12px auto 0', fontFamily: 'Outfit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </PinGateCtx.Provider>
  )
}
