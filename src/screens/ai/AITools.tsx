import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { AITool } from '../../mock/db'

const ICONS: Record<string, IconName> = {
  tool_balance: 'eye', tool_prices: 'chart', tool_portfolio: 'target',
  tool_send: 'send', tool_swap: 'swap', tool_trade: 'chart',
  tool_stake: 'zap', tool_alert: 'bell', tool_card_topup: 'card',
}

export function AITools() {
  const { t } = useTranslation()
  const { data } = useEndpoint<{ items: AITool[] }>('api.ai.tools.list')
  const update = useEndpointMutation('api.ai.tools.update', { invalidates: ['api.ai.tools.list'] })

  const reads = data?.items?.filter(tool => tool.category === 'read') ?? []
  const writes = data?.items?.filter(tool => tool.category === 'write') ?? []

  const toggle = (tool: AITool) => update.mutate({ body: { id: tool.id, enabled: !tool.enabled } })

  const badge = (tool: AITool): string => {
    if (tool.scope === 'read') return t('ai.always')
    if (tool.pinThresholdUsd === null) return t('ai.noPin')
    if (tool.pinThresholdUsd === 0) return t('ai.pinReq')
    return t('ai.pinThreshold', { n: tool.pinThresholdUsd })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.toolPermsTitle')} />

      <div className="g" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">ⓘ</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('ai.tightenLoosen')}</div>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.readHeader')}</h3>
      {reads.map(tool => (
        <div key={tool.id} className="li">
          <div className="li-i"><Icon name={ICONS[tool.id] ?? 'eye'} size={16} /></div>
          <div className="li-c">
            <div className="li-n">{tool.name}</div>
            <div className="li-s">{t('ai.always')}</div>
          </div>
          <button className={`tgl ${tool.enabled ? 'on' : 'off'}`} onClick={() => toggle(tool)} aria-label={tool.name} />
        </div>
      ))}

      <h3 style={{ marginTop: 10 }}>{t('ai.writeHeader')}</h3>
      {writes.map(tool => (
        <div key={tool.id} className="li">
          <div className="li-i"><Icon name={ICONS[tool.id] ?? 'tool'} size={16} /></div>
          <div className="li-c">
            <div className="li-n">{tool.name}</div>
            <div className="li-s">{tool.description}</div>
          </div>
          <div className="li-r" style={{ marginRight: 6 }}>
            <span className="badge badge-gd" style={{ fontSize: 8 }}>{badge(tool)}</span>
          </div>
          <button className={`tgl ${tool.enabled ? 'on' : 'off'}`} onClick={() => toggle(tool)} aria-label={tool.name} />
        </div>
      ))}
    </PhoneShell>
  )
}
