import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { AIScheduledAction } from '../../mock/db'

export function AIActionDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { actionId = '' } = useParams()
  const { data: action } = useEndpoint<AIScheduledAction>('api.ai.scheduled.detail', { pathParams: { actionId } })
  const cancel = useEndpointMutation('api.ai.scheduled.cancel', { invalidates: ['api.ai.scheduled.list'] })

  if (!action) {
    return <PhoneShell noTabs><ScreenHeader title={t('ai.actionShort')} /><div className="g" style={{ padding: 16, marginTop: 8, textAlign: 'center' }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.actionDetailHeader')} />

      <div className="g" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="li-i" style={{ background: 'rgba(0,200,83,.15)' }}>
            <Icon name={action.icon as IconName} size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>{action.title}</div>
            <div className="t2" style={{ marginTop: 2 }}>{action.source}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <div className="badge badge-g" style={{ fontSize: 9 }}>{action.status.toUpperCase()}</div>
          {action.recurring && <div className="badge badge-gd" style={{ fontSize: 9 }}>{t('ai.recurringBadge')}</div>}
          {!action.recurring && <div className="badge badge-gd" style={{ fontSize: 9 }}>{t('ai.conditionalBadge')}</div>}
        </div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.conditions')}</h3>
      <div className="g" style={{ padding: 10 }}>
        {[
          [t('ai.trigger'), action.trigger],
          [t('ai.action'), action.action],
          [t('ai.cooldown'), action.cooldown],
          [t('ai.expires'), action.expiresAt ? new Date(action.expiresAt).toLocaleDateString() : t('ai.never')],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
            <span className="t2">{k}</span>
            <span style={{ color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.execHistory')}</h3>
      {action.history.length === 0
        ? <div className="g" style={{ padding: 12, textAlign: 'center' }}><div className="t3">{t('ai.noExecutions')}</div></div>
        : action.history.map((h, i) => {
          const tone = h.type === 'failed' ? 'r' : h.type === 'created' ? 'gd' : 'g'
          const tint = tone === 'r' ? '239,68,68' : tone === 'gd' ? '212,165,60' : '0,200,83'
          const icon: IconName = h.type === 'failed' ? 'x' : h.type === 'created' ? 'wand' : 'check'
          const color = tone === 'g' ? 'var(--gl)' : tone === 'gd' ? 'var(--gd)' : 'var(--r)'
          return (
            <div key={i} className="li">
              <div className="li-i" style={{ background: `rgba(${tint},.1)` }}>
                <Icon name={icon} size={14} color={color} />
              </div>
              <div className="li-c">
                <div className="li-n">{h.type === 'created' ? t('ai.histCreated') : h.type === 'failed' ? t('ai.histFailed') : t('ai.histTriggered')}</div>
                <div className="li-s">{h.detail}</div>
              </div>
              <div className="li-r"><div className="li-d">{new Date(h.when).toLocaleString()}</div></div>
            </div>
          )
        })}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }}><Icon name="pause" size={12} /> {t('ai.pauseBtn')}</button>
        <button className="btn btn-r" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => { cancel.mutate({ pathParams: { actionId } }); nav(ROUTES['route.ai.scheduled'].path) }} disabled={cancel.isPending}>
          {cancel.isPending ? t('ai.cancelling') : t('ai.cancelAction')}
        </button>
      </div>
    </PhoneShell>
  )
}
