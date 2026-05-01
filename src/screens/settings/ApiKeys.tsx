import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'

/** Shape from /api/user/api-keys (matches main-site apiKeyService). */
type ApiKeyPermission =
  | 'read'
  | 'spot_trade'
  | 'staking'
  | 'savings'
  | 'p2p_trade'
  | 'autoinvest'
  | 'deposits'
  | 'withdraw'
  | 'crymadx_ai'

interface RealApiKey {
  id: string
  name: string
  description?: string
  apiKey: string
  apiKeyMasked?: string
  permissions: ApiKeyPermission[]
  isActive: boolean
  rateLimitTier?: string
  ipWhitelistEnabled?: boolean
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  totalRequests?: number
}

const PERMISSION_LABELS: Record<string, string> = {
  read: 'Read',
  spot_trade: 'Trade',
  trade: 'Trade',          // legacy alias from older keys
  staking: 'Staking',
  savings: 'Savings',
  p2p_trade: 'P2P',
  p2p: 'P2P',              // legacy alias
  autoinvest: 'Auto-Invest',
  deposits: 'Deposits',
  withdraw: 'Withdraw',
  crymadx_ai: 'AI',
}

function prettyPerm(p: string): string {
  if (PERMISSION_LABELS[p]) return PERMISSION_LABELS[p]
  // Fallback: snake_case → Title Case
  return p.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function ApiKeys() {
  const nav = useNavigate()
  const { data, isLoading, error, refetch } = useEndpoint<{ items: RealApiKey[] } | RealApiKey[]>(
    'api.settings.api-keys.list',
  )
  const remove = useEndpointMutation('api.settings.api-keys.delete', {
    invalidates: ['api.settings.api-keys.list'],
  })
  const create = useEndpointMutation<
    { body: { name: string; permissions: ApiKeyPermission[] } },
    RealApiKey & { apiSecret?: string }
  >('api.settings.api-keys.create', { invalidates: ['api.settings.api-keys.list'] })

  // Normalise — backend may return { items } or a bare array.
  const items: RealApiKey[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items ?? []
  }, [data])

  // "New key" modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPerms, setNewPerms] = useState<ApiKeyPermission[]>(['read'])
  const [createdSecret, setCreatedSecret] = useState<{ key: string; secret: string } | null>(null)

  const togglePerm = (p: ApiKeyPermission) => {
    setNewPerms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))
  }

  const submitCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name your key first')
      return
    }
    try {
      const r = await create.mutateAsync({
        body: { name: newName.trim(), permissions: newPerms },
      })
      // The secret is only shown once. Stash it for the modal copy step.
      setCreatedSecret({ key: r.apiKey, secret: (r as any).apiSecret ?? '' })
      setNewName('')
      setNewPerms(['read'])
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create key')
    }
  }

  const handleDelete = async (k: RealApiKey) => {
    if (!confirm(`Delete "${k.name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync({ pathParams: { keyId: k.id } })
      toast.success('Key deleted')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not delete key')
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader
        title="API keys"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            aria-label="Create new key"
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              cursor: 'pointer',
            }}
          >
            <Icon name="plus" size={16} color="var(--gl)" />
          </button>
        }
      />
      <div className="t2">For programmatic access (bots, AI, third-party apps)</div>

      <div
        className="g"
        style={{
          padding: 10,
          marginTop: 6,
          display: 'flex',
          gap: 8,
          borderLeft: '3px solid var(--r)',
          background: 'rgba(255,82,82,.05)',
        }}
      >
        <Icon name="lock" size={16} color="var(--r)" />
        <div className="t3" style={{ lineHeight: 1.4, fontSize: 12 }}>
          <span style={{ color: 'var(--r)', fontWeight: 700 }}>Never share your secret.</span> CrymadX
          will never ask for it. Treat keys like passwords.
        </div>
      </div>

      {isLoading && (
        <div className="g" style={{ padding: 24, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">Loading…</div>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="g"
          style={{
            padding: 14,
            marginTop: 8,
            borderLeft: '3px solid var(--r)',
            background: 'rgba(255,82,82,.06)',
          }}
        >
          <div style={{ color: 'var(--r)', fontSize: 13, fontWeight: 700 }}>Could not load keys</div>
          <div className="t3" style={{ marginTop: 4 }}>{(error as any)?.message ?? String(error)}</div>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <Icon name="key" size={32} color="var(--text-mid)" />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', marginTop: 10 }}>
            No keys yet
          </div>
          <div className="t3" style={{ marginTop: 4, fontSize: 12 }}>
            Create your first key to start automating trades, balance checks, or AI integrations.
          </div>
          <button className="btn btn-g" style={{ marginTop: 10 }} onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={14} color="#fff" />
            Create API key
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {items.map(k => (
            <KeyCard
              key={k.id}
              k={k}
              onOpen={() => nav(routeFor('route.settings.api-key', { keyId: k.id }))}
              onCopy={async () => {
                try {
                  await navigator.clipboard.writeText(k.apiKey)
                  toast.success('Public key copied')
                } catch {
                  toast.error('Could not copy')
                }
              }}
              onDelete={() => handleDelete(k)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && !createdSecret && (
        <CreateModal
          name={newName}
          setName={setNewName}
          perms={newPerms}
          togglePerm={togglePerm}
          isPending={create.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={submitCreate}
        />
      )}

      {/* Secret-shown-once modal */}
      {createdSecret && (
        <SecretModal
          apiKey={createdSecret.key}
          secret={createdSecret.secret}
          onClose={() => {
            setCreatedSecret(null)
            setCreateOpen(false)
            refetch()
          }}
        />
      )}
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Card — one row per saved API key. Generous spacing, clear hierarchy.
// ─────────────────────────────────────────────────────────────────────────
function KeyCard({
  k,
  onOpen,
  onCopy,
  onDelete,
}: {
  k: RealApiKey
  onOpen: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  // De-duplicate permissions in case the backend sent both `trade` and
  // `spot_trade` for legacy keys (they map to the same label).
  const uniquePerms = Array.from(
    new Map(k.permissions.map((p) => [prettyPerm(p), p])).values(),
  )

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen()
      }}
      style={{
        position: 'relative',
        padding: 16,
        borderRadius: 14,
        background: 'rgba(0,200,83,.035)',
        border: '1px solid rgba(255,255,255,.04)',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Status accent stripe */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: k.isActive ? 'var(--gl)' : 'var(--text-mid-30)',
        }}
      />

      {/* HEADER ROW */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: k.isActive ? 'rgba(0,200,83,.14)' : 'rgba(255,255,255,.05)',
            flexShrink: 0,
          }}
        >
          <Icon name="key" size={20} color={k.isActive ? 'var(--gl)' : 'var(--text-mid)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-strong)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {k.name}
            </div>
            <span
              style={{
                fontSize: 9,
                padding: '3px 9px',
                borderRadius: 999,
                background: k.isActive ? 'rgba(0,200,83,.16)' : 'rgba(255,255,255,.07)',
                color: k.isActive ? 'var(--gl)' : 'var(--text-mid)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.6px',
                flexShrink: 0,
              }}
            >
              {k.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--text-mid)',
              marginTop: 6,
              letterSpacing: '.3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {k.apiKeyMasked || maskKey(k.apiKey)}
          </div>
        </div>
      </div>

      {/* PERMISSIONS */}
      {uniquePerms.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-mid)',
              textTransform: 'uppercase',
              letterSpacing: '.8px',
              marginBottom: 8,
            }}
          >
            Permissions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {uniquePerms.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(0,200,83,.1)',
                  color: 'var(--gl)',
                  fontWeight: 600,
                }}
              >
                {prettyPerm(p)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* USAGE STATS */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <Stat label="Last used" value={k.lastUsedAt ? relTime(k.lastUsedAt) : 'Never'} />
        <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
        <Stat label="Requests" value={(k.totalRequests ?? 0).toLocaleString()} />
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 14,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCopy()
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 12px',
            borderRadius: 10,
            background: 'rgba(0,200,83,.1)',
            border: '1px solid rgba(0,200,83,.2)',
            color: 'var(--gl)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Outfit',
          }}
        >
          <Icon name="copy" size={13} color="var(--gl)" />
          Copy key
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Delete ${k.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '9px 12px',
            borderRadius: 10,
            background: 'rgba(255,82,82,.08)',
            border: '1px solid rgba(255,82,82,.2)',
            color: 'var(--r)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Outfit',
            gap: 6,
          }}
        >
          <Icon name="trash" size={13} color="var(--r)" />
          Delete
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-mid)',
          textTransform: 'uppercase',
          letterSpacing: '.6px',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-strong)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function CreateModal({
  name,
  setName,
  perms,
  togglePerm,
  isPending,
  onClose,
  onSubmit,
}: {
  name: string
  setName: (v: string) => void
  perms: ApiKeyPermission[]
  togglePerm: (p: ApiKeyPermission) => void
  isPending: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const allPerms: ApiKeyPermission[] = [
    'crymadx_ai',
    'read',
    'spot_trade',
    'staking',
    'savings',
    'p2p_trade',
    'autoinvest',
    'deposits',
    'withdraw',
  ]
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a160d',
          border: '1px solid rgba(0,200,83,.2)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 18,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 18px)',
          width: '100%',
          maxWidth: 420,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,.18)',
            margin: '0 auto 14px',
          }}
        />
        <h3 style={{ margin: '0 0 14px', fontSize: 17 }}>New API key</h3>

        <div style={{ marginBottom: 14 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>Name</div>
          <input
            className="inp"
            placeholder='e.g. "Trading bot"'
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            autoFocus
          />
        </div>

        <div className="t3" style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>Permissions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {allPerms.map((p) => {
            const on = perms.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePerm(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${on ? 'var(--gl)' : 'rgba(255,255,255,.08)'}`,
                  background: on ? 'rgba(0,200,83,.06)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Outfit',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `2px solid ${on ? 'var(--gl)' : 'var(--text-mid)'}`,
                    background: on ? 'var(--gl)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {on && <span style={{ color: '#000', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>
                    {PERMISSION_LABELS[p]}
                  </div>
                  <div className="t3" style={{ fontSize: 11, marginTop: 2 }}>
                    {permDesc(p)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-g"
            style={{ flex: 1, padding: 10, margin: 0 }}
            disabled={isPending || !name.trim() || perms.length === 0}
            onClick={onSubmit}
          >
            {isPending ? 'Creating…' : 'Create key'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SecretModal({
  apiKey,
  secret,
  onClose,
}: {
  apiKey: string
  secret: string
  onClose: () => void
}) {
  const [acked, setAcked] = useState(false)
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#0a160d',
          border: '1px solid rgba(255,193,7,.4)',
          borderRadius: 16,
          padding: 18,
          width: '100%',
          maxWidth: 380,
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,193,7,.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="shield" size={20} color="var(--gd)" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Save your secret now</h3>
        </div>
        <div className="t3" style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
          This is the <strong>only time</strong> we'll show your secret. Copy it somewhere safe — once
          you close this dialog, we can never show it again.
        </div>

        <div className="t3" style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
          API key (public)
        </div>
        <CopyBox value={apiKey} />

        <div className="t3" style={{ fontWeight: 700, marginTop: 12, marginBottom: 4, fontSize: 11 }}>
          API secret (show once)
        </div>
        <CopyBox value={secret} secret />

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: 10,
            marginTop: 14,
            border: `1px solid ${acked ? 'var(--gl)' : 'var(--divider)'}`,
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={acked}
            onChange={(e) => setAcked(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--gl)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-strong)', lineHeight: 1.4 }}>
            I've saved my secret somewhere safe.
          </span>
        </label>

        <button
          className="btn btn-g"
          disabled={!acked}
          style={{ width: '100%', marginTop: 14, padding: 10, opacity: acked ? 1 : 0.5 }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function CopyBox({ value, secret = false }: { value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(!secret)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 10,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid var(--divider)',
      }}
    >
      <div
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'var(--text-strong)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {revealed ? value : '••••••••••••••••••••'}
      </div>
      {secret && (
        <button
          type="button"
          onClick={() => setRevealed(r => !r)}
          aria-label={revealed ? 'Hide' : 'Show'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            color: 'var(--text-mid)',
            padding: 0,
          }}
        >
          <Icon name="eye" size={14} color="var(--text-mid)" />
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            toast.success('Copied')
          } catch {
            toast.error('Could not copy')
          }
        }}
        aria-label="Copy"
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
      >
        <Icon name="copy" size={14} color="var(--gl)" />
      </button>
    </div>
  )
}

function maskKey(k: string): string {
  if (!k) return ''
  if (k.length < 16) return k
  return `${k.slice(0, 8)}…${k.slice(-4)}`
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

function permDesc(p: ApiKeyPermission): string {
  switch (p) {
    case 'crymadx_ai':
      return 'Full unrestricted access — for the CrymadX AI bot.'
    case 'read':
      return 'View balances, transactions, prices.'
    case 'spot_trade':
      return 'Execute swaps and conversions.'
    case 'staking':
      return 'Stake / unstake assets.'
    case 'savings':
      return 'Manage savings deposits.'
    case 'p2p_trade':
      return 'Create / manage P2P orders.'
    case 'autoinvest':
      return 'Recurring DCA plans.'
    case 'deposits':
      return 'Generate / view deposit addresses.'
    case 'withdraw':
      return 'Withdraw to external wallets. Requires 2FA.'
    default:
      return ''
  }
}
