import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export function Withdraw() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: bal } = useEndpoint<{ items: Balance[] }>('api.wallet.balances.list')
  const [asset, setAsset] = useState<string>('BTC')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState<string>('')
  const [scanOpen, setScanOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const { scan } = useQRScanner()

  const { data: saved } = useEndpoint<{ items: Beneficiary[] }>('api.beneficiaries.list')
  const savedForAsset = (saved?.items ?? []).filter(
    b => String(b.asset).toUpperCase() === asset.toUpperCase(),
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

  // When asset changes, reset network to recommended
  useEffect(() => {
    const list = nets?.networks ?? []
    if (list.length === 0) { setNetwork(''); return }
    const reco = list.find(n => n.recommended)?.id ?? list[0].id
    setNetwork(reco)
  }, [nets, asset])

  const networkLabel = nets?.networks?.find(n => n.id === network)?.name ?? network

  const exceedsBalance = !!amount && parseFloat(amount) > balanceAmount
  const continueToConfirm = () => {
    nav(ROUTES['route.wallet.withdraw.confirm'].path, {
      state: { asset, address, amount, fee, network },
    })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('withdraw.title')} />

      <div className="steps">
        <div className="step"><div className="sn d">✓</div><div className="st">Asset</div></div>
        <div className="step"><div className="sn a">2</div><div className="st">Amount</div></div>
        <div className="step"><div className="sn">3</div><div className="st">Confirm</div></div>
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

      {/* Network selector — only when asset has multiple supported networks */}
      {(nets?.networks?.length ?? 0) > 1 && (
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
              style={{
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 700,
              }}
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
        disabled={!address || !amount || parseFloat(amount) <= 0 || !network || exceedsBalance}
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
  const { t } = useTranslation()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick saved address"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', width: '100%', maxWidth: 420,
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          padding: 16, maxHeight: '70vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>
            {t('withdraw.pickSavedTitle') || 'Saved'} {asset} {t('withdraw.addresses') || 'addresses'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-mid)' }}
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="t3" style={{ padding: 16, textAlign: 'center' }}>
            {t('withdraw.noSavedForAsset', { asset }) || `No saved ${asset} addresses yet.`}
          </div>
        ) : (
          items.map(b => {
            const isPending = b.status === 'pending'
            return (
              <button
                key={b.id}
                onClick={() => !isPending && onPick(b)}
                disabled={isPending}
                className="li"
                style={{
                  width: '100%',
                  border: 'none',
                  textAlign: 'left',
                  background: 'transparent',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.55 : 1,
                  padding: 8,
                }}
              >
                <div className="li-c">
                  <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {b.name}
                    {isPending && (
                      <span className="badge badge-gd" style={{ fontSize: 9 }}>pending</span>
                    )}
                  </div>
                  <div className="li-s" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {b.address.length > 18 ? `${b.address.slice(0, 10)}...${b.address.slice(-6)}` : b.address}
                  </div>
                  {isPending && b.cooldownEndsAt && (
                    <div className="t3" style={{ fontSize: 10, color: 'var(--gd)' }}>
                      ⏳ Active in {hoursLeft(b.cooldownEndsAt)}h
                    </div>
                  )}
                </div>
                {b.network && (
                  <span className="badge badge-g" style={{ fontSize: 9 }}>{b.network}</span>
                )}
              </button>
            )
          })
        )}
        <button
          onClick={onManage}
          className="btn btn-o"
          style={{ width: '100%', marginTop: 8 }}
        >
          {t('wallet.manageSaved') || 'Manage saved addresses'}
        </button>
      </div>
    </div>
  )
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
