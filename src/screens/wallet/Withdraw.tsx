import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { AssetPicker } from '../../components/AssetPicker'
import { QRScanModal } from '../../components/QRScanModal'
import { useEndpoint } from '../../api/hooks'
import { useQRScanner } from '../../hooks/useQRScanner'
import { ROUTES, routeFor } from '../../routes'
import { fmt } from '../../lib/format'
import { haptics } from '../../lib/haptics'
import type { Balance, Transaction } from '../../api/endpoints'
import type { Beneficiary } from '../../mock/db'

type Net = { id: string; name: string; description: string; recommended?: boolean }

// Pre-fill payload pushed in via location.state from the QR scanner.
type ScanPrefill = {
  asset?: string
  network?: string
  address?: string
  amount?: string
  memo?: string
  tag?: string
  ambiguous?: boolean
  fromScanner?: boolean
}

export function Withdraw() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const prefill = (loc.state as ScanPrefill | null) ?? null
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [asset, setAsset] = useState<string>(prefill?.asset || 'BTC')
  const [address, setAddress] = useState(prefill?.address || '')
  const [amount, setAmount] = useState(prefill?.amount || '')
  const [network, setNetwork] = useState<string>(prefill?.network || '')
  // UID-mode state — when active, recipient is identified by their CrymadX UID
  // and the transfer is internal (no on-chain TX, no fee).
  const [mode, setMode] = useState<'address' | 'uid'>('address')
  const [uid, setUid] = useState('')
  const prefillToastShown = useRef(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const { scan } = useQRScanner()

  const { data: saved } = useEndpoint<{ items: Beneficiary[] }>('api.beneficiaries.list')
  const savedForAsset = (saved?.items ?? []).filter(
    b => (b as any).kind !== 'uid' && String(b.asset).toUpperCase() === asset.toUpperCase(),
  )
  // Saved UID beneficiaries (independent of asset — UIDs are asset-agnostic)
  const savedUids = (saved?.items ?? []).filter(b => (b as any).kind === 'uid')

  // Live recipient lookup when in UID mode. Debounced through React Query's
  // built-in cache: same UID won't re-fetch within 30s.
  const normalizedUid = uid.trim().toUpperCase().replace(/[^0-9A-Z]/g, '')
  const uidLookupValid = mode === 'uid' && (normalizedUid.length === 6 || normalizedUid.length === 8)
  const { data: uidPreview, isLoading: uidLoading, error: uidError } = useEndpoint<{
    uid: string
    userId: string
    displayName: string
    username: string | null
    kycLevel: number
  }>(
    'api.user.uid.lookup',
    { query: { uid: normalizedUid } },
    { enabled: uidLookupValid, retry: false, staleTime: 30_000 },
  )

  const onScanClick = async () => {
    haptics.selection()
    const r = await scan()
    if (r.kind === 'value') {
      setAddress(parseQRPayload(r.value))
      haptics.success()
    } else if (r.kind === 'web') {
      setScanOpen(true)
    }
  }
  const onScanResult = (text: string) => {
    setAddress(parseQRPayload(text))
    toast.success(t('common.addressFromQR') || 'Address scanned')
  }

  const balance = bal?.items?.find(b => b.asset === asset)
  const balanceAmount = balance ? parseFloat(balance.amount.replace(/,/g, '')) || 0 : 0
  const { data: nets } = useEndpoint<{ networks: Net[] }>('api.wallet.networks.list', { pathParams: { asset } })
  const { data: feeData } = useEndpoint<{ fee: string; feeUsd?: string; receiveAmount?: string; minWithdrawal?: string; estimatedTime?: string }>(
    'api.wallet.withdraw.fee',
    { query: { asset, network, amount: amount || '1' } },
    { enabled: !!asset && !!network },
  )
  const fee = feeData?.fee ?? '0'
  // Backend behavior: the fee is taken OUT of the amount the user enters,
  // not on top of it. So total-debited = amount, recipient-receives =
  // amount - fee. (Backend returns `receiveAmount` directly when it has it.)
  const amountNum = parseFloat(amount || '0') || 0
  const feeNum = parseFloat(fee) || 0
  const receiveNum =
    feeData?.receiveAmount && parseFloat(feeData.receiveAmount) > 0
      ? parseFloat(feeData.receiveAmount)
      : Math.max(0, amountNum - feeNum)

  // Recent withdrawals of the selected asset (with permissive matching:
  // case-insensitive, plus aliases like MATIC↔POL).
  const { data: txs } = useEndpoint<{ items: Transaction[] }>('api.tx.list')
  const recent = (txs?.items ?? [])
    .filter(t => t.type === 'withdraw' && matchesAsset(t, asset))
    .slice(0, 5)

  // When asset changes, reset network to recommended. Skip the reset if the
  // current network is already valid for this asset (e.g. prefilled from
  // the QR scanner with an exact match like 'polygon' for MATIC).
  useEffect(() => {
    const list = nets?.networks ?? []
    if (list.length === 0) { setNetwork(''); return }
    const stillValid = network && list.some(n => n.id.toLowerCase() === network.toLowerCase())
    if (stillValid) return
    const reco = list.find(n => n.recommended)?.id ?? list[0].id
    setNetwork(reco)
  }, [nets, asset, network])

  // One-time toast when the user lands here from the QR scanner so they
  // see what was detected and don't think the form just magically filled.
  useEffect(() => {
    if (!prefill?.fromScanner || prefillToastShown.current) return
    prefillToastShown.current = true
    const msg = prefill.ambiguous
      ? `${prefill.asset} address detected — confirm the network if not Ethereum`
      : `${prefill.asset} (${prefill.network}) address pre-filled from QR`
    toast.success(msg)
    // Clear scanner state from history so a back nav doesn't re-trigger
    nav(loc.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const networkLabel = nets?.networks?.find(n => n.id === network)?.name ?? network

  const exceedsBalance = !!amount && parseFloat(amount) > balanceAmount
  const continueToConfirm = () => {
    if (mode === 'uid') {
      // Internal UID-to-UID transfer — handled differently in confirm screen.
      // No on-chain network fee; recipient identified by UID + display name.
      nav(ROUTES['route.wallet.withdraw.confirm'].path, {
        state: {
          mode: 'uid',
          asset,
          network,
          amount,
          fee: '0',
          recipientUid: normalizedUid,
          recipientName: uidPreview?.displayName ?? '',
          recipientUsername: uidPreview?.username ?? null,
        },
      })
    } else {
      nav(ROUTES['route.wallet.withdraw.confirm'].path, {
        state: { mode: 'address', asset, address, amount, fee, network },
      })
    }
  }
  const canContinue = mode === 'address'
    ? !!address && !!amount && parseFloat(amount) > 0 && !!network && !exceedsBalance
    : uidLookupValid && !!uidPreview && !!amount && parseFloat(amount) > 0 && !exceedsBalance

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('withdraw.title')} />

      <div className="steps">
        <div className="step"><div className="sn d">✓</div><div className="st">Asset</div></div>
        <div className="step"><div className="sn a">2</div><div className="st">Amount</div></div>
        <div className="step"><div className="sn">3</div><div className="st">Confirm</div></div>
      </div>

      {/* Send mode toggle: external blockchain address vs CrymadX UID */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          marginTop: 8,
          background: 'var(--surface-soft)',
          border: '1px solid var(--divider-soft)',
          borderRadius: 12,
        }}
      >
        {(['address', 'uid'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); haptics.selection() }}
            style={{
              flex: 1, padding: '10px 12px',
              background: mode === m ? 'var(--bg)' : 'transparent',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              color: mode === m ? 'var(--gl)' : 'var(--text-mid-40)',
              cursor: 'pointer',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
              transition: 'all .15s',
            }}
          >
            {m === 'address' ? '⛓️ Blockchain address' : '⚡ CrymadX UID'}
          </button>
        ))}
      </div>

      {/* Asset row */}
      <div className="g" style={{ padding: 12, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoinIcon symbol={asset} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>{asset}</div>
          <div className="t3">{t('withdraw.available', { amount: balance?.amount ?? '0', asset })}</div>
          {balance && parseFloat((balance.usdValue ?? '0').replace(/,/g, '')) > 0 && (
            <div className="t3" style={{ fontSize: 11 }}>≈ ${balance.usdValue}</div>
          )}
        </div>
        <AssetPicker value={asset} onChange={setAsset} />
      </div>

      {/* Network selector — address mode only. UID mode is chain-internal. */}
      {mode === 'address' && (nets?.networks?.length ?? 0) > 1 && (
        <div className="g" style={{ padding: 10, marginTop: 6, display: 'flex', alignItems: 'center' }}>
          <div className="t3" style={{ flex: 1 }}>{t('common.network')}</div>
          <select
            value={network}
            onChange={e => setNetwork(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--gl)', fontSize: 15, fontFamily: 'Outfit', cursor: 'pointer', fontWeight: 700, textAlign: 'right' }}
          >
            {nets!.networks.map(n => (
              <option key={n.id} value={n.id} style={{ color: '#000' }}>
                {n.name}{n.recommended ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'address' ? (
        <div style={{ marginTop: 8 }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>{t('common.address')}</div>
          <div className="inp">
            <Icon name="copy" size={14} />
            <input placeholder={`Enter ${asset} address`} value={address} onChange={e => setAddress(e.target.value)} />
            <button type="button" onClick={onScanClick} aria-label="Scan QR code" style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
              <Icon name="camera" size={14} color="var(--gl)" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {savedForAsset.length > 0 && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="badge badge-g"
                style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
              >
                📋 {t('withdraw.pickSaved') || 'Pick from saved'} ({savedForAsset.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => nav(ROUTES['route.wallet.beneficiaries'].path)}
              className="badge badge-gd"
              style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ⚙️ {t('wallet.manageSaved') || 'Manage'}
            </button>
          </div>
        </div>
      ) : (
        // ─── UID mode: short code → recipient lookup ───
        <div style={{ marginTop: 8 }}>
          <div className="t3" style={{ marginBottom: 4, fontWeight: 700 }}>Recipient UID</div>
          <div className="inp">
            <Icon name="user" size={14} />
            <input
              placeholder="6-char code (e.g. AB3C9D)"
              value={uid}
              onChange={e => setUid(e.target.value.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              style={{ fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}
            />
          </div>
          {/* Recipient preview */}
          {uidLookupValid && (
            <div
              className="g"
              style={{
                padding: 10,
                marginTop: 6,
                borderLeft: `3px solid ${uidPreview ? 'var(--gl)' : uidError ? 'var(--r)' : 'var(--gd)'}`,
                background: uidPreview ? 'rgba(0,200,83,.06)' : uidError ? 'rgba(255,77,77,.06)' : 'rgba(255,193,7,.06)',
              }}
            >
              {uidLoading && (
                <div className="t3" style={{ fontSize: 12 }}>Looking up @{normalizedUid}…</div>
              )}
              {!uidLoading && uidPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar circle with first initial — visual anchor for confirmation */}
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      background: 'rgba(0,200,83,.18)',
                      color: 'var(--gl)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {(uidPreview.displayName || uidPreview.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t3" style={{ fontSize: 10, color: 'var(--gl)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Confirm recipient
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.2, marginTop: 2 }}>
                      {uidPreview.displayName || 'CrymadX user'}
                    </div>
                    {uidPreview.username && uidPreview.username !== uidPreview.displayName && (
                      <div style={{ fontSize: 12, color: 'var(--gl)', fontWeight: 600, marginTop: 1 }}>
                        @{uidPreview.username}
                      </div>
                    )}
                    <div className="t3" style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                      UID {uidPreview.uid} {uidPreview.kycLevel >= 1 ? '· verified' : '· unverified'}
                    </div>
                  </div>
                  <Icon name="check" size={18} color="var(--gl)" />
                </div>
              )}
              {!uidLoading && uidError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="x" size={16} color="var(--r)" />
                  <div className="t3" style={{ fontSize: 12, color: 'var(--r)' }}>
                    {(uidError as any)?.statusCode === 404 ? "That UID doesn't belong to any CrymadX user" : 'Could not look up UID'}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Saved UIDs picker */}
          {savedUids.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {savedUids.slice(0, 6).map((b: any) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setUid(b.uid || ''); haptics.success() }}
                  className="badge badge-g"
                  style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, padding: '4px 8px' }}
                  title={b.name}
                >
                  ⚡ {b.name} (@{b.uid})
                </button>
              ))}
              <button
                type="button"
                onClick={() => nav(ROUTES['route.wallet.beneficiaries'].path)}
                className="badge badge-gd"
                style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ⚙️ Manage
              </button>
            </div>
          )}
          <div className="t3" style={{ fontSize: 11, marginTop: 8, opacity: 0.75 }}>
            CrymadX UIDs are 6-character codes that identify another user on the platform. Internal transfers are instant and free — no on-chain fee.
          </div>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="t3" style={{ fontWeight: 700 }}>{t('common.amount')}</div>
          <div className="t3">{t('common.min')}: {feeData?.minWithdrawal ?? '—'} {asset}</div>
        </div>
        <div className="inp">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}
            step="any"
          />
          <span style={{ marginLeft: 'auto', color: 'var(--text-strong)', fontWeight: 700 }}>{asset}</span>
          <button
            className="badge badge-g"
            onClick={() => balance && setAmount(balance.amount.replace(/,/g, ''))}
            style={{ marginLeft: 4, cursor: 'pointer', background: 'rgba(0,200,83,.1)', color: 'var(--gl)', border: 'none' }}
          >
            MAX
          </button>
        </div>
        {exceedsBalance && (
          <div className="t3 red" style={{ marginTop: 4 }}>Amount exceeds available balance ({balance?.amount ?? '0'} {asset})</div>
        )}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8 }}>
        <Row k="Network" v={networkLabel || '—'} />
        <Row k="Network Fee" v={`${fmt(feeNum)} ${asset}${feeData?.feeUsd && parseFloat(feeData.feeUsd) > 0 ? ` ≈ $${feeData.feeUsd}` : ''}`} />
        <Row k="Estimated arrival" v={feeData?.estimatedTime ?? '—'} />
        <Row k="You Send" v={`${fmt(amountNum)} ${asset}`} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '8px 0 0', paddingTop: 8, borderTop: '1px solid var(--divider)' }}>
          <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>Recipient receives</span>
          <span className="grn" style={{ fontWeight: 700 }}>{fmt(receiveNum)} {asset}</span>
        </div>
      </div>

      <button
        className="btn btn-g"
        onClick={continueToConfirm}
        style={{ marginTop: 8 }}
        disabled={!canContinue}
      >
        {t('common.continue')}
      </button>

      {/* Recent withdrawals of selected asset */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t('withdraw.recentWithdrawals', { asset })}</h3>
        <button
          onClick={() => nav(ROUTES['route.wallet.tx-history'].path)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gl)', fontSize: 13, fontWeight: 700 }}
        >
          View all →
        </button>
      </div>
      {recent.length === 0 ? (
        <div className="g" style={{ padding: 14, textAlign: 'center' }}>
          <div className="t3">{t('withdraw.noPrevious', { asset })}</div>
        </div>
      ) : (
        recent.map(tx => (
          <button
            key={tx.id}
            className="li"
            onClick={() => nav(routeFor('route.wallet.tx-detail', { txId: tx.id }))}
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <CoinIcon symbol={tx.asset} size={32} />
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>−{tx.amount} {tx.asset}</div>
              <div className="li-s">{formatDate(tx.createdAt)}{tx.network ? ` · ${tx.network}` : ''}</div>
            </div>
            <div className="li-r">
              <span className={`badge badge-${tx.status === 'completed' ? 'g' : tx.status === 'failed' ? 'r' : 'gd'}`} style={{ fontSize: 9 }}>
                {tx.status}
              </span>
            </div>
          </button>
        ))
      )}
      <QRScanModal open={scanOpen} onClose={() => setScanOpen(false)} onResult={onScanResult} />

      {pickerOpen && (
        <SavedAddressSheet
          asset={asset}
          items={savedForAsset}
          onPick={b => {
            setAddress(b.address)
            // If this address has a network we know about, lock it in.
            if (b.network && (nets?.networks ?? []).some(n => n.id === b.network)) {
              setNetwork(b.network)
            }
            setPickerOpen(false)
            haptics.success()
            toast.success(b.name + ' selected')
          }}
          onClose={() => setPickerOpen(false)}
          onManage={() => {
            setPickerOpen(false)
            nav(ROUTES['route.wallet.beneficiaries'].path)
          }}
        />
      )}
    </PhoneShell>
  )
}

function SavedAddressSheet({
  asset, items, onPick, onClose, onManage,
}: {
  asset: string
  items: Beneficiary[]
  onPick: (b: Beneficiary) => void
  onClose: () => void
  onManage: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick saved address"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 9000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a160d',
          border: '1px solid rgba(0, 200, 83, .2)',
          borderBottom: 'none',
          width: '100%',
          maxWidth: 420,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 18,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 18px)',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0,0,0,.5)',
        }}
      >
        {/* Drag handle */}
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoinIcon symbol={asset} size={22} />
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-strong)',
              }}
            >
              Saved {asset} addresses
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255,255,255,.06)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-mid)',
              fontSize: 18,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-mid)',
              fontSize: 13,
            }}
          >
            No saved {asset} addresses yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(b => {
              const isPending = b.status === 'pending'
              return (
                <button
                  key={b.id}
                  onClick={() => !isPending && onPick(b)}
                  disabled={isPending}
                  type="button"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid rgba(255,255,255,.06)',
                    borderRadius: 12,
                    background: isPending ? 'rgba(255,193,7,.04)' : 'rgba(0,200,83,.05)',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontFamily: 'Outfit',
                    transition: 'all .12s',
                  }}
                  onMouseEnter={e => {
                    if (!isPending) e.currentTarget.style.background = 'rgba(0,200,83,.1)'
                  }}
                  onMouseLeave={e => {
                    if (!isPending) e.currentTarget.style.background = 'rgba(0,200,83,.05)'
                  }}
                >
                  <CoinIcon symbol={b.asset} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-strong)',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 180,
                        }}
                      >
                        {b.name}
                      </span>
                      {isPending ? (
                        <span
                          style={{
                            fontSize: 9,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'rgba(255,193,7,.15)',
                            color: 'var(--gd)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '.5px',
                          }}
                        >
                          pending
                        </span>
                      ) : (
                        <Icon name="shield" size={11} color="var(--gl)" />
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: 'var(--text-mid)',
                        marginTop: 2,
                      }}
                    >
                      {shortAddr(b.address)}
                    </div>
                    {isPending && b.cooldownEndsAt && (
                      <div style={{ fontSize: 10, color: 'var(--gd)', marginTop: 3 }}>
                        ⏳ Active in {hoursLeft(b.cooldownEndsAt)}h
                      </div>
                    )}
                  </div>
                  {b.network && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(0,200,83,.12)',
                        color: 'var(--gl)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        flexShrink: 0,
                      }}
                    >
                      {b.network}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={onManage}
          type="button"
          style={{
            width: '100%',
            marginTop: 14,
            padding: 12,
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--text-strong)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Outfit',
          }}
        >
          Manage saved addresses
        </button>
      </div>
    </div>
  )
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 18) return addr
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`
}

function hoursLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 3_600_000))
}

/** Strip URI-style prefixes from a scanned crypto QR ("bitcoin:bc1q...?amount=0.1" → "bc1q...").
 *  Common on cold wallets / hardware wallets. */
function parseQRPayload(raw: string): string {
  if (!raw) return raw
  const trimmed = raw.trim()
  // chain:address?... → keep address only
  const m = trimmed.match(/^[a-z][a-z0-9]+:([a-zA-Z0-9_.-]+)(\?.*)?$/)
  if (m) return m[1]
  return trimmed
}

function Row({ k, v, valueClass }: { k: string; v: string; valueClass?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
      <span className="t3">{k}</span>
      <span className={valueClass ?? ''} style={{ color: valueClass === 'grn' ? 'var(--gl)' : 'var(--text-strong)' }}>{v}</span>
    </div>
  )
}

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

// Permissive symbol matching across asset/token/chain/network fields
// + common aliases (MATIC↔POL, BNB↔BSC, ETH chain stays ETH).
const ALIASES: Record<string, string[]> = {
  MATIC: ['MATIC', 'POL', 'POLYGON'],
  POL:   ['POL', 'MATIC', 'POLYGON'],
  BNB:   ['BNB', 'BSC', 'BEP20'],
  BSC:   ['BSC', 'BNB', 'BEP20'],
  ETH:   ['ETH', 'ETHEREUM', 'ERC20'],
  AVAX:  ['AVAX', 'AVALANCHE'],
  SOL:   ['SOL', 'SOLANA'],
  ARB:   ['ARB', 'ARBITRUM'],
  OP:    ['OP', 'OPTIMISM'],
  TRX:   ['TRX', 'TRON', 'TRC20'],
}
function matchesAsset(tx: any, sym: string): boolean {
  const want = (sym || '').toUpperCase()
  const candidates = new Set([want, ...(ALIASES[want] ?? [])])
  const fields = [tx.asset, tx.token, tx.symbol, tx.chain, tx.network]
    .filter(Boolean)
    .map((v: any) => String(v).toUpperCase())
  return fields.some(f => candidates.has(f))
}
