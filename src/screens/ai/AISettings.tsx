import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { AISettings } from '../../mock/db'

export function AISettingsScreen() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')
  const update = useEndpointMutation('api.ai.settings.update', { invalidates: ['api.ai.settings.get'] })
  const clearMemory = useEndpointMutation('api.ai.memory.clear', { invalidates: ['api.ai.memory.list'] })

  if (!s) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const toggle = (key: keyof AISettings, value: boolean) => update.mutate({ body: { [key]: value } })

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.aiSettingsTitle')} />

      <div className="g" style={{ padding: 2 }}>
        <Row icon="wand"     name={t('ai.model')}            value={s.model}                       onClick={() => {}} />
        <Toggle icon="volume" name={t('ai.streaming')}       desc={t('ai.streamingSub')}             on={s.streaming}    onClick={() => toggle('streaming', !s.streaming)} />
        <Row icon="zap"      name={t('ai.autoExecuteUnder')} value={`$${s.autoExecuteUnderUsd}`}    onClick={() => {}} desc={t('ai.skipPin')} />
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.behavior')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Row icon="tool"     name={t('ai.allowedTools')}     desc={t('ai.toolsCount')}              onClick={() => nav(ROUTES['route.ai.tools'].path)} />
        <Row icon="settings" name={t('ai.responseStyle')}    desc={t('ai.responseStyleSub')}        onClick={() => {}} />
        <Row icon="globe"    name={t('ai.defaultChain')}     value={s.defaultChain}                onClick={() => {}} />
        <Row icon="pin"      name={t('ai.pinPolicy')}        desc={t('ai.pinTtl', { n: s.pinTokenTtlMin })} onClick={() => nav(ROUTES['route.ai.pin'].path)} />
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.memoryHeader')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Row icon="archive"  name={t('ai.memoryItems')}      desc={t('ai.viewSavedMemory')}         onClick={() => nav(ROUTES['route.ai.memory'].path)} />
        <Row icon="eye"      name={t('ai.privacy')}          desc={t('ai.onDeviceOnly')}            onClick={() => {}} />
      </div>

      <button className="btn btn-r" style={{ marginTop: 12 }} onClick={() => clearMemory.mutate({})} disabled={clearMemory.isPending}>
        {clearMemory.isPending ? t('ai.clearing') : t('ai.resetMemory')}
      </button>
    </PhoneShell>
  )
}

function Row({ icon, name, value, desc, onClick }: { icon: IconName; name: string; value?: string; desc?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}>
      <div className="li-i"><Icon name={icon} size={16} /></div>
      <div className="li-c">
        <div className="li-n">{name}</div>
        {desc && <div className="li-s">{desc}</div>}
      </div>
      <div className="li-r" style={{ fontSize: 14, color: 'var(--text-mid-40)' }}>{value ? `${value} ▾` : '›'}</div>
    </button>
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
