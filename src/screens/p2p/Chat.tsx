import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import type { P2PMessage } from '../../mock/db'
import { useAuth } from '../../stores/auth'

export function Chat() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { orderId = '' } = useParams()
  const user = useAuth(s => s.user)
  const { data } = useEndpoint<{ items: P2PMessage[] }>('api.p2p.chat.list', { pathParams: { orderId } })
  const send = useEndpointMutation('api.p2p.chat.send', { invalidates: ['api.p2p.chat.list'] })
  const [draft, setDraft] = useState('')

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!draft.trim()) return
    await send.mutateAsync({ pathParams: { orderId }, body: { text: draft } })
    setDraft('')
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: 15, background: 'linear-gradient(135deg, var(--g), var(--gl))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>M</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>marcus_p</div>
          <div className="t3"><span className="grn">●</span> {t('p2p.onlineOrder', { id: orderId.slice(-7) })}</div>
        </div>
        <button style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="flag" size={14} color="var(--r)" />
        </button>
      </div>

      <div className="g" style={{ padding: 6, marginTop: 8, background: 'rgba(212,165,60,.06)', borderLeft: '3px solid var(--gd)', fontSize: 11, lineHeight: 1.4 }}>
        {t('p2p.orderTimer', { time: '12:48' })}
      </div>

      <div style={{ marginTop: 8, flex: 1 }}>
        {data?.items?.map(m => {
          const isMe = m.senderId === user?.id
          return (
            <div key={m.id} className={`bub bub-${isMe ? 'u' : 'ai'}`}>
              {!isMe && <div className="t3" style={{ marginBottom: 2 }}>{m.senderName} · {new Date(m.createdAt).toLocaleTimeString().slice(0, 5)}</div>}
              {m.text}
            </div>
          )
        })}
      </div>

      <form onSubmit={submit} className="inp" style={{ marginTop: 'auto', padding: 8 }}>
        <Icon name="paperclip" size={14} />
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={t('p2p.typeMessage')} style={{ flex: 1 }} />
        <button type="button" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 0 }}>
          <Icon name="camera" size={14} color="var(--gl)" />
        </button>
        <button type="submit" style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 0 }} disabled={send.isPending || !draft.trim()}>
          <Icon name="send" size={14} color="var(--gl)" />
        </button>
      </form>
    </PhoneShell>
  )
}
