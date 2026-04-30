import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { Transaction } from '../../api/endpoints'

/** Map a chainId / network name to its public block explorer URL template. */
const EXPLORER: Record<string, (hash: string) => string> = {
  // EVM
  eth:        h => `https://etherscan.io/tx/${h}`,
  ethereum:   h => `https://etherscan.io/tx/${h}`,
  bsc:        h => `https://bscscan.com/tx/${h}`,
  bnb:        h => `https://bscscan.com/tx/${h}`,
  polygon:    h => `https://polygonscan.com/tx/${h}`,
  matic:      h => `https://polygonscan.com/tx/${h}`,
  pol:        h => `https://polygonscan.com/tx/${h}`,
  arb:        h => `https://arbiscan.io/tx/${h}`,
  arbitrum:   h => `https://arbiscan.io/tx/${h}`,
  op:         h => `https://optimistic.etherscan.io/tx/${h}`,
  optimism:   h => `https://optimistic.etherscan.io/tx/${h}`,
  base:       h => `https://basescan.org/tx/${h}`,
  avax:       h => `https://snowtrace.io/tx/${h}`,
  avalanche:  h => `https://snowtrace.io/tx/${h}`,
  ftm:        h => `https://ftmscan.com/tx/${h}`,
  fantom:     h => `https://ftmscan.com/tx/${h}`,
  // Non-EVM
  sol:        h => `https://solscan.io/tx/${h}`,
  solana:     h => `https://solscan.io/tx/${h}`,
  btc:        h => `https://blockstream.info/tx/${h}`,
  bitcoin:    h => `https://blockstream.info/tx/${h}`,
  ltc:        h => `https://blockchair.com/litecoin/transaction/${h}`,
  litecoin:   h => `https://blockchair.com/litecoin/transaction/${h}`,
  doge:       h => `https://blockchair.com/dogecoin/transaction/${h}`,
  dogecoin:   h => `https://blockchair.com/dogecoin/transaction/${h}`,
  bch:        h => `https://blockchair.com/bitcoin-cash/transaction/${h}`,
  tron:       h => `https://tronscan.org/#/transaction/${h}`,
  trx:        h => `https://tronscan.org/#/transaction/${h}`,
  xrp:        h => `https://xrpscan.com/tx/${h}`,
  ripple:     h => `https://xrpscan.com/tx/${h}`,
  xlm:        h => `https://stellar.expert/explorer/public/tx/${h}`,
  stellar:    h => `https://stellar.expert/explorer/public/tx/${h}`,
  ton:        h => `https://tonscan.org/tx/${h}`,
  near:       h => `https://nearblocks.io/txns/${h}`,
  cosmos:     h => `https://www.mintscan.io/cosmos/tx/${h}`,
  atom:       h => `https://www.mintscan.io/cosmos/tx/${h}`,
}

function explorerUrl(network: string | undefined, hash: string): string | null {
  if (!hash) return null
  const key = (network ?? '').toLowerCase().trim()
  if (!key) return null
  const fn = EXPLORER[key]
  return fn ? fn(hash) : null
}

export function TxDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const { txId = '' } = useParams()
  // Auto-refetch every 4s — newly-submitted txs often haven't propagated to
  // the list yet. Stop once we find it.
  // Fallback for brand-new submissions: WithdrawConfirm passes the tx via
  // navigation state so the screen has something useful to show before the
  // /transactions list catches up.
  const submitted = (loc.state as any)?.justSubmitted as Transaction | undefined
  const justState = (loc.state as any) as { asset?: string; amount?: string; address?: string; network?: string } | null
  const decoded = decodeURIComponent(txId)

  // Auto-refetch every 4s as long as we don't have the tx yet — newly
  // submitted withdrawals often haven't propagated to /transactions for
  // 10-30 s. Once we find it, polling stops automatically.
  const { data: list, isLoading } = useEndpoint<{ items: Transaction[] }>(
    'api.tx.list',
    {},
    {
      refetchInterval: (query) => {
        const items = (query.state.data as { items?: Transaction[] } | undefined)?.items
        const found = items?.some(t => t.id === txId || t.id === decoded)
        return found ? false : 4_000
      },
    },
  )
  const tx = list?.items?.find(t => t.id === txId || t.id === decoded)

  if (isLoading && !tx && !submitted) {
    return <PhoneShell noTabs><ScreenHeader title={t('tx.transaction')} /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }

  // No tx in list yet, but we know the user just submitted one — render a
  // friendly "Submitted" state. This is much better UX than a red error.
  if (!tx && submitted) {
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('tx.transaction')} />

        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div
            className="ic"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              background: 'rgba(0,200,83,.18)',
              boxShadow: '0 0 24px rgba(0,200,83,.25)',
            }}
          >
            <Icon name="check" size={28} color="var(--gl)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', marginTop: 10 }}>
            {t('tx.submittedTitle') || 'Withdrawal submitted'}
          </div>
          <div className="t3" style={{ marginTop: 4, fontSize: 13 }}>
            {t('tx.submittedBody') ||
              'We\'re sending it on-chain now. This usually takes a few minutes.'}
          </div>
        </div>

        <div className="g" style={{ padding: 12, marginTop: 6 }}>
          {justState?.amount && justState?.asset && (
            <Row k="Amount" v={`${justState.amount} ${justState.asset}`} />
          )}
          {justState?.network && <Row k="Network" v={justState.network} />}
          {justState?.address && <Row k="To" v={shorten(justState.address)} />}
          <Row k="Status" v="Processing" />
        </div>

        <div className="g" style={{ padding: 10, marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', borderLeft: '3px solid var(--gd)' }}>
          <Icon name="clock" size={16} color="var(--gd)" />
          <div className="t3" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {t('tx.submittedHint') ||
              'You can leave this screen — full details (transaction hash, confirmations, explorer link) appear once the network confirms it.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={() => nav(ROUTES['route.wallet.tx-history'].path)}
            className="btn btn-o"
            style={{ flex: 1, padding: 10, margin: 0 }}
          >
            <Icon name="clock" size={12} /> {t('tx.viewHistory') || 'View history'}
          </button>
          <button
            onClick={() => nav(ROUTES['route.tab.wallet'].path)}
            className="btn btn-g"
            style={{ flex: 1, padding: 10, margin: 0 }}
          >
            {t('common.done') || 'Done'}
          </button>
        </div>
      </PhoneShell>
    )
  }

  if (!tx) {
    // No tx in list and no nav state. Genuinely missing — friendly empty
    // state, not a red error wall.
    return (
      <PhoneShell noTabs>
        <ScreenHeader title={t('tx.transaction')} />
        <div className="g" style={{ padding: 18, marginTop: 8, textAlign: 'center' }}>
          <div className="ic" style={{ width: 56, height: 56, margin: '0 auto', background: 'rgba(255,193,7,.15)' }}>
            <Icon name="clock" size={28} color="var(--gd)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginTop: 10 }}>
            {t('tx.notReadyTitle') || 'Transaction is still processing'}
          </div>
          <div className="t3" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            {t('tx.notReadyBody') ||
              'It hasn\'t shown up in your history yet. Try again in a moment, or open your transaction history.'}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button
              onClick={() => nav(ROUTES['route.wallet.tx-history'].path)}
              className="btn btn-o"
              style={{ flex: 1, padding: 10, margin: 0 }}
            >
              {t('tx.viewHistory') || 'View history'}
            </button>
            <button
              onClick={() => nav(ROUTES['route.tab.wallet'].path)}
              className="btn btn-g"
              style={{ flex: 1, padding: 10, margin: 0 }}
            >
              {t('common.done') || 'Done'}
            </button>
          </div>
        </div>
      </PhoneShell>
    )
  }

  const isPos = tx.type === 'deposit' || tx.type === 'reward'
  const sign = isPos ? '+' : tx.type === 'withdraw' ? '-' : ''
  const color = tx.type === 'withdraw' ? 'var(--r)' : 'var(--gl)'
  const baseAsset = (tx.asset ?? '').split('→')[0] || (tx.asset ?? '—')
  const isConvert = tx.type === 'convert' && tx.assetTo
  const displayAmount = isConvert
    ? `${tx.amount} ${tx.asset} → ${tx.amountTo ?? '?'} ${tx.assetTo}`
    : `${sign}${tx.amount} ${baseAsset}`

  // Action handlers
  const exploreUrl = tx.txHash ? explorerUrl(tx.network, tx.txHash) : null
  const onExplorer = () => {
    if (!exploreUrl) {
      toast.error(t('tx.explorerUnavailable') || (tx.txHash ? `No explorer mapped for "${tx.network ?? 'this network'}"` : 'No on-chain hash on this transaction'))
      return
    }
    window.open(exploreUrl, '_blank', 'noopener,noreferrer')
  }

  const onShare = async () => {
    const text = isConvert
      ? `${tx.type} ${tx.amount} ${tx.asset} → ${tx.amountTo} ${tx.assetTo} on CrymadX`
      : `${tx.type} ${sign}${tx.amount} ${baseAsset} on CrymadX${tx.txHash ? ` · ${tx.txHash}` : ''}`
    const navAny: any = navigator
    try {
      if (typeof navAny.share === 'function') {
        await navAny.share({ title: 'CrymadX transaction', text, url: exploreUrl ?? undefined })
        return
      }
      if (navAny.clipboard?.writeText) {
        await navAny.clipboard.writeText(exploreUrl ?? text)
        toast.success(t('tx.copiedToClipboard') || 'Copied to clipboard')
      }
    } catch { /* user cancelled — nothing to do */ }
  }

  const onRepeat = () => {
    // Take the user back to the screen that originated this kind of tx,
    // pre-filling the asset so they don't have to re-pick it.
    if (tx.type === 'deposit' || tx.type === 'reward') {
      nav(ROUTES['route.wallet.deposit-pick'].path)
    } else if (tx.type === 'withdraw') {
      nav(ROUTES['route.wallet.withdraw'].path, { state: { asset: baseAsset } })
    } else if (tx.type === 'convert' || tx.type === 'trade') {
      nav(ROUTES['route.wallet.convert'].path, { state: { fromAsset: baseAsset, toAsset: tx.assetTo } })
    } else if (tx.type === 'card-topup') {
      nav(ROUTES['route.card.topup'].path)
    } else {
      nav(ROUTES['route.tab.wallet'].path)
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('tx.transaction')} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="ic" style={{ width: 50, height: 50, margin: '0 auto', background: 'rgba(0,200,83,.15)', boxShadow: '0 0 20px rgba(0,200,83,.2)' }}>
          <Icon name={tx.status === 'completed' ? 'check' : tx.status === 'failed' ? 'x' : 'clock'} size={26} />
        </div>
        <div className="t3" style={{ marginTop: 8, letterSpacing: 1 }}>{tx.type.toUpperCase()} · {tx.status.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 6 }}>{displayAmount}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('common.status'), tx.status],
          [t('common.type'), tx.type],
          [t('common.asset'), tx.asset],
          tx.network ? [t('common.network'), tx.network] : null,
          tx.confirmations !== undefined ? [t('tx.confirmations'), String(tx.confirmations)] : null,
          tx.fromAddress ? [t('common.from'), shorten(tx.fromAddress)] : null,
          tx.toAddress ? [t('common.to'), shorten(tx.toAddress)] : null,
          tx.blockHeight !== undefined ? [t('tx.block'), tx.blockHeight.toLocaleString()] : null,
          tx.fee ? [t('tx.networkFee'), `${tx.fee} ${tx.feeAsset ?? baseAsset}`] : null,
          [t('common.date'), new Date(tx.createdAt).toLocaleString()],
        ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)', textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>

      {tx.txHash && (
        <div className="g" style={{ padding: 10, marginTop: 6 }}>
          <div className="t3" style={{ marginBottom: 4 }}>{t('tx.txHash')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-strong)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.txHash}</div>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(tx.txHash!); toast.success(t('tx.copiedToClipboard') || 'Copied') } catch { /* noop */ }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              aria-label="Copy transaction hash"
            >
              <Icon name="copy" size={12} color="var(--gl)" />
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={onExplorer} className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} disabled={!exploreUrl}>
          <Icon name="ext" size={12} /> {t('tx.explorer')}
        </button>
        <button onClick={onShare} className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}>
          <Icon name="share" size={12} /> {t('tx.share')}
        </button>
        <button onClick={onRepeat} className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}>
          <Icon name="refresh" size={12} /> {t('tx.repeat')}
        </button>
      </div>
    </PhoneShell>
  )
}

function shorten(addr: string): string {
  if (!addr || addr.length < 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
      <span className="t3">{k}</span>
      <span style={{ color: 'var(--text-strong)', textAlign: 'right' }}>{v}</span>
    </div>
  )
}
