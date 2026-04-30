/**
 * Language settings — picks the active i18n language. Affects every screen
 * across the app immediately. Persisted to localStorage by i18next-browser-
 * languagedetector so the choice survives reloads.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'
import i18n, { SUPPORTED_LANGUAGES } from '../../lib/i18n'

// Map ISO country code to flag emoji using Unicode regional indicators.
function flagEmoji(code: string): string {
  const cc = code.toLowerCase()
  if (cc.length !== 2 || !/^[a-z]{2}$/.test(cc)) return '🌐'
  const A = 0x1F1E6
  return String.fromCodePoint(
    A + (cc.charCodeAt(0) - 'a'.charCodeAt(0)),
    A + (cc.charCodeAt(1) - 'a'.charCodeAt(0)),
  )
}

export function Language() {
  const nav = useNavigate()
  const { t, i18n: i18nInst } = useTranslation()
  const [selected, setSelected] = useState(i18nInst.language || 'en')
  const [q, setQ] = useState('')

  const filtered = SUPPORTED_LANGUAGES.filter(l =>
    !q.trim() ||
    l.name.toLowerCase().includes(q.toLowerCase()) ||
    l.native.toLowerCase().includes(q.toLowerCase()) ||
    l.code.toLowerCase().includes(q.toLowerCase()),
  )

  const pick = async (code: string) => {
    setSelected(code)
    await i18n.changeLanguage(code)
  }

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <button onClick={() => nav(-1)} aria-label={t('common.back')} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </button>
        <h2 style={{ flex: 1 }}>{t('settings.language')}</h2>
      </div>
      <div className="t3" style={{ marginBottom: 8 }}>{t('settings.languageSubtitle')}</div>

      <div className="inp">
        <Icon name="search" size={14} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('common.search') as string}
          style={{ flex: 1 }}
        />
      </div>

      {filtered.map(l => (
        <button
          key={l.code}
          onClick={() => pick(l.code)}
          className="li"
          style={{
            width: '100%',
            textAlign: 'left',
            background: selected === l.code ? 'rgba(0,200,83,.05)' : undefined,
            border: selected === l.code ? '1px solid rgba(0,200,83,.3)' : 'none',
            cursor: 'pointer',
          }}
        >
          <div className="li-i" style={{ background: 'var(--surface-soft)', width: 32, height: 32 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(l.flag)}</span>
          </div>
          <div className="li-c">
            <div className="li-n">{l.native}</div>
            <div className="li-s">{l.name} · {l.code.toUpperCase()}</div>
          </div>
          <div className="li-r">
            {selected === l.code
              ? <Icon name="check" size={16} color="var(--gl)" />
              : <span className="t3">○</span>}
          </div>
        </button>
      ))}

      {filtered.length === 0 && (
        <div className="g" style={{ padding: 16, textAlign: 'center', marginTop: 8 }}>
          <div className="t3">{t('common.noMatch', { q })}</div>
        </div>
      )}
    </PhoneShell>
  )
}
