import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import type { Transaction } from '../../api/endpoints'

export function TxDetail() {
  const { t } = useTranslation()
  const { txId = '' } = useParams()
  const { data: list, isLoading } = useEndpoint<{ items: Transaction[] }>('api.tx.list')
  const tx = list?.items?.find(t => t.id === txId || t.id === decodeURIComponent(txId))

  if (isLoading && !tx) {
    return <PhoneShell noTabs><ScreenHeader title={t('tx.transaction')} /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }
  if (!tx) {
    return <PhoneShell noTabs><ScreenHeader title={t('tx.transaction')} /><div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center', color: 'var(--r)' }}>{t('tx.txNotFound')}</div></PhoneShell>
  }

  const isPos = tx.type === 'deposit' || tx.type === 'reward'
  const sign = isPos ? '+' : tx.type === 'withdraw' ? '-' : ''
  const color = tx.type === 'withdraw' ? 'var(--r)' : 'var(--gl)'
  const baseAsset = (tx.asset ?? '').split('→')[0] || (tx.asset ?? '—')
  const isConvert = tx.type === 'convert' && tx.assetTo
  const displayAmount = isConvert
    ? `${tx.amount} ${tx.asset} → ${tx.amountTo ?? '?'} ${tx.assetTo}`
    : `${sign}${tx.amount} ${baseAsset}`

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
            <button onClick={() => navigator.clipboard.writeText(tx.txHash!)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Icon name="copy" size={12} color="var(--gl)" />
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}><Icon name="ext" size={12} /> {t('tx.explorer')}</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}><Icon name="share" size={12} /> {t('tx.share')}</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}><Icon name="refresh" size={12} /> {t('tx.repeat')}</button>
      </div>
    </PhoneShell>
  )
}

function shorten(addr: string): string {
  if (!addr || addr.length < 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
