import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { KYCSubmission } from '../../mock/db'

export function KYCPending() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data, refetch, isFetching } = useEndpoint<KYCSubmission>('api.user.kyc.status', {}, { refetchInterval: 5000 })

  const submitted = data?.submittedAt ? new Date(data.submittedAt) : new Date()
  const eta = data?.estimatedCompleteAt ? new Date(data.estimatedCompleteAt) : new Date(Date.now() + 12 * 60_000)
  const minsLeft = Math.max(0, Math.floor((eta.getTime() - Date.now()) / 60_000))

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('kyc.verification')} />

      <div className="g" style={{ padding: 14, textAlign: 'center' }}>
        <div className="ic" style={{ width: 80, height: 80, margin: '0 auto', background: 'rgba(212,165,60,.15)', boxShadow: '0 0 20px rgba(212,165,60,.2)' }}>
          <Icon name="clock" size={40} color="var(--gd)" />
        </div>
        <div className="badge badge-gd" style={{ marginTop: 10, fontSize: 11 }}>{t('kyc.underReview')}</div>
        <h2 style={{ marginTop: 8 }}>{t('kyc.verifyingYou')}</h2>
        <div className="t2" style={{ marginTop: 8, lineHeight: 1.5 }}>
          {t('kyc.teamChecking')} <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{t('kyc.fiveToFifteen')}</span>.
        </div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 6, fontWeight: 700 }}>{t('kyc.submitted')}</div>
        {(data?.steps ?? []).map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', fontSize: 13 }}>
            <Icon name={s.done ? 'check' : 'clock'} size={12} color={s.done ? 'var(--gl)' : 'var(--text-mid-30)'} />
            <span style={{ color: s.done ? 'var(--text-strong)' : 'var(--text-mid-40)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 6 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('kyc.submitted')}</div>
        <div style={{ fontSize: 15, color: 'var(--text-strong)', fontWeight: 700 }}>{submitted.toLocaleString()}</div>
        <div className="t3" style={{ marginTop: 6, marginBottom: 4 }}>{t('kyc.estComplete')}</div>
        <div className="grn" style={{ fontSize: 15, fontWeight: 700 }}>{t('kyc.estCompleteFmt', { time: eta.toLocaleTimeString().slice(0, 5), mins: minsLeft })}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">📧</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('kyc.willEmail')}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => refetch()} disabled={isFetching}>
          <Icon name="refresh" size={12} /> {isFetching ? t('kyc.checkingDots') : t('common.refresh')}
        </button>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
          <Icon name="msg" size={12} /> {t('kyc.support')}
        </button>
      </div>
    </PhoneShell>
  )
}
