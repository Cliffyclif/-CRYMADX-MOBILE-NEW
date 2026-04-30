import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'

const POPULAR = [
  ['USD', 'US Dollar',         '🇺🇸'],
  ['EUR', 'Euro',              '🇪🇺'],
  ['GBP', 'Pound Sterling',    '🇬🇧'],
  ['NGN', 'Nigerian Naira',    '🇳🇬'],
  ['JPY', 'Japanese Yen',      '🇯🇵'],
  ['BRL', 'Brazilian Real',    '🇧🇷'],
] as const

const ALL = [
  ['INR', 'Indian Rupee',      '🇮🇳'],
  ['CNY', 'Chinese Yuan',      '🇨🇳'],
  ['KRW', 'Korean Won',        '🇰🇷'],
  ['CAD', 'Canadian Dollar',   '🇨🇦'],
  ['AUD', 'Australian Dollar', '🇦🇺'],
  ['CHF', 'Swiss Franc',       '🇨🇭'],
  ['SGD', 'Singapore Dollar',  '🇸🇬'],
  ['ZAR', 'South African Rand','🇿🇦'],
] as const

export function Currency() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [selected, setSelected] = useState('USD')

  return (
    <PhoneShell noTabs>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </button>
        <h2 style={{ flex: 1 }}>{t('settings.displayCurrency')}</h2>
      </div>
      <div className="t3" style={{ marginBottom: 8 }}>{t('settings.allValuesIn')}</div>

      <div className="inp">
        <Icon name="search" size={14} />
        <input placeholder={t('settings.searchCurrencies')} style={{ flex: 1 }} />
      </div>

      <h3 style={{ marginTop: 6 }}>{t('settings.popular')}</h3>
      {POPULAR.map(([code, n, f]) => (
        <button key={code} onClick={() => setSelected(code)} className="li" style={{ width: '100%', textAlign: 'left', background: selected === code ? 'rgba(0,200,83,.05)' : undefined }}>
          <div className="li-i" style={{ background: 'var(--surface-soft)', width: 30, height: 30 }}>
            <span style={{ fontSize: 14 }}>{f}</span>
          </div>
          <div className="li-c"><div className="li-n">{code} · {n}</div></div>
          <div className="li-r">{selected === code ? <Icon name="check" size={16} color="var(--gl)" /> : <span className="t3">○</span>}</div>
        </button>
      ))}

      <h3 style={{ marginTop: 8 }}>{t('settings.allCurrencies')}</h3>
      {ALL.map(([code, n, f]) => (
        <button key={code} onClick={() => setSelected(code)} className="li" style={{ width: '100%', textAlign: 'left' }}>
          <div className="li-i" style={{ background: 'var(--surface-soft)', width: 30, height: 30 }}>
            <span style={{ fontSize: 14 }}>{f}</span>
          </div>
          <div className="li-c"><div className="li-n">{code} · {n}</div></div>
          <div className="li-r">{selected === code ? <Icon name="check" size={16} color="var(--gl)" /> : <span className="t3">○</span>}</div>
        </button>
      ))}
    </PhoneShell>
  )
}
