import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CoinIcon } from '../../components/CoinIcon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { Beneficiary } from '../../mock/db'

export function Beneficiaries() {
  const { t } = useTranslation()
  const { data, refetch } = useEndpoint<{ items: Beneficiary[] }>('api.beneficiaries.list')
  const [showAdd, setShowAdd] = useState(false)

  const [name, setName] = useState('')
  const [asset, setAsset] = useState('BTC')
  const [network, setNetwork] = useState('Bitcoin')
  const [address, setAddress] = useState('')
  const create = useEndpointMutation('api.beneficiaries.create', { invalidates: ['api.beneficiaries.list'] })
  const remove = useEndpointMutation('api.beneficiaries.delete', { invalidates: ['api.beneficiaries.list'] })

  const submit = async () => {
    if (!name || !address) return
    await create.mutateAsync({ body: { name, asset, network, address } })
    setName(''); setAddress(''); setShowAdd(false)
    refetch()
  }

  const items = data?.items ?? []
  const favorites = items.filter(b => b.favorite)
  const others = items.filter(b => !b.favorite)

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('wallet.beneficiariesTitle')} actions={<button onClick={() => setShowAdd(s => !s)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}><Icon name="plus" size={16} color="var(--gl)" /></button>} />
      <div className="t2">{t('wallet.savedAddresses')}</div>

      <div className="inp" style={{ marginTop: 8 }}>
        <Icon name="search" size={14} />
        <input placeholder={t('wallet.searchBeneficiaries')} style={{ flex: 1 }} />
      </div>

      {showAdd && (
        <div className="g" style={{ padding: 12, marginTop: 8 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 6 }}>{t('wallet.newBeneficiary')}</div>
          <div className="inp"><Icon name="user" size={14} /><input placeholder={t('wallet.labelPlaceholder')} value={name} onChange={e => setName(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="inp" style={{ flex: 1, color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 15 }}>
              {['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC', 'BNB'].map(a => <option key={a} value={a} style={{ color: '#000' }}>{a}</option>)}
            </select>
            <input placeholder={t('wallet.networkPlaceholder')} value={network} onChange={e => setNetwork(e.target.value)} className="inp" style={{ flex: 1 }} />
          </div>
          <div className="inp"><Icon name="copy" size={14} /><input placeholder={t('wallet.addressPlaceholder')} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn-o" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
            <button className="btn btn-g" style={{ flex: 1, padding: 8, margin: 0, fontSize: 14 }} onClick={submit} disabled={create.isPending || !name || !address}>
              {create.isPending ? t('auth.savingDots') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {favorites.length > 0 && <>
        <div className="t3" style={{ margin: '8px 0 4px', fontWeight: 700 }}>{t('wallet.favorites')}</div>
        {favorites.map(b => <BenRow key={b.id} b={b} onDelete={() => remove.mutate({ pathParams: { id: b.id } })} />)}
      </>}
      {others.length > 0 && <>
        <div className="t3" style={{ margin: '8px 0 4px', fontWeight: 700 }}>{t('wallet.allCount', { count: others.length })}</div>
        {others.map(b => <BenRow key={b.id} b={b} onDelete={() => remove.mutate({ pathParams: { id: b.id } })} />)}
      </>}

      {items.length === 0 && !showAdd && (
        <div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">{t('wallet.noBeneficiaries')}</div>
          <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => setShowAdd(true)}>{t('wallet.addFirst')}</button>
        </div>
      )}
    </PhoneShell>
  )
}

function BenRow({ b, onDelete }: { b: Beneficiary; onDelete: () => void }) {
  return (
    <div className="li">
      <CoinIcon symbol={b.asset} size={32} />
      <div className="li-c">
        <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{b.name} {b.favorite && <span className="gld">★</span>}</div>
        <div className="li-s" style={{ fontFamily: 'monospace' }}>{shorten(b.address)}</div>
      </div>
      <div className="li-r" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="badge badge-g" style={{ fontSize: 9 }}>{b.network}</span>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="trash" size={12} color="var(--text-mid-30)" />
        </button>
      </div>
    </div>
  )
}

function shorten(addr: string): string {
  if (addr.length < 14) return addr
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`
}
