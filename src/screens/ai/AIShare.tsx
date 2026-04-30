import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { AIShare } from '../../mock/db'

export function AIShareScreen() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { conversationId = '' } = useParams()
  const create = useEndpointMutation<{ pathParams: { conversationId: string } }, AIShare>('api.ai.share.create')
  const revoke = useEndpointMutation('api.ai.share.revoke', { invalidates: ['api.ai.share.create'] })
  const [share, setShare] = useState<AIShare | null>(null)
  const [copied, setCopied] = useState(false)

  useState(() => {
    create.mutateAsync({ pathParams: { conversationId } }).then(s => setShare(s)).catch(() => {})
  })

  const url = share ? `crymadx.ai/share/${share.id.slice(-12)}` : '...'

  const copy = async () => {
    if (!share) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const onRevoke = async () => {
    if (!share) return
    await revoke.mutateAsync({ pathParams: { conversationId } })
    nav(-1)
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('ai.shareConv')} />

      <div className="g" style={{ padding: 12 }}>
        <div className="t3" style={{ marginBottom: 4 }}>{t('ai.sharingLabel')}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>"BTC Sell Strategy"</div>
        <div className="t2" style={{ marginTop: 2 }}>{t('ai.msgsAndDate', { count: 14, date: new Date().toLocaleDateString() })}</div>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="li-i" style={{ width: 30, height: 30 }}><Icon name="link" size={14} /></div>
        <div className="t3" style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
        <button onClick={copy} className="badge badge-g" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, border: 'none' }}>
          <Icon name={copied ? 'check' : 'copy'} size={10} color="var(--gl)" />
          {copied ? t('ai.copiedShort') : t('ai.copyShort')}
        </button>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('ai.settingsHeader')}</h3>
      <div className="g" style={{ padding: 2 }}>
        <Toggle icon="eye"   name={t('ai.publicViewer')}  desc={t('ai.publicViewerSub')} on={share?.isPublic ?? true} />
        <RowVal icon="clock" name={t('ai.expiryLabel')}    value={t('ai.in7Days')} />
        <Toggle icon="user"  name={t('ai.showName')}       desc={t('ai.showNameSub')} on={share?.showAuthorName ?? false} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0 }} onClick={() => { void copy() }}>
          <Icon name="share" size={12} /> {t('ai.shareBtn')}
        </button>
        <button className="btn btn-r" style={{ flex: 1, padding: 10, margin: 0 }} onClick={onRevoke} disabled={revoke.isPending}>
          {revoke.isPending ? t('ai.revoking') : t('ai.revokeLink')}
        </button>
      </div>

      {share && (
        <button className="btn btn-o" style={{ marginTop: 6 }} onClick={() => nav(ROUTES['route.ai.shared-viewer'].path.replace(':shareId', share.id))}>
          <Icon name="ext" size={12} /> {t('ai.previewPublic')}
        </button>
      )}
    </PhoneShell>
  )
}

function Toggle({ icon, name, desc, on }: { icon: 'eye' | 'user'; name: string; desc: string; on: boolean }) {
  return (
    <div className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
      <div className="li-i"><Icon name={icon} size={16} /></div>
      <div className="li-c">
        <div className="li-n">{name}</div>
        <div className="li-s">{desc}</div>
      </div>
      <button className={`tgl ${on ? 'on' : 'off'}`} aria-label={name} />
    </div>
  )
}

function RowVal({ icon, name, value }: { icon: 'clock'; name: string; value: string }) {
  return (
    <div className="li" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--divider-soft)', boxShadow: 'none', background: 'transparent' }}>
      <div className="li-i"><Icon name={icon} size={16} /></div>
      <div className="li-c"><div className="li-n">{name}</div></div>
      <div className="li-r" style={{ fontSize: 14, color: 'var(--text-mid-40)' }}>{value} ▾</div>
    </div>
  )
}
