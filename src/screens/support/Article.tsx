import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES } from '../../routes'
import type { SupportArticle } from '../../mock/db'

export function Article() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { slug = '' } = useParams()
  const { data: article } = useEndpoint<SupportArticle>('api.support.article', { pathParams: { slug } })

  if (!article) return <PhoneShell noTabs><ScreenHeader title={t('support.articleTitle')} /><div className="g" style={{ padding: 14 }}><div className="t3">{t('common.loading')}</div></div></PhoneShell>

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={`${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`} actions={<><Icon name="share" size={14} /><Icon name="bookmark" size={14} /></>} />

      <h2 style={{ fontSize: 16, lineHeight: 1.3 }}>{article.title}</h2>
      <div className="t3" style={{ marginTop: 6 }}>
        {article.category} · {t('support.updatedDate', { date: new Date(article.updatedAt).toLocaleDateString() })} · {t('support.minuteRead')}
      </div>

      <div className="tabs" style={{ marginTop: 8, fontSize: 10 }}>
        <span className="tab badge-g" style={{ background: 'rgba(27,140,62,.08)' }}>📈 {t('support.helpfulRating', { rating: (article.helpfulPct / 20).toFixed(1), count: article.helpfulCount.toLocaleString() })}</span>
      </div>

      <div className="g" style={{ padding: 12, marginTop: 8, lineHeight: 1.6, fontSize: 13, color: 'var(--text-mid-80)' }}>
        {article.body.split('\n').map((line, i) => {
          if (line.startsWith('## ')) return <h3 key={i} style={{ margin: '8px 0 4px' }}>{line.slice(3)}</h3>
          if (line.trim() === '') return null
          return <p key={i} style={{ margin: '4px 0' }}>{line}</p>
        })}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('support.wasHelpfulQ')}</h3>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }}><Icon name="thumbs-up" size={12} /> {t('support.yes')}</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }}>👎 {t('support.no')}</button>
      </div>

      <h3 style={{ marginTop: 10 }}>{t('support.needMoreHelp')}</h3>
      <button className="btn btn-g" style={{ marginTop: 6 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
        <Icon name="mail" size={12} color="#fff" /> {t('support.contactSupport')}
      </button>
    </PhoneShell>
  )
}
