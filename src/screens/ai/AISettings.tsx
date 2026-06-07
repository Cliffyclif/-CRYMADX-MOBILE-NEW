import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { useSheetDismiss } from '../../hooks/useSheetDismiss'
import { ROUTES } from '../../routes'
import type { AISettings } from '../../mock/db'

type Opt = { value: string | number; label: string; sub?: string }
type PickerCfg = { key: keyof AISettings; title: string; subtitle?: string; options: Opt[] }

const MODEL_OPTS: Opt[] = [
  { value: 'CrymadX v1', label: 'CrymadX v1', sub: 'Balanced quality & speed' },
  { value: 'CrymadX Pro', label: 'CrymadX Pro', sub: 'Highest quality, a little slower' },
  { value: 'CrymadX Lite', label: 'CrymadX Lite', sub: 'Fastest, lighter answers' },
]
const AUTO_EXEC_OPTS: Opt[] = [
  { value: 0, label: 'Off', sub: 'Always ask for PIN' },
  { value: 25, label: '$25', sub: 'Skip PIN under $25' },
  { value: 50, label: '$50', sub: 'Skip PIN under $50' },
  { value: 100, label: '$100', sub: 'Skip PIN under $100' },
  { value: 250, label: '$250', sub: 'Skip PIN under $250' },
]
const STYLE_OPTS: Opt[] = [
  { value: 'Concise', label: 'Concise', sub: 'Short, to the point' },
  { value: 'Balanced', label: 'Balanced', sub: 'A bit of context' },
  { value: 'Detailed', label: 'Detailed', sub: 'Thorough explanations' },
]
const CHAIN_OPTS: Opt[] = [
  { value: 'Ethereum', label: 'Ethereum' },
  { value: 'Solana', label: 'Solana' },
  { value: 'BSC', label: 'BSC' },
  { value: 'Polygon', label: 'Polygon' },
  { value: 'Arbitrum', label: 'Arbitrum' },
  { value: 'Base', label: 'Base' },
  { value: 'Bitcoin', label: 'Bitcoin' },
  { value: 'Tron', label: 'Tron' },
]
const PRIVACY_OPTS: Opt[] = [
  { value: 'On-device only', label: 'On-device only', sub: 'Memory never leaves this device' },
  { value: 'Cloud sync', label: 'Cloud sync', sub: 'Sync memory across your devices' },
]

export function AISettingsScreen() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: s } = useEndpoint<AISettings>('api.ai.settings.get')
  const update = useEndpointMutation('api.ai.settings.update', { invalidates: ['api.ai.settings.get'] })
  const clearMemory = useEndpointMutation('api.ai.memory.clear', { invalidates: ['api.ai.memory.list'] })

  const [picker, setPicker] = useState<PickerCfg | null>(null)

  if (!s) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  const toggle = (key: keyof AISettings, value: boolean) => update.mutate({ body: { [key]: value } })
  const choose = (key: keyof AISettings, value: string | number) => {
    update.mutate({ body: { [key]: value } })
    setPicker(null)
  }

  const autoExecLabel = s.autoExecuteUnderUsd > 0 ? `$${s.autoExecuteUnderUsd}` : 'Off'

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.aiSettingsTitle')} />

      <div className="g" style={{ padding: 2 }}>
        <Row icon="wand" name={t('ai.model')} value={s.model}
          onClick={() => setPicker({ key: 'model', title: t('ai.model'), options: MODEL_OPTS })} />
        <Toggle icon="volume" name={t('ai.streaming')} desc={t('ai.streamingSub')}
          on={s.streaming} onClick={() => toggle('streaming', !s.streaming)} />
        <Row icon="zap" name={t('ai.autoExecuteUnder')} value={autoExecLabel} desc={t('ai.skipPin')}
          onClick={() => setPicker({ key: 'autoExecuteUnderUsd', title: t('ai.autoExecuteUnder'), subtitle: t('ai.skipPin'), options: AUTO_EXEC_OPTS })} />
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.behavior')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Row icon="tool" name={t('ai.allowedTools')} desc={t('ai.toolsCount')}
          onClick={() => nav(ROUTES['route.ai.tools'].path)} />
        <Row icon="settings" name={t('ai.responseStyle')} value={s.responseStyle}
          onClick={() => setPicker({ key: 'responseStyle', title: t('ai.responseStyle'), options: STYLE_OPTS })} />
        <Row icon="globe" name={t('ai.defaultChain')} value={s.defaultChain}
          onClick={() => setPicker({ key: 'defaultChain', title: t('ai.defaultChain'), options: CHAIN_OPTS })} />
        <Row icon="pin" name={t('ai.pinPolicy')} desc={t('ai.pinTtl', { n: s.pinTokenTtlMin })}
          onClick={() => nav(ROUTES['route.ai.pin'].path)} />
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.memoryHeader')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Row icon="archive" name={t('ai.memoryItems')} desc={t('ai.viewSavedMemory')}
          onClick={() => nav(ROUTES['route.ai.memory'].path)} />
        <Row icon="eye" name={t('ai.privacy')} value={s.privacy}
          onClick={() => setPicker({ key: 'privacy', title: t('ai.privacy'), options: PRIVACY_OPTS })} />
      </div>

      <button className="btn btn-r" style={{ marginTop: 12 }} onClick={() => clearMemory.mutate({})} disabled={clearMemory.isPending}>
        {clearMemory.isPending ? t('ai.clearing') : t('ai.resetMemory')}
      </button>

      {picker && (
        <OptionSheet
          cfg={picker}
          current={s[picker.key] as string | number}
          onSelect={v => choose(picker.key, v)}
          onClose={() => setPicker(null)}
        />
      )}
    </PhoneShell>
  )
}

function Row({ icon, name, value, desc, onClick }: { icon: IconName; name: string; value?: string; desc?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}>
      <div className="li-i"><Icon name={icon} size={16} /></div>
      <div className="li-c" style={{ minWidth: 0 }}>
        <div className="li-n">{name}</div>
        {desc && <div className="li-s">{desc}</div>}
      </div>
      <div className="li-r" style={{ fontSize: 14, color: 'var(--text-mid-40)', whiteSpace: 'nowrap' }}>{value ? `${value} ▾` : '›'}</div>
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

function OptionSheet({ cfg, current, onSelect, onClose }: {
  cfg: PickerCfg
  current: string | number
  onSelect: (v: string | number) => void
  onClose: () => void
}) {
  const dismiss = useSheetDismiss({ onDismiss: onClose })

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
      data-no-swipe-back
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '82vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 14px calc(14px + var(--safe-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column',
          transform: `translateY(${dismiss.translateY}px)`,
          transition: dismiss.dragging ? 'none' : 'transform 0.18s ease-out',
          touchAction: 'pan-y',
        }}
      >
        <div {...dismiss.bind} style={{ padding: '4px 0 8px', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--text-mid-15)', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: cfg.subtitle ? 4 : 8 }}>
          <h3 style={{ flex: 1, margin: 0 }}>{cfg.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        {cfg.subtitle && <div className="t3" style={{ marginBottom: 8 }}>{cfg.subtitle}</div>}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {cfg.options.map(o => {
            const isCurrent = o.value === current
            return (
              <button
                key={String(o.value)}
                onClick={() => onSelect(o.value)}
                className="li"
                style={{
                  width: '100%',
                  border: isCurrent ? '1px solid rgba(0,200,83,.35)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isCurrent ? 'rgba(0,200,83,.06)' : undefined,
                }}
              >
                <div className="li-c" style={{ minWidth: 0 }}>
                  <div className="li-n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {o.label}
                    {isCurrent && <span className="grn" style={{ fontSize: 14 }}>✓</span>}
                  </div>
                  {o.sub && <div className="li-s">{o.sub}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
