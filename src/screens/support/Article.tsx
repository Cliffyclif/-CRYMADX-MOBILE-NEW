import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import { ROUTES } from '../../routes'
import { findArticle, FAQ_CATEGORIES } from '../../data/faq'

// Inline markdown-light: handles **bold**, *italic*, and [text](url) links.
function renderInline(text: string, keyPrefix: string) {
  const parts: Array<{ key: string; el: React.ReactNode }> = []
  let i = 0
  let buf = ''
  let idx = 0
  const flush = () => { if (buf) { parts.push({ key: `${keyPrefix}-t${idx++}`, el: buf }); buf = '' } }
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end > i) { flush(); parts.push({ key: `${keyPrefix}-b${idx++}`, el: <strong style={{ color: 'var(--text-strong)' }}>{text.slice(i + 2, end)}</strong> }); i = end + 2; continue }
    }
    if (text.startsWith('[', i)) {
      const close = text.indexOf(']', i + 1)
      if (close > i && text[close + 1] === '(') {
        const urlEnd = text.indexOf(')', close + 2)
        if (urlEnd > close) {
          flush()
          const label = text.slice(i + 1, close)
          const url = text.slice(close + 2, urlEnd)
          parts.push({ key: `${keyPrefix}-l${idx++}`, el: <a href={url} target="_blank" rel="noopener noreferrer" className="grn">{label}</a> })
          i = urlEnd + 1
          continue
        }
      }
    }
    buf += text[i]
    i += 1
  }
  flush()
  return <>{parts.map(p => <span key={p.key}>{p.el}</span>)}</>
}

export function Article() {
  const nav = useNavigate()
  const { slug = '' } = useParams()
  const article = findArticle(slug)
  const [rated, setRated] = useState<'yes' | 'no' | null>(null)

  if (!article) {
    return (
      <PhoneShell noTabs>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
            <Icon name="arrow-l" size={18} />
          </button>
          <h2 style={{ flex: 1, margin: 0 }}>Article</h2>
        </div>
        <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
          <div className="t3">Article not found</div>
          <button onClick={() => nav(ROUTES['route.support.help'].path)} className="btn btn-g" style={{ marginTop: 8, padding: 10, fontSize: 13 }}>
            Back to Help Center
          </button>
        </div>
      </PhoneShell>
    )
  }

  const categoryLabel = FAQ_CATEGORIES.find(c => c.id === article.category)?.label ?? article.category
  const helpfulCount = article.helpfulCount ?? 0
  const helpfulPct = article.helpfulPct ?? 0

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <Icon name="arrow-l" size={18} />
        </button>
        <h2 style={{ flex: 1, margin: 0, fontSize: 14 }}>{categoryLabel}</h2>
        <button
          onClick={() => navigator.share?.({ title: article.title, url: window.location.href }).catch(() => {})}
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="share" size={14} color="var(--gl)" />
        </button>
      </div>

      <h2 style={{ fontSize: 22, lineHeight: 1.25, marginTop: 8 }}>{article.title}</h2>
      <div className="t3" style={{ marginTop: 6 }}>
        {categoryLabel} · Updated April 12, 2026{article.readTimeMin ? ` · ${article.readTimeMin} min read` : ''}
      </div>

      {helpfulCount > 0 && (
        <div className="badge badge-g" style={{ marginTop: 10, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>👍</span>
          <span>{(helpfulPct / 20).toFixed(1)} · {helpfulCount.toLocaleString()} helpful</span>
        </div>
      )}

      <div style={{ padding: '14px 0', lineHeight: 1.65, fontSize: 14, color: 'var(--text-mid-80)' }}>
        {article.body.map((line, i) => {
          if (line.startsWith('## ')) {
            return <h3 key={i} style={{ marginTop: 14, marginBottom: 6, fontSize: 16, color: 'var(--text-strong)' }}>{line.slice(3)}</h3>
          }
          if (/^\d+\.\s/.test(line)) {
            const m = line.match(/^(\d+)\.\s(.+)/)
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0' }}>
                <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: 'rgba(0,200,83,.12)', color: 'var(--gl)', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m?.[1]}</span>
                <span style={{ flex: 1 }}>{renderInline(m?.[2] ?? line, `n${i}`)}</span>
              </div>
            )
          }
          if (line.startsWith('- ')) {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, margin: '6px 0' }}>
                <span style={{ color: 'var(--gl)' }}>•</span>
                <span style={{ flex: 1 }}>{renderInline(line.slice(2), `b${i}`)}</span>
              </div>
            )
          }
          if (line.trim() === '') return null
          return <p key={i} style={{ margin: '8px 0' }}>{renderInline(line, `p${i}`)}</p>
        })}
      </div>

      <h3 style={{ marginTop: 14 }}>Was this helpful?</h3>
      {rated ? (
        <div className="g" style={{ padding: 10, marginTop: 6, textAlign: 'center' }}>
          <div className="t3">Thanks for the feedback!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => setRated('yes')}>
            <Icon name="thumbs-up" size={12} /> Yes
          </button>
          <button className="btn btn-o" style={{ flex: 1, padding: 8, fontSize: 13, margin: 0 }} onClick={() => setRated('no')}>
            No
          </button>
        </div>
      )}

      <h3 style={{ marginTop: 14 }}>Still need help?</h3>
      <button className="btn btn-g" style={{ marginTop: 6 }} onClick={() => nav(ROUTES['route.support.contact'].path)}>
        <Icon name="mail" size={12} color="#fff" /> Contact Support
      </button>
    </PhoneShell>
  )
}
