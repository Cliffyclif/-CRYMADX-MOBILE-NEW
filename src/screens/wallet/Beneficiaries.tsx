import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { AssetPicker } from '../../components/AssetPicker'
import { WhitelistDisclaimer } from '../../components/WhitelistDisclaimer'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { Beneficiary } from '../../mock/db'

export function Beneficiaries() {
  const { t } = useTranslation()
  const { data, refetch, isLoading } = useEndpoint<{ items: Beneficiary[] }>('api.beneficiaries.list')
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const [name, setName] = useState('')
  const [asset, setAsset] = useState('BTC')
  const [network, setNetwork] = useState('')
  const [address, setAddress] = useState('')
  const [uid, setUid] = useState('')
  const [kind, setKind] = useState<'address' | 'uid'>('address')
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  // Bug #5 — capture the moment the user clicks "I Agree". The backend
  // verifies acknowledgedAt is within the last 5 minutes; stamping at submit
  // time (which is what the old code did) didn't reflect when the user
  // actually consented.
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null)

  const create = useEndpointMutation('api.beneficiaries.create', { invalidates: ['api.beneficiaries.list', 'api.wallet.whitelist.list'] })
  const remove = useEndpointMutation('api.beneficiaries.delete', { invalidates: ['api.beneficiaries.list', 'api.wallet.whitelist.list'] })

  // Networks for the selected asset (so the user picks a real chain, not free text)
  const { data: nets } = useEndpoint<{ networks: { id: string; name: string; recommended?: boolean }[] }>(
    'api.wallet.networks.list', { pathParams: { asset } },
  )

  // Pick recommended network when asset changes
  useMemo(() => {
    const list = nets?.networks ?? []
    if (list.length === 0) { setNetwork(''); return }
    if (list.some(n => n.id === network)) return
    setNetwork(list.find(n => n.recommended)?.id ?? list[0].id)
  }, [nets, asset]) // eslint-disable-line react-hooks/exhaustive-deps

  // Validate inputs and open the disclaimer modal. Actual save runs after the
  // user clicks "I Agree" on the disclaimer.
  const handleSaveClick = () => {
    if (kind === 'uid') {
      const norm = uid.trim().toUpperCase().replace(/[^0-9A-Z]/g, '')
      if (!name.trim() || (norm.length !== 6 && norm.length !== 8)) {
        toast.error('Enter a name and a valid 6-character UID')
        return
      }
    } else {
      if (!name.trim() || !address.trim() || !network) {
        toast.error(t('wallet.fillAllFields') || 'Fill all fields')
        return
      }
    }
    setDisclaimerOpen(true)
  }

  const performSave = async (ackOverride?: string) => {
    setDisclaimerOpen(false)
    // Bug #5 — prefer the explicit timestamp the disclaimer's onAgree passed
    // in (most accurate). Fall back to state, then to now() as last-resort.
    const ack = ackOverride || acknowledgedAt || new Date().toISOString()
    if (Date.now() - new Date(ack).getTime() > 4 * 60 * 1000) {
      toast.error('Please re-confirm — disclaimer expired')
      setAcknowledgedAt(null)
      setDisclaimerOpen(true)
      return
    }
    try {
      const body: any = kind === 'uid'
        ? {
            kind: 'uid',
            name: name.trim(),
            uid: uid.trim().toUpperCase().replace(/[^0-9A-Z]/g, ''),
            acknowledgedAt: ack,
          }
        : {
            name: name.trim(),
            asset,
            network,
            chain: network,
            address: address.trim(),
            acknowledgedAt: ack,
          }
      await create.mutateAsync({ body })
      toast.success(
        kind === 'uid'
          ? `${name.trim()} saved — active in 24 hours, or confirm via the email link we just sent.`
          : t('wallet.beneficiaryAdded') ||
            'Address saved. We just emailed you a link to confirm immediately — otherwise it activates in 24 hours.',
      )
      setName(''); setAddress(''); setUid(''); setShowAdd(false); setAcknowledgedAt(null)
      refetch()
    } catch (e: any) {
      const code = e?.code
      let msg: string
      if (code === 'NOT_AVAILABLE') {
        msg = 'The whitelist server is briefly unreachable. Try again in a moment.'
      } else if (code === 'ALREADY_SAVED') {
        msg = kind === 'uid' ? 'You already saved this UID.' : 'You already saved this address on this network.'
      } else if (code === 'UID_NOT_FOUND') {
        msg = "That UID doesn't belong to any CrymadX user."
      } else if (code === 'UID_FROZEN') {
        msg = 'This UID is currently frozen and can\'t be saved.'
      } else if (code === 'UID_SELF') {
        msg = "You can't save your own UID."
      } else if (code === 'INVALID_UID') {
        msg = 'UID format is invalid. It should be 6 characters, letters + digits.'
      } else if (code === 'ACK_REQUIRED' || code === 'ACK_STALE' || code === 'ACK_INVALID') {
        msg = 'Please re-confirm the security disclaimer.'
        setAcknowledgedAt(null)
        setDisclaimerOpen(true)
      } else {
        msg = e?.message || 'Could not save'
      }
      toast.error(msg)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Remove ${label}?`)) return
    try {
      await remove.mutateAsync({ pathParams: { id } })
      toast.success(t('wallet.beneficiaryRemoved') || 'Address removed')
      refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove')
    }
  }

  const items = (data?.items ?? []).filter(b => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      b.name?.toLowerCase().includes(q) ||
      b.asset?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      (b as any).uid?.toLowerCase().includes(q)
    )
  })
  const pending = items.filter(b => b.status === 'pending')
  const active = items.filter(b => b.status !== 'pending')

  return (
    <PhoneShell noTabs>
      <ScreenHeader
        title={t('wallet.beneficiariesTitle')}
        actions={
          <button
            onClick={() => setShowAdd(s => !s)}
            aria-label={showAdd ? 'Cancel' : 'Add address'}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              cursor: 'pointer',
              transform: showAdd ? 'rotate(45deg)' : 'none',
              transition: 'transform .15s',
            }}
          >
            <Icon name="plus" size={16} color="var(--gl)" />
          </button>
        }
      />
      <div className="t2">{t('wallet.savedAddresses')}</div>

      <div className="inp" style={{ marginTop: 8 }}>
        <Icon name="search" size={14} />
        <input
          placeholder={t('wallet.searchBeneficiaries')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {showAdd && (
        <div className="g" style={{ padding: 12, marginTop: 8 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 6 }}>
            {t('wallet.newBeneficiary')}
          </div>
          {/* Address vs UID kind toggle */}
          <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, marginBottom: 8, background: 'var(--surface-soft)', border: '1px solid var(--divider-soft)', borderRadius: 10 }}>
            {(['address', 'uid'] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                onClick={() => setKind(k)}
                style={{
                  flex: 1, padding: '8px 10px',
                  background: kind === k ? 'var(--bg)' : 'transparent',
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  color: kind === k ? 'var(--gl)' : 'var(--text-mid-40)',
                  cursor: 'pointer',
                }}
              >
                {k === 'address' ? '⛓️ Address' : '⚡ UID'}
              </button>
            ))}
          </div>
          <div className="inp">
            <Icon name="user" size={14} />
            <input
              placeholder={kind === 'uid' ? 'Label (e.g. "Mom")' : (t('wallet.labelPlaceholder') || 'Label (e.g. "Hardware wallet")')}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          {kind === 'address' ? (
            <>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <div className="inp" style={{ flex: 1, padding: 8, gap: 6 }}>
                  <CoinIcon symbol={asset} size={20} />
                  <span style={{ fontWeight: 700, color: 'var(--text-strong)', flex: 1 }}>{asset}</span>
                  <AssetPicker value={asset} onChange={setAsset} />
                </div>
                <select
                  value={network}
                  onChange={e => setNetwork(e.target.value)}
                  className="inp"
                  style={{ flex: 1, color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 14 }}
                >
                  {(nets?.networks ?? []).map(n => (
                    <option key={n.id} value={n.id} style={{ color: '#000' }}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div className="inp" style={{ marginTop: 6 }}>
                <Icon name="copy" size={14} />
                <input
                  placeholder={t('wallet.addressPlaceholder') || `Enter ${asset} address`}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            </>
          ) : (
            <div className="inp" style={{ marginTop: 6 }}>
              <Icon name="zap" size={14} color="var(--gl)" />
              <input
                placeholder="6-char UID (e.g. AB3C9D)"
                value={uid}
                onChange={e => setUid(e.target.value.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, fontWeight: 700 }}
              />
            </div>
          )}
          <div
            className="t3"
            style={{
              marginTop: 8,
              padding: 8,
              borderLeft: '3px solid var(--gd)',
              background: 'rgba(255,193,7,.06)',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <strong>Security:</strong> {t('wallet.whitelistDelay') || 'For your safety, new addresses become active 24 hours after they\'re added. We\'ll email you a link to confirm immediately.'}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className="btn btn-o"
              style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }}
              onClick={() => setShowAdd(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-g"
              style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }}
              onClick={handleSaveClick}
              disabled={
                create.isPending ||
                !name.trim() ||
                (kind === 'address'
                  ? !address.trim() || !network
                  : (() => { const n = uid.trim().toUpperCase().replace(/[^0-9A-Z]/g, ''); return n.length !== 6 && n.length !== 8 })())
              }
            >
              {create.isPending ? (t('auth.savingDots') || 'Saving…') : (t('common.save') || 'Save')}
            </button>
          </div>
        </div>
      )}

      <WhitelistDisclaimer
        open={disclaimerOpen}
        onAgree={() => {
          // Capture the agreement timestamp at the exact moment of consent
          // (Bug #5) and pass it to performSave directly to avoid the
          // async-state race.
          const ack = new Date().toISOString()
          setAcknowledgedAt(ack)
          performSave(ack)
        }}
        onCancel={() => {
          setDisclaimerOpen(false)
          setAcknowledgedAt(null)
        }}
      />

      {pending.length > 0 && (
        <>
          <div className="t3" style={{ margin: '12px 0 4px', fontWeight: 700 }}>
            {t('wallet.pendingCount', { count: pending.length }) || `Pending (${pending.length})`}
          </div>
          {pending.map(b => (
            <BenRow key={b.id} b={b} onDelete={() => handleDelete(b.id, b.name)} />
          ))}
        </>
      )}
      {active.length > 0 && (
        <>
          <div className="t3" style={{ margin: '12px 0 4px', fontWeight: 700 }}>
            {t('wallet.allCount', { count: active.length }) || `Saved (${active.length})`}
          </div>
          {active.map(b => (
            <BenRow key={b.id} b={b} onDelete={() => handleDelete(b.id, b.name)} />
          ))}
        </>
      )}

      {items.length === 0 && !showAdd && !isLoading && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">
            {search
              ? (t('wallet.noResults') || 'No matches')
              : (t('wallet.noBeneficiaries') || 'You haven\'t saved any addresses yet')}
          </div>
          {!search && (
            <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => setShowAdd(true)}>
              {t('wallet.addFirst') || 'Save your first address'}
            </button>
          )}
        </div>
      )}
    </PhoneShell>
  )
}

function BenRow({ b, onDelete }: { b: Beneficiary; onDelete: () => void }) {
  const isPending = b.status === 'pending'
  const isUidKind = (b as any).kind === 'uid'
  return (
    <div className="li">
      {isUidKind ? (
        <div
          style={{
            width: 32, height: 32, borderRadius: 16,
            background: 'rgba(0,200,83,.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="zap" size={16} color="var(--gl)" />
        </div>
      ) : (
        <CoinIcon symbol={b.asset} size={32} />
      )}
      <div className="li-c">
        <div
          className="li-n"
          style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: isPending ? 0.7 : 1 }}
        >
          {b.name}
          {b.favorite && <span className="gld">★</span>}
        </div>
        <div className="li-s" style={{ fontFamily: 'monospace' }}>
          {isUidKind ? `@${(b as any).uid}` : shorten(b.address)}
        </div>
        {isPending && b.cooldownEndsAt && (
          <div className="t3" style={{ fontSize: 10, color: 'var(--gd)', marginTop: 2 }}>
            ⏳ {cooldownLabel(b.cooldownEndsAt)}
          </div>
        )}
      </div>
      <div className="li-r" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          className={`badge ${isPending ? 'badge-gd' : 'badge-g'}`}
          style={{ fontSize: 9 }}
        >
          {isPending ? 'pending' : isUidKind ? 'UID' : (b.network || b.asset)}
        </span>
        <button
          onClick={onDelete}
          aria-label={`Remove ${b.name}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
          }}
        >
          <Icon name="trash" size={12} color="var(--text-mid-30)" />
        </button>
      </div>
    </div>
  )
}

function shorten(addr: string): string {
  if (!addr) return ''
  if (addr.length < 14) return addr
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`
}

function cooldownLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Activating…'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 1) return `Active in ${hours}h`
  const minutes = Math.max(1, Math.floor(ms / 60_000))
  return `Active in ${minutes}m`
}
