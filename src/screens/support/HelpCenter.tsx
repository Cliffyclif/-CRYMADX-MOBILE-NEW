import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { useEndpoint } from '../../api/hooks'
import { ROUTES, routeFor } from '../../routes'
import type { SupportArticle } from '../../mock/db'

export function HelpCenter() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data } = useEndpoint<{ items: SupportArticle[] }>('api.support.articles')

  const TOPICS: Array<[IconName, string, number]> = [
    ['wallet', t('support.topicDeposits'),    12],
    ['arrow',  t('support.topicWithdrawals'), 18],
    ['swap',   t('support.topicTrading'),     22],
    ['shield', t('support.topicSecurity'),    15],
    ['user',   t('support.topicKyc'),          9],
    ['card',   t('support.topicCard'),         8],
    ['msg',    t('support.topicAi'),           6],
    ['help',   t('support.topicOther'),       24],
  ]

  return (
    <PhoneShell noTabs>
      <h2>{t('support.howCanWeHelp')}</h2>
      <div className="inp" style={{ marginTop: 8, padding: 12 }}>
        <Icon name="search" size={16} />
        <input placeholder={t('support.searchArticles')} style={{ flex: 1, fontSize: 15 }} />
      </div>

      <h3 style={{ marginTop: 8 }}>{t('support.popularTopics')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {TOPICS.map(([icon, n, c]) => (
          <button key={n} className="g" style={{ padding: 14, textAlign: 'center', cursor: 'pointer', width: '100%' }}>
            <div className="ic" style={{ width: 38, height: 38, margin: '0 auto' }}><Icon name={icon} size={18} /></div>
            <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 700, marginTop: 6 }}>{n}</div>
            <div className="t3">{t('support.articlesCount', { n: c })}</div>
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: 10 }}>{t('support.quickAnswers')}</h3>
      {data?.items?.map(a => (
        <button key={a.slug} onClick={() => nav(routeFor('route.support.article', { slug: a.slug }))} className="li" style={{ padding: 10, width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ width: 26, height: 26 }}><Icon name="help" size={12} /></div>
          <div className="li-c"><div className="li-n" style={{ fontSize: 14 }}>{a.title}</div></div>
          <div className="li-r" style={{ color: 'var(--text-mid-30)' }}>›</div>
        </button>
      ))}

      <div className="g" style={{ padding: 12, marginTop: 8, background: 'linear-gradient(135deg, rgba(27,140,62,.08), rgba(0,200,83,.04))', textAlign: 'center' }}>
        <div className="t2">{t('support.cantFindAnswer')}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.tickets'].path)}>
            <Icon name="msg" size={10} /> {t('support.liveChat')}
          </button>
          <button className="btn btn-g" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
            <Icon name="mail" size={10} color="#fff" /> {t('support.newTicket')}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
