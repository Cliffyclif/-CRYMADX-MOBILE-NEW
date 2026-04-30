import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { enable as enablePush, disable as disablePush, getStatus as getPushStatus, type PushStatus } from '../../lib/webPush'

export function NotificationsSettings() {
  const { t } = useTranslation()
  const { data } = useEndpoint<Record<string, boolean>>('api.settings.notifications.get')
  const update = useEndpointMutation('api.settings.notifications.update', { invalidates: ['api.settings.notifications.get'] })

  // System push (Web Push) opt-in state — separate from server-side
  // per-category preferences. Driven by the actual browser Push subscription.
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [pushBusy, setPushBusy] = useState(false)
  useEffect(() => { getPushStatus().then(setPushStatus) }, [])

  const togglePush = async () => {
    if (pushBusy) return
    setPushBusy(true)
    try {
      if (pushStatus === 'subscribed') {
        const r = await disablePush()
        setPushStatus(r)
      } else {
        const r = await enablePush()
        setPushStatus(r)
      }
    } catch (e) {
      console.error('[push] toggle failed', e)
    } finally {
      setPushBusy(false)
    }
  }

  const CHANNELS: Array<[IconName, string, string, string]> = [
    ['mail',  'email', t('settings.channelEmail'), 'joseph@email.com'],
    ['msg',   'sms',   t('settings.channelSms'),   '+234 ****5678'],
  ]

  const TRADING = [
    ['order.filled',      'Order filled'],
    ['order.partial',     'Order partially filled'],
    ['order.cancelled',   'Order cancelled'],
    ['limit.reached',     'Limit price reached'],
    ['stop.triggered',    'Stop-loss triggered'],
  ]

  const WALLET = [
    ['deposit.confirmed',     'Deposit confirmed'],
    ['withdrawal.processed',  'Withdrawal processed'],
    ['large.transfer',        'Large transfer (>$1K)'],
  ]

  const NEWS = [
    ['listings',      'New listings'],
    ['announcements', 'Platform announcements'],
    ['marketing',     'Marketing & offers'],
  ]

  if (!data) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const toggle = (key: string) => update.mutate({ body: { [key]: !data[key] } })

  const pushDescription = pushStatus === 'unsupported'
    ? 'Browser does not support push notifications'
    : pushStatus === 'denied'
      ? 'Blocked — enable in browser settings'
      : pushStatus === 'subscribed'
        ? 'You\'ll get pings even when the app is closed'
        : 'Tap to enable system notifications'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.notifications')} />
      <div className="t2">{t('settings.notifChooseWhat')}</div>

      <h3 style={{ marginTop: 8 }}>{t('settings.channelsTitle')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {/* Push (Web Push) — system notifications when the app is closed */}
        <div className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
          <div className="li-i"><Icon name="phone" size={16} /></div>
          <div className="li-c">
            <div className="li-n">{t('settings.channelPush')}</div>
            <div className="li-s">{pushDescription}</div>
          </div>
          <button
            className={`tgl ${pushStatus === 'subscribed' ? 'on' : 'off'}`}
            onClick={togglePush}
            disabled={pushBusy || pushStatus === 'unsupported' || pushStatus === 'denied'}
            aria-label="Push notifications"
          />
        </div>
        {CHANNELS.map(([icon, key, name, desc]) => (
          <div key={key} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
            <div className="li-i"><Icon name={icon} size={16} /></div>
            <div className="li-c">
              <div className="li-n">{name}</div>
              <div className="li-s">{desc}</div>
            </div>
            <button className={`tgl ${data[key] ? 'on' : 'off'}`} onClick={() => toggle(key)} aria-label={name} />
          </div>
        ))}
      </div>

      {[[t('settings.tradingTitle'), TRADING], [t('settings.walletTitle'), WALLET], [t('settings.newsPromotions'), NEWS]].map(([heading, items]) => (
        <div key={heading as string}>
          <h3 style={{ marginTop: 8 }}>{heading}</h3>
          <div className="g" style={{ padding: 2 }}>
            {(items as Array<[string, string]>).map(([key, name]) => (
              <div key={key} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10 }}>
                <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{name}</div></div>
                <button className={`tgl ${data[key] ? 'on' : 'off'}`} onClick={() => toggle(key)} aria-label={name} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn btn-o" style={{ marginTop: 10 }}><Icon name="bell" size={12} /> {t('settings.sendTestPush')}</button>
    </PhoneShell>
  )
}
