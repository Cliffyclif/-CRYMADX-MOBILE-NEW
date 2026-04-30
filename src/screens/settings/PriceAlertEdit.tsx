import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function PriceAlertEdit() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [asset, setAsset] = useState('BTC')
  const [condition, setCondition] = useState<'above' | 'below' | 'pct-change'>('above')
  const [threshold, setThreshold] = useState('70000')
  const [oneTime, setOneTime] = useState(true)
  const [recurring, setRecurring] = useState(false)
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(false)
  const create = useEndpointMutation('api.settings.alerts.create', { invalidates: ['api.settings.alerts.list'] })

  const submit = async () => {
    await create.mutateAsync({ body: { asset, condition, thresholdValue: threshold, thresholdAmount: '0', active: true, oneTime, notifyPush: push, notifyEmail: email } })
    nav(ROUTES['route.settings.alerts'].path, { replace: true })
  }

  const op = condition === 'above' ? '≥' : condition === 'below' ? '≤' : 'Δ'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.newAlert')} />

      <h3 style={{ marginTop: 8 }}>{t('settings.asset')}</h3>
      <div className="g" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(247,147,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F7931A', fontWeight: 700, fontSize: 18 }}>{asset[0]}</div>
        <div style={{ flex: 1 }}>
          <select value={asset} onChange={e => setAsset(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-strong)', fontSize: 15, fontWeight: 700, fontFamily: 'Outfit', cursor: 'pointer', width: '100%' }}>
            {['BTC', 'ETH', 'USDT', 'SOL', 'DOGE', 'XRP', 'MATIC', 'LINK'].map(a => <option key={a} value={a} style={{ color: '#000' }}>{a}</option>)}
          </select>
          <div className="t3">{t('settings.currentlyWatching')}</div>
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('settings.condition')}</h3>
      <div className="tabs">
        <button className={`tab ${condition === 'above' ? 'a' : ''}`} onClick={() => setCondition('above')}>{t('settings.above')}</button>
        <button className={`tab ${condition === 'below' ? 'a' : ''}`} onClick={() => setCondition('below')}>{t('settings.below')}</button>
        <button className={`tab ${condition === 'pct-change' ? 'a' : ''}`} onClick={() => setCondition('pct-change')}>{t('settings.pctChange')}</button>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 4 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('settings.triggerWhen', { asset, op })}</div>
        <div className="inp" style={{ padding: 10 }}>
          <span style={{ color: 'var(--text-mid-40)' }}>{condition === 'pct-change' ? '%' : '$'}</span>
          <input type="number" inputMode="decimal" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ flex: 1, color: 'var(--text-strong)', fontSize: 18, fontWeight: 800, marginLeft: 4 }} />
          <span style={{ marginLeft: 'auto', color: 'var(--text-strong)' }}>USD</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {['+5%', '+10%', '+15%', '+20%'].map((p, i) => (
            <button key={p} className={`badge ${i === 1 ? 'badge-g' : ''}`} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', background: i === 1 ? 'var(--g)' : 'var(--surface-soft)', color: i === 1 ? '#fff' : 'var(--text-mid-50)', border: 'none', padding: 4 }}>{p}</button>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('settings.behavior')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {[
          [t('settings.oneTime'),     t('settings.oneTimeSub'),    oneTime,   () => setOneTime(o => !o)],
          [t('settings.recurring'),   t('settings.recurringSub'),  recurring, () => setRecurring(o => !o)],
          [t('settings.pushNotif'),   t('settings.pushNotifSub'),  push,      () => setPush(o => !o)],
          [t('settings.emailMe'),     t('settings.emailMeSub'),    email,     () => setEmail(o => !o)],
        ].map(([n, d, on, fn]) => (
          <div key={n as string} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
            <div className="li-c">
              <div className="li-n">{n as string}</div>
              <div className="li-s">{d as string}</div>
            </div>
            <button className={`tgl ${on ? 'on' : 'off'}`} onClick={fn as () => void} aria-label={n as string} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-r" style={{ flex: 1, padding: 10, margin: 0 }}>{t('settings.deleteShort')}</button>
        <button className="btn btn-g" style={{ flex: 2, padding: 10, margin: 0 }} onClick={submit} disabled={create.isPending}>{create.isPending ? t('settings.savingAlert') : t('settings.saveAlertBtn')}</button>
      </div>
    </PhoneShell>
  )
}
