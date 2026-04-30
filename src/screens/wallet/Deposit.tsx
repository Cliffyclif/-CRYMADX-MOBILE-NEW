import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint } from '../../api/hooks'
import type { Transaction } from '../../api/endpoints'

type Net = { id: string; name: string; description: string; recommended?: boolean }

export function Deposit() {
  const { t } = useTranslation()
  const { asset = 'BTC' } = useParams()
  const upper = asset.toUpperCase()
  const { data: nets } = useEndpoint<{ networks: Net[] }>('api.wallet.networks.list', { pathParams: { asset: upper } })
  const [network, setNetwork] = useState<string>('')

  // Pick recommended (or first) network as soon as the list arrives, and reset
  // when the asset changes.
  useEffect(() => {
    const list = nets?.networks ?? []
    if (list.length === 0) { setNetwork(''); return }
    const reco = list.find(n => n.recommended)?.id ?? list[0].id
    setNetwork(reco)
  }, [nets, upper])

  const { data, error, isLoading } = useEndpoint<{
    asset: string; network: string; address: string; minDeposit: string;
    confirmations: number; eta: string; memo?: string; tag?: string; qrData?: string;
  }>(
    'api.wallet.deposit.address',
    { pathParams: { asset: upper, network } },
    { enabled: !!network },
  )

  // Recent deposits of THIS asset (permissive matching across asset/token/chain
  // fields plus aliases like MATIC↔POL).
  const { data: txs } = useEndpoint<{ items: Transaction[] }>('api.tx.list')
  const recent = (txs?.items ?? [])
    .filter(t => t.type === 'deposit' && matchesAsset(t, upper))
    .slice(0, 4)

  const [copied, setCopied] = useState<'addr' | 'memo' | null>(null)
  const copy = async (text: string, kind: 'addr' | 'memo') => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1200)
  }

  // Friendly network name for display, prefer the one returned by the address
  // endpoint; fall back to the chosen option's label, or the chainId.
  const networkLabel = data?.network
    ?? nets?.networks?.find(n => n.id === network)?.name
    ?? (network ? network.toUpperCase() : '—')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('deposit.title')} />

      <div className="g" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoinIcon symbol={upper} size={32} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{upper}</div>
          <div className="t3">{networkLabel}</div>
        </div>
        {(nets?.networks?.length ?? 0) > 1 && (
          <select
            className="grn"
            value={network}
            onChange={e => setNetwork(e.target.value)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--gl)', fontSize: 14, fontFamily: 'Outfit', cursor: 'pointer', fontWeight: 700 }}
          >
            {nets!.networks.map(n => (
              <option key={n.id} value={n.id} style={{ color: '#000' }}>
                {n.name}{n.recommended ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
        {data?.address
          ? <div style={{ background: '#fff', padding: 12, borderRadius: 12 }}>
              <QRCodeSVG value={data.qrData ?? data.address} size={180} bgColor="#ffffff" fgColor="#000000" level="M" />
            </div>
          : <div className="g" style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 16 }}>
              <div className="t3">
                {isLoading || !network ? 'Loading address…' : (error ? <span className="red">{error.message}</span> : 'No address yet')}
              </div>
            </div>
        }
      </div>

      <div className="t3" style={{ textAlign: 'center', marginBottom: 6 }}>{t('common.scanQrOrCopy')}</div>

      <div className="g" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="t3" style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-strong)' }}>{data?.address ?? '—'}</div>
        <button className="badge badge-g" onClick={() => data?.address && copy(data.address, 'addr')} style={{ cursor: 'pointer', background: 'rgba(0,200,83,.1)', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }} disabled={!data?.address}>
          <Icon name={copied === 'addr' ? 'check' : 'copy'} size={10} color="var(--gl)" />
          {copied === 'addr' ? 'Copied' : 'Copy'}
        </button>
      </div>

      {(data?.memo || data?.tag) && (
        <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, borderLeft: '3px solid var(--gd)' }}>
          <div style={{ flex: 1 }}>
            <div className="t3" style={{ fontWeight: 700, color: 'var(--gd)' }}>
              {data.memo ? `MEMO required` : `DESTINATION TAG required`}
            </div>
            <div className="t3" style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>
              {data.memo ?? data.tag}
            </div>
          </div>
          <button className="badge badge-gd" onClick={() => copy(data.memo ?? data.tag ?? '', 'memo')} style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name={copied === 'memo' ? 'check' : 'copy'} size={10} />
            {copied === 'memo' ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <div className="stats" style={{ marginTop: 10 }}>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 15 }}>{data?.minDeposit ?? '—'}</div><div className="stat-l">Min</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 15, color: 'var(--text-strong)' }}>{data?.confirmations ?? '—'} blocks</div><div className="stat-l">Confirms</div></div>
        <div className="stat"><div className="stat-v" style={{ fontSize: 15, color: 'var(--text-strong)' }}>{data?.eta ?? '—'}</div><div className="stat-l">ETA</div></div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t('deposit.recentDeposits', { asset: upper })}</h3>
      </div>

      {recent.length === 0 ? (
        <div className="g" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>📥</div>
          <div className="t3">{t('deposit.noPreviousDeposits', { asset: upper })}</div>
          <div className="t3" style={{ fontSize: 11, marginTop: 2, color: 'var(--text-mid-30)' }}>
            Once you send to the address above, your deposit will appear here within {data?.eta ?? 'a few minutes'}.
          </div>
        </div>
      ) : (
        recent.map(tx => (
          <div key={tx.id} className="li" style={{ width: '100%' }}>
            <CoinIcon symbol={tx.asset} size={32} />
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>+{tx.amount} {tx.asset}</div>
              <div className="li-s">{formatDate(tx.createdAt)}{tx.network ? ` · ${tx.network}` : ''}</div>
            </div>
            <div className="li-r">
              <span className={`badge badge-${tx.status === 'completed' ? 'g' : tx.status === 'failed' ? 'r' : 'gd'}`} style={{ fontSize: 9 }}>
                {tx.status}
              </span>
            </div>
          </div>
        ))
      )}

      {/* marginTop: auto pushes the warning to the bottom of the available space */}
      <div className="g" style={{ padding: 10, marginTop: 'auto', display: 'flex', gap: 8, borderLeft: '3px solid var(--r)', alignItems: 'flex-start' }}>
        <span className="red" style={{ fontSize: 14, lineHeight: 1 }}>⚠</span>
        <div className="t3" style={{ lineHeight: 1.5, flex: 1 }}>
          <span className="red" style={{ fontWeight: 700 }}>Important:</span>{' '}
          Only send <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{upper}</span> on the{' '}
          <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{networkLabel}</span> network. Other tokens will be lost.
          {(data?.memo || data?.tag) && <> Always include the <span style={{ fontWeight: 700 }}>{data.memo ? 'MEMO' : 'destination tag'}</span> above — without it, your deposit will be lost.</>}
        </div>
      </div>
    </PhoneShell>
  )
}

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

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
