import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import type { VaultProduct } from '../../mock/db'

type Position = { id: string; principal: string; principalUsd?: string; status?: string }

export function Vault() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ items: VaultProduct[] }>('api.earn.vault.list')
  const { data: positions } = useEndpoint<{ items?: Position[]; positions?: Position[] }>('api.earn.savings.positions')
  const posList = positions?.items ?? positions?.positions ?? []
  const totalLocked = posList
    .filter((p: any) => (p.status ?? 'active') === 'active' && (p.kind === 'vault' || p.type === 'vault' || true))
    .reduce((sum: number, p: any) => sum + (parseFloat(p.principalUsd ?? p.principal ?? '0') || 0), 0)

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('earn.vaultTitle')} actions={<span className="badge badge-gd" style={{ fontSize: 10 }}>PRO</span>} />
      <div className="t2">{t('earn.vaultSubtitle')}</div>

      <div className="g" style={{ padding: 14, marginTop: 8, background: 'linear-gradient(135deg, rgba(27,140,62,.1), rgba(0,200,83,.04))' }}>
        <div className="t3">{t('earn.myVaults')}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0' }}>${totalLocked.toFixed(2)}</div>
        <div className="t3">{posList.length === 0 ? t('earn.noActivePositions') : t('earn.activePositions', { count: posList.length })}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('earn.vaultStrategies')}</h3>
      {data?.items?.map(v => {
        const tone = v.risk === 'LOW' ? 'g' : v.risk === 'MED' ? 'gd' : 'r'
        const tint = tone === 'g' ? '0,200,83' : tone === 'gd' ? '212,165,60' : '239,68,68'
        const color = tone === 'g' ? 'var(--gl)' : tone === 'gd' ? 'var(--gd)' : 'var(--r)'
        return (
          <div key={v.id} className="g" style={{ padding: 12, margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="li-i" style={{ background: `rgba(${tint},.12)` }}>
                <Icon name="target" size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{v.name}</div>
                <div className="t3">{v.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="grn" style={{ fontSize: 14, fontWeight: 800 }}>{v.apy}%</div>
                <div className={`badge badge-${tone}`} style={{ fontSize: 8 }}>{v.risk}</div>
              </div>
            </div>
          </div>
        )
      })}
    </PhoneShell>
  )
}
