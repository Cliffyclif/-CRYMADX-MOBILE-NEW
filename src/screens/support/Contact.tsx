import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { routeFor } from '../../routes'
import type { SupportTicket } from '../../mock/db'

export function Contact() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [category, setCategory] = useState('Wallet')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const m = useEndpointMutation<unknown, SupportTicket>('api.support.tickets.create', { invalidates: ['api.support.tickets.list'] })

  const CATS: Array<[IconName, string, string]> = [
    ['wallet', 'Wallet',      t('support.catWallet')],
    ['swap',   'Trading',     t('support.catTrading')],
    ['card',   'Card',        t('support.catCard')],
    ['shield', 'Security',    t('support.catSecurity')],
    ['user',   'KYC/Account', t('support.catKyc')],
    ['help',   'Other',       t('support.catOther')],
  ]

  const priorityLabel = (p: 'low' | 'medium' | 'high' | 'urgent') =>
    p === 'low' ? t('support.priorityLow') :
    p === 'medium' ? t('support.priorityMedium') :
    p === 'high' ? t('support.priorityHigh') :
    t('support.priorityUrgent')

  const submit = async () => {
    const ticket = await m.mutateAsync({ body: { subject, category: category.toLowerCase(), description, priority } })
    nav(routeFor('route.support.ticket', { ticketId: ticket.id }), { replace: true })
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('support.newTicketTitle')} />
      <div className="t2">{t('support.tellUsWhats')}</div>

      <h3 style={{ marginTop: 10 }}>{t('support.categoryHeader')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {CATS.map(([icon, value, label]) => {
          const active = category === value
          return (
            <button key={value} onClick={() => setCategory(value)} className="g" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 6, borderLeft: active ? '3px solid var(--gl)' : undefined, cursor: 'pointer', width: '100%' }}>
              <div className="li-i" style={{ width: 24, height: 24 }}><Icon name={icon} size={12} /></div>
              <div style={{ flex: 1, fontSize: 14, color: 'var(--text-strong)', textAlign: 'left' }}>{label}</div>
              {active ? <div className="grn">●</div> : <div className="t3">○</div>}
            </button>
          )
        })}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('support.subjectHeader')}</h3>
      <div className="inp" style={{ padding: 10 }}>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('support.briefSummary')} style={{ flex: 1, color: 'var(--text-strong)', fontSize: 14 }} />
      </div>

      <h3 style={{ marginTop: 8 }}>{t('support.descriptionHeader')}</h3>
      <div className="g" style={{ padding: 10, minHeight: 80, border: '1px solid var(--divider)' }}>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('support.describeIssue')}
          style={{ width: '100%', minHeight: 60, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-strong)', fontFamily: 'Outfit', fontSize: 14, lineHeight: 1.5, resize: 'none' }}
        />
      </div>

      <h3 style={{ marginTop: 8 }}>{t('support.attachments')}</h3>
      <div className="g" style={{ padding: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
        <div className="li-i" style={{ width: 30, height: 30, background: 'rgba(0,200,83,.1)' }}><Icon name="paperclip" size={14} /></div>
        <div style={{ flex: 1 }}>
          <div className="t3">{t('support.dropFiles')}</div>
        </div>
      </div>
      <div className="grn" style={{ fontSize: 13, marginTop: 4, cursor: 'pointer' }}>{t('support.addAnotherFile')}</div>

      <h3 style={{ marginTop: 8 }}>{t('support.priorityHeader')}</h3>
      <div className="tabs">
        {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
          <button key={p} className={`tab ${priority === p ? 'a' : ''}`} onClick={() => setPriority(p)}>{priorityLabel(p)}</button>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">⏱</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>{t('support.avgResponse')} <span className="grn" style={{ fontWeight: 700 }}>{t('support.avgResponseValue', { priority: priorityLabel(priority) })}</span></div>
      </div>

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={m.isPending || !subject || !description}>
        {m.isPending ? t('support.submitting') : t('support.submitTicket')}
      </button>
    </PhoneShell>
  )
}
