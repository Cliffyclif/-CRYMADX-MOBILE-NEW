import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import type { Referral as ReferralRow } from '../../mock/db'

export function Referral() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ code: string; referredCount: number; earnedUsd: number; earnedXp: number; rewardPerReferralUsd?: number; rewardPerReferralXp?: number; items: ReferralRow[] }>('api.referral.summary')
  const [copied, setCopied] = useState(false)

  if (!data) return <PhoneShell noTabs><ScreenHeader title={t('referral.title')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const copyCode = async () => {
    await navigator.clipboard.writeText(data.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const headline = data.rewardPerReferralUsd != null || data.rewardPerReferralXp != null
    ? t('referral.earnPerReferral', { usd: data.rewardPerReferralUsd != null ? `$${data.rewardPerReferralUsd}` : '', xp: data.rewardPerReferralXp != null ? `${data.rewardPerReferralXp}` : '' })
    : t('referral.earnGeneric')

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('referral.title')} />

      <div className="g" style={{ padding: 14, textAlign: 'center', background: 'linear-gradient(135deg, rgba(27,140,62,.12), rgba(0,200,83,.04))' }}>
        <div style={{ fontSize: 42 }}>🎁</div>
        <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 800, marginTop: 4 }}>{headline}</div>
        <div className="t2" style={{ marginTop: 4 }}>{t('referral.subtitle')}</div>
      </div>

      <div className="stats" style={{ marginTop: 8 }}>
        <div className="stat"><div className="stat-v" style={{ fontSize: 18 }}>{data.referredCount}</div><div className="stat-l">{t('referral.referred')}</div></div>
        <div className="stat"><div className="stat-v grn" style={{ fontSize: 18 }}>${data.earnedUsd}</div><div className="stat-l">{t('referral.earned')}</div></div>
        <div className="stat"><div className="stat-v gld" style={{ fontSize: 18 }}>{data.earnedXp}</div><div className="stat-l">{t('referral.xp')}</div></div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('referral.yourCode')}</h3>
      <div className="g" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <div className="t3">{t('referral.code')}</div>
            <div style={{ fontSize: 18, color: 'var(--text-strong)', fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace', marginTop: 2 }}>{data.code}</div>
          </div>
          <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name={copied ? 'check' : 'copy'} size={16} color="var(--gl)" />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }}><Icon name="share" size={12} /> {t('referral.shareLink')}</button>
          <button className="btn btn-g" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }} onClick={copyCode}><Icon name="copy" size={12} color="#fff" /> {t('referral.copy')}</button>
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>{t('referral.referrals')}</h3>
      {(data.items || []).length === 0 ? (
        <div className="g" style={{ padding: 14, textAlign: 'center' }}>
          <div className="t3">{t('referral.noReferralsYet') || 'No referrals yet — share your code to get started.'}</div>
        </div>
      ) : (
        (data.items || []).map(r => {
          const handle = r.invitedHandle || '?'
          const initial = (handle.charAt(0) || '?').toUpperCase()
          return (
            <div key={r.id} className="li">
              <div className="li-i" style={{ background: r.status === 'verified' ? 'rgba(0,200,83,.06)' : 'var(--surface-soft)', width: 30, height: 30 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: r.status === 'verified' ? 'var(--gl)' : 'var(--text-mid-40)' }}>{initial}</div>
              </div>
              <div className="li-c">
                <div className="li-n">{handle}</div>
                <div className="li-s">{r.joinedAt ? t('referral.joined', { date: new Date(r.joinedAt).toLocaleDateString() }) : t('referral.pending')} · {r.verifiedKyc ? t('referral.verified') : t('referral.noSignup')}</div>
              </div>
              <div className="li-r"><div className="li-v grn" style={{ fontSize: 13 }}>{r.reward}</div></div>
            </div>
          )
        })
      )}
    </PhoneShell>
  )
}
