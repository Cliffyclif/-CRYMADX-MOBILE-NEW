import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'
import type { AIShare, AIConversation, AIMessage } from '../../mock/db'

export function AISharedViewer() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { shareId = '' } = useParams()
  const user = useAuth(s => s.user)
  const { data, isLoading, error } = useEndpoint<{ share: AIShare; conversation: AIConversation; messages: AIMessage[] }>('api.ai.share.get', { pathParams: { shareId } })

  if (isLoading) return <PhoneShell noTabs><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>
  if (error || !data) return <PhoneShell noTabs><div className="g" style={{ padding: 14, color: 'var(--r)' }}>{t('ai.shareExpired')}</div></PhoneShell>

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
        <img src="/crymadx-ai-mark.png" alt="" style={{ width: 30, height: 30 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>{t('ai.publicShare')}</div>
          <div className="t3">{t('ai.sharedBy', { name: data.share.showAuthorName ? 'Joseph O.' : t('ai.anonymous'), date: new Date(data.share.createdAt).toLocaleDateString() })}</div>
        </div>
        <span className="badge badge-gd" style={{ fontSize: 10 }}>{t('ai.readOnlyBadge')}</span>
      </div>

      <div style={{ marginTop: 8 }}>
        {data.messages.map(m => (
          <div key={m.id} className={`bub bub-${m.role === 'user' ? 'u' : 'ai'}`}>{m.text}</div>
        ))}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 10, textAlign: 'center' }}>
        <div className="t2">{t('ai.wantToChat')}</div>
        <button className="btn btn-g" style={{ marginTop: 6 }} onClick={() => nav(user ? ROUTES['route.tab.ai'].path : ROUTES['route.auth.login'].path)}>
          {user ? t('ai.openInApp') : t('ai.signInToChat')}
        </button>
        {user && <div className="t3" style={{ marginTop: 6 }}><span className="grn">{t('ai.saveToMyChats')}</span></div>}
      </div>
    </PhoneShell>
  )
}
