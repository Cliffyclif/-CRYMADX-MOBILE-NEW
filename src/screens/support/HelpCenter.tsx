import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES, routeFor } from '../../routes'
import { FAQ_ARTICLES, FAQ_CATEGORIES, type FaqCategory } from '../../data/faq'

export function HelpCenter() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [activeCategory, setActiveCategory] = useState<FaqCategory | null>(null)

  // Article counts per category — for the topic tile badges
  const countsByCategory = useMemo(() => {
    const m = new Map<FaqCategory, number>()
    for (const a of FAQ_ARTICLES) m.set(a.category, (m.get(a.category) ?? 0) + 1)
    return m
  }, [])

  // Visible article list — filter by search query OR category, fall back to
  // a hand-picked Quick Answers set otherwise (top helpful across categories).
  const visibleArticles = useMemo(() => {
    const filter = q.trim().toLowerCase()
    if (filter) {
      return FAQ_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(filter)
        || a.preview.toLowerCase().includes(filter)
        || a.body.join(' ').toLowerCase().includes(filter)
      )
    }
    if (activeCategory) {
      return FAQ_ARTICLES.filter(a => a.category === activeCategory)
    }
    // Default Quick Answers — the highest-rated article from each category
    const seen = new Set<FaqCategory>()
    const top: typeof FAQ_ARTICLES = []
    for (const a of [...FAQ_ARTICLES].sort((a, b) => (b.helpfulPct ?? 0) - (a.helpfulPct ?? 0))) {
      if (seen.has(a.category)) continue
      seen.add(a.category)
      top.push(a)
      if (top.length >= 6) break
    }
    return top
  }, [q, activeCategory])

  const heading = q
    ? `Results for "${q}"`
    : activeCategory
      ? FAQ_CATEGORIES.find(c => c.id === activeCategory)?.label ?? 'Articles'
      : t('support.quickAnswers', { defaultValue: 'Quick Answers' })

  return (
    <PhoneShell noTabs>
      <h2>{t('support.howCanWeHelp', { defaultValue: 'How can we help?' })}</h2>

      <div className="inp" style={{ marginTop: 8, padding: 12 }}>
        <Icon name="search" size={16} />
        <input
          placeholder={t('support.searchArticles', { defaultValue: 'Search articles, FAQs…' }) as string}
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1, fontSize: 15 }}
        />
        {q && (
          <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={12} color="var(--text-mid-30)" />
          </button>
        )}
      </div>

      {!q && (
        <>
          <h3 style={{ marginTop: 8 }}>{t('support.popularTopics', { defaultValue: 'Popular Topics' })}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {FAQ_CATEGORIES.map(c => {
              const isActive = activeCategory === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(prev => prev === c.id ? null : c.id)}
                  className="g"
                  style={{
                    padding: 14, textAlign: 'center', cursor: 'pointer', width: '100%',
                    border: isActive ? '1px solid var(--gl)' : '1px solid transparent',
                    background: isActive ? 'rgba(0,200,83,.08)' : undefined,
                  }}
                >
                  <div className="ic" style={{ width: 38, height: 38, margin: '0 auto' }}>
                    <Icon name={c.icon} size={18} color={isActive ? 'var(--gl)' : undefined} />
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 700, marginTop: 6 }}>{c.label}</div>
                  <div className="t3">{countsByCategory.get(c.id) ?? 0} articles</div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>{heading}</h3>
        {activeCategory && !q && (
          <button onClick={() => setActiveCategory(null)} className="grn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Clear</button>
        )}
      </div>

      {visibleArticles.length === 0 ? (
        <div className="g" style={{ padding: 16, textAlign: 'center' }}>
          <div className="t3">No articles match "{q}"</div>
          <button onClick={() => nav(ROUTES['route.support.contact'].path)} className="btn btn-g" style={{ marginTop: 8, padding: 10, fontSize: 13 }}>
            Open a ticket instead
          </button>
        </div>
      ) : (
        visibleArticles.map(a => (
          <button
            key={a.slug}
            onClick={() => nav(routeFor('route.support.article', { slug: a.slug }))}
            className="li"
            style={{ padding: 10, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent' }}
          >
            <div className="li-i" style={{ width: 26, height: 26 }}><Icon name="help" size={12} /></div>
            <div className="li-c">
              <div className="li-n" style={{ fontSize: 14 }}>{a.title}</div>
              <div className="li-s" style={{ fontSize: 11 }}>
                {a.readTimeMin ? `${a.readTimeMin} min read · ` : ''}{a.preview}
              </div>
            </div>
            <div className="li-r" style={{ color: 'var(--text-mid-30)' }}>›</div>
          </button>
        ))
      )}

      <div className="g" style={{ padding: 12, marginTop: 12, background: 'linear-gradient(135deg, rgba(27,140,62,.08), rgba(0,200,83,.04))', textAlign: 'center' }}>
        <div className="t2">{t('support.cantFindAnswer', { defaultValue: "Can't find what you're looking for?" })}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.tickets'].path)}>
            <Icon name="msg" size={10} /> Live Chat
          </button>
          <button className="btn btn-g" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
            <Icon name="mail" size={10} color="#fff" /> New Ticket
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
