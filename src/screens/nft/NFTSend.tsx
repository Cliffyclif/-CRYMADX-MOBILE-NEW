import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { NFT } from '../../mock/db'

export function NFTSend() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { nftId = '' } = useParams()
  const { data: nft } = useEndpoint<NFT>('api.nft.detail', { pathParams: { nftId } })
  const { data: feeData } = useEndpoint<{ fee?: string; feeUsd?: string }>('api.wallet.withdraw.fee', { query: { asset: 'ETH' } })
  const [recipient, setRecipient] = useState('')
  const [error, setError] = useState<string | null>(null)
  const m = useEndpointMutation('api.nft.send', { invalidates: ['api.nft.gallery', 'api.nft.detail'] })
  const networkFeeText = feeData?.feeUsd ? t('nft.gasFmt', { usd: feeData.feeUsd }) : feeData?.fee ? t('nft.gasFmtEth', { eth: feeData.fee }) : t('nft.estimating')

  if (!nft) return <PhoneShell noTabs><ScreenHeader title={t('nft.sendTitle')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const submit = async () => {
    setError(null)
    if (!recipient) { setError(t('nft.enterRecipient')); return }
    try {
      await m.mutateAsync({ pathParams: { nftId }, body: { recipient } })
      nav(ROUTES['route.nft.gallery'].path, { replace: true })
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('nft.sendTitle')} />

      <div className="g" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 50, height: 50, borderRadius: 8, background: nft.imageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,.3)', fontWeight: 800 }}>{nft.tokenId.replace('#', '')}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{nft.name}</div>
          <div className="t3">{nft.collection} · ERC-721</div>
          <div style={{ fontSize: 13, color: 'var(--gl)', marginTop: 2, fontWeight: 700 }}>≈ {nft.price} {nft.priceCurrency}</div>
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('nft.recipient')}</h3>
      <div className="inp">
        <Icon name="copy" size={14} />
        <input placeholder={t('nft.enterAddress', { chain: nft.chain })} value={recipient} onChange={e => setRecipient(e.target.value)} style={{ flex: 1 }} />
        <Icon name="camera" size={14} color="var(--gl)" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button className="badge badge-g" style={{ cursor: 'pointer', border: 'none' }} onClick={() => nav(ROUTES['route.wallet.beneficiaries'].path)}>{t('nft.beneficiariesBtn')}</button>
        <button className="badge badge-gd" style={{ cursor: 'pointer', border: 'none' }}>{t('nft.saveBtn')}</button>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        {[
          [t('common.network'), nft.chain],
          [t('withdraw.networkFee'), networkFeeText],
          [t('nft.standard'), 'ERC-721'],
          [t('nft.tokenId'), nft.tokenId],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '3px 0' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 8, marginTop: 6, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('nft.irreversible', { chain: nft.chain })}</div>
      </div>

      {error && <div className="g" style={{ padding: 10, marginTop: 4, borderLeft: '3px solid var(--r)', color: 'var(--r)', fontSize: 14 }}>{error}</div>}

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={m.isPending || !recipient}>
        <Icon name="fp" size={12} color="#fff" /> {m.isPending ? t('nft.sendingPin') : t('nft.sendNftPin')}
      </button>
    </PhoneShell>
  )
}
