// Generic legal document renderer used by Terms / Privacy / Cookie screens.
// Each section is collapsible (first one expanded by default) and content is
// resolved from i18n at render time so when the en.json copy changes, every
// screen updates without code changes.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import type { LegalSection } from '../../data/legalSections'

type Props = {
  title: string          // e.g. "Terms of Service"
  lastUpdated: string    // e.g. "April 1, 2026 · v3.2"
  sections: LegalSection[]
  /** Optional intro before the section list (e.g. "Welcome to CrymadX...") */
  intro?: string
}

export function LegalDoc({ title, lastUpdated, sections, intro }: Props) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(new Set([sections[0]?.key].filter(Boolean) as string[]))

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(sections.map(s => s.key)))
  const collapseAll = () => setExpanded(new Set())

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={() => nav(-1)}
          aria-label="Back"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="arrow-l" size={18} />
        </button>
        <h2 style={{ flex: 1, margin: 0 }}>{title}</h2>
        <button
          onClick={() => navigator.share?.({ title, url: window.location.href }).catch(() => {})}
          aria-label="Share"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="share" size={16} color="var(--gl)" />
        </button>
      </div>
      <div className="t3" style={{ marginBottom: 12 }}>Last updated: {lastUpdated}</div>

      {intro && <p className="t2" style={{ marginBottom: 14, lineHeight: 1.6 }}>{intro}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          onClick={expandAll}
          className="badge badge-g"
          style={{ cursor: 'pointer', border: 'none', fontSize: 11 }}
        >
          {t('legal.expandAll', { defaultValue: 'Expand All' })}
        </button>
        <button
          onClick={collapseAll}
          className="badge"
          style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'var(--text-mid-50)', fontSize: 11, padding: '4px 10px', borderRadius: 30 }}
        >
          {t('legal.collapseAll', { defaultValue: 'Collapse All' })}
        </button>
      </div>

      {sections.map(section => {
        const isOpen = expanded.has(section.key)
        return (
          <div
            key={section.key}
            style={{
              marginBottom: 8,
              background: 'rgba(27, 140, 62, 0.04)',
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <button
              onClick={() => toggle(section.key)}
              style={{
                width: '100%',
                padding: '14px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                color: 'var(--text-strong)',
                minHeight: 50,
              }}
            >
              <h3 style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.3 }}>
                {t(section.title)}
              </h3>
              <span style={{ color: 'var(--text-mid-40)', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▾</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 14px 16px', color: 'var(--text-mid-50)', fontSize: 13, lineHeight: 1.65 }}>
                {section.intro && <p style={{ marginTop: 0, marginBottom: 12 }}>{t(section.intro)}</p>}
                {section.subs.map(sub => (
                  <div key={sub.kid} style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 13, marginBottom: 4 }}>{t(sub.title)}</div>
                    {sub.intro && <p style={{ margin: 0 }}>{t(sub.intro)}</p>}
                    {sub.bullets.length > 0 && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                        {sub.bullets.map(b => (
                          <li key={b} style={{ marginBottom: 4 }}>{t(b)}</li>
                        ))}
                      </ul>
                    )}
                    {sub.outro && <p style={{ marginTop: 8, marginBottom: 0 }}>{t(sub.outro)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </PhoneShell>
  )
}
