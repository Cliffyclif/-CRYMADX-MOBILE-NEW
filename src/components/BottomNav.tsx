/**
 * BottomNav — 4 + center-AI raised tab bar. Matches the canvas pattern.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { ROUTES } from '../routes'

export function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const cur = loc.pathname
  const { t } = useTranslation()

  return (
    <nav className="btab">
      <button className={`bt ${cur === ROUTES['route.tab.home'].path ? 'a' : ''}`} onClick={() => nav(ROUTES['route.tab.home'].path)}>
        <Icon name="home" />
        <span>{t('tabs.home')}</span>
      </button>
      <button className={`bt ${cur === ROUTES['route.tab.markets'].path ? 'a' : ''}`} onClick={() => nav(ROUTES['route.tab.markets'].path)}>
        <Icon name="bar" />
        <span>{t('tabs.markets')}</span>
      </button>
      <button
        className={`bt ${cur === ROUTES['route.tab.ai'].path ? 'a' : ''}`}
        onClick={() => nav(ROUTES['route.tab.ai'].path)}
        aria-label="CrymadX AI"
      >
        <span className="bt-c">
          <Icon name="ai" />
        </span>
        <span>{t('tabs.crymadxAi') || 'CrymadX AI'}</span>
      </button>
      <button className={`bt ${cur === ROUTES['route.tab.wallet'].path ? 'a' : ''}`} onClick={() => nav(ROUTES['route.tab.wallet'].path)}>
        <Icon name="wallet" />
        <span>{t('tabs.wallet')}</span>
      </button>
      <button className={`bt ${cur === ROUTES['route.tab.profile'].path ? 'a' : ''}`} onClick={() => nav(ROUTES['route.tab.profile'].path)}>
        <Icon name="user" />
        <span>{t('tabs.profile')}</span>
      </button>
    </nav>
  )
}
