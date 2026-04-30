import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { CardSettings } from '../../mock/db'

export function CardSettingsScreen() {
  const { t } = useTranslation()
  const { data: card } = useEndpoint<CardSettings>('api.card.get')
  const update = useEndpointMutation('api.card.settings.update', { invalidates: ['api.card.get'] })
  const freeze = useEndpointMutation('api.card.freeze', { invalidates: ['api.card.get'] })

  if (!card) return <PhoneShell noTabs><ScreenHeader title={t('card.settingsTitle')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const dailyPct = (parseFloat(card.spentToday) / parseFloat(card.dailySpendLimit)) * 100
  const monthlyPct = (parseFloat(card.spentMonth) / parseFloat(card.monthlySpendLimit)) * 100

  const set = (key: keyof CardSettings, value: unknown) => update.mutate({ body: { [key]: value } })

  const toggles: Array<[IconName, keyof CardSettings, string, string]> = [
    ['globe', 'onlineEnabled',        t('card.onlinePurchases'),    t('card.onlinePurchasesSub')],
    ['card',  'contactlessEnabled',   t('card.contactlessName'),    t('card.contactlessNameSub')],
    ['plus',  'internationalEnabled', t('card.internationalName'),  t('card.internationalNameSub')],
  ]

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('card.settingsTitle')} />

      <div className="g" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 36, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, #0a3a18, #0f5824)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: 'var(--text-strong)', fontWeight: 700 }}>{t('card.cardLine', { last4: card.cardLast4 })}</div>
          <div className="t3">{t('card.cardSubLine', { type: card.type === 'virtual' ? t('card.virtual') : t('card.physical'), status: card.status, name: card.cardholderName })}</div>
        </div>
        <div className={`badge badge-${card.status === 'active' ? 'g' : 'r'}`} style={{ fontSize: 9 }}>{card.status.toUpperCase()}</div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('card.limits')}</h3>
      <div className="g" style={{ padding: 10 }}>
        <div className="t3" style={{ marginBottom: 6 }}>{t('card.dailySpendLimit')}</div>
        <div className="bar"><div className="fl" style={{ width: `${Math.min(100, dailyPct)}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13 }}>
          <span style={{ color: 'var(--text-strong)' }}>${card.spentToday} / ${card.dailySpendLimit}</span>
          <span className="t3">{t('card.pctUsed', { n: Math.round(dailyPct) })}</span>
        </div>

        <div className="t3" style={{ marginTop: 8, marginBottom: 6 }}>{t('card.monthlySpendLimit')}</div>
        <div className="bar"><div className="fl" style={{ width: `${Math.min(100, monthlyPct)}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13 }}>
          <span style={{ color: 'var(--text-strong)' }}>${card.spentMonth} / ${card.monthlySpendLimit}</span>
          <span className="t3">{t('card.pctUsed', { n: Math.round(monthlyPct) })}</span>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('card.security')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Toggle icon="lock" name={t('card.freezeCardName')} desc={t('card.pauseSpend')} on={card.status === 'frozen'} onClick={() => freeze.mutate({ body: { freeze: card.status !== 'frozen' } })} />
        {toggles.map(([icon, key, name, desc]) => (
          <Toggle key={key} icon={icon} name={name} desc={desc} on={card[key] as boolean} onClick={() => set(key, !(card[key] as boolean))} />
        ))}
        <div className="li" style={{ margin: 0, borderRadius: 0, boxShadow: 'none', background: 'transparent' }}>
          <div className="li-i"><Icon name="eye" size={16} /></div>
          <div className="li-c">
            <div className="li-n">{t('card.revealNumber')}</div>
            <div className="li-s">{t('card.pinRequired')}</div>
          </div>
          <div className="li-r" style={{ fontSize: 14, color: 'var(--text-mid-40)' }}>›</div>
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('card.regionLocks')}</h3>
      <div className="g" style={{ padding: 8, fontSize: 13, color: 'var(--text-mid-60)' }}>
        {t('card.allowed')} {card.allowedRegions.join(' · ')} <span className="grn" style={{ cursor: 'pointer' }}>{t('card.addPlus')}</span>
      </div>

      <button className="btn btn-r" style={{ marginTop: 10 }}>{t('card.cancelCard')}</button>
    </PhoneShell>
  )
}

function Toggle({ icon, name, desc, on, onClick }: { icon: IconName; name: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
      <div className="li-i"><Icon name={icon} size={16} /></div>
      <div className="li-c">
        <div className="li-n">{name}</div>
        <div className="li-s">{desc}</div>
      </div>
      <button className={`tgl ${on ? 'on' : 'off'}`} onClick={onClick} aria-label={name} />
    </div>
  )
}
