/**
 * Notification preferences screen.
 *
 * The backend doesn't currently expose a `/api/notifications/settings`
 * endpoint — the production website also stores these toggles entirely in
 * localStorage (see crymadx_notification_settings) since they're a
 * presentational filter for what kinds of notifications the user wants to
 * see in-app, not a server-side delivery rule.
 *
 * The Web Push toggle IS a server-side concern (the backend keeps a list
 * of subscribed devices), so that one stays wired to the real push API.
 * Email/SMS channel toggles + per-category toggles are localStorage only.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useAuth } from '../../stores/auth'
import { enable as enablePush, disable as disablePush, getStatus as getPushStatus, type PushStatus } from '../../lib/push'

const STORAGE_KEY = 'crymadx_notification_settings'

const DEFAULTS: Record<string, boolean> = {
  // Channels
  email: true,
  sms: false,
  // Trading
  'order.filled':      true,
  'order.partial':     true,
  'order.cancelled':   true,
  'limit.reached':     true,
  'stop.triggered':    true,
  // Wallet
  'deposit.confirmed':    true,
  'withdrawal.processed': true,
  'large.transfer':       true,
  // News
  listings:      true,
  announcements: true,
  marketing:     false,
}

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

function savePrefs(prefs: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
}

export function NotificationsSettings() {
  const { t } = useTranslation()
  const user = useAuth(s => s.user)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => loadPrefs())

  // Web Push subscription state — driven by the actual browser pushManager
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

  const toggle = (key: string) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] }
      savePrefs(next)
      return next
    })
  }

  const emailDisplay = user?.email
    ? user.email.replace(/(.{3}).*(@.*)/, '$1***$2')
    : (t('settings.notSet') || 'Not set')
  const phoneDisplay = user?.phone || (t('settings.notSet') || 'Not set')

  const CHANNELS: Array<{ icon: IconName; key: string; name: string; desc: string }> = [
    { icon: 'mail', key: 'email', name: t('settings.channelEmail'), desc: emailDisplay },
    { icon: 'msg',  key: 'sms',   name: t('settings.channelSms'),   desc: phoneDisplay },
  ]

  const TRADING: Array<[string, string]> = [
    ['order.filled',     'Order filled'],
    ['order.partial',    'Order partially filled'],
    ['order.cancelled',  'Order cancelled'],
    ['limit.reached',    'Limit price reached'],
    ['stop.triggered',   'Stop-loss triggered'],
  ]
  const WALLET: Array<[string, string]> = [
    ['deposit.confirmed',    'Deposit confirmed'],
    ['withdrawal.processed', 'Withdrawal processed'],
    ['large.transfer',       'Large transfer (>$1K)'],
  ]
  const NEWS: Array<[string, string]> = [
    ['listings',      'New listings'],
    ['announcements', 'Platform announcements'],
    ['marketing',     'Marketing & offers'],
  ]

  const pushDescription = pushStatus === 'unsupported'
    ? (t('settings.pushUnsupported') || "Push notifications aren't supported here")
    : pushStatus === 'denied'
      ? (t('settings.pushBlocked') || 'Blocked — enable notifications in settings')
      : pushStatus === 'subscribed'
        ? (t('settings.pushOn') || "You'll get pings even when the app is closed")
        : (t('settings.pushOff') || 'Tap to enable system notifications')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.notifications')} />
      <div className="t2">{t('settings.notifChooseWhat')}</div>

      <h3 style={{ marginTop: 8 }}>{t('settings.channelsTitle')}</h3>
      <div className="g" style={{ padding: 2 }}>
        {/* Web Push (system notifications) — wired to real backend */}
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

        {CHANNELS.map(({ icon, key, name, desc }) => (
          <div key={key} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
            <div className="li-i"><Icon name={icon} size={16} /></div>
            <div className="li-c">
              <div className="li-n">{name}</div>
              <div className="li-s">{desc}</div>
            </div>
            <button className={`tgl ${prefs[key] ? 'on' : 'off'}`} onClick={() => toggle(key)} aria-label={name} />
          </div>
        ))}
      </div>

      {[
        [t('settings.tradingTitle'), TRADING],
        [t('settings.walletTitle'),  WALLET],
        [t('settings.newsPromotions'), NEWS],
      ].map(([heading, items]) => (
        <div key={heading as string}>
          <h3 style={{ marginTop: 8 }}>{heading}</h3>
          <div className="g" style={{ padding: 2 }}>
            {(items as Array<[string, string]>).map(([key, name]) => (
              <div key={key} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', padding: 10 }}>
                <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{name}</div></div>
                <button className={`tgl ${prefs[key] ? 'on' : 'off'}`} onClick={() => toggle(key)} aria-label={name} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </PhoneShell>
  )
}
