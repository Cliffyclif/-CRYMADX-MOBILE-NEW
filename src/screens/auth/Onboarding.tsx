import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES } from '../../routes'

interface Slide {
  type: 'welcome' | 'feature' | 'cta'
  icon?: IconName
  titleKey: string
  bodyKey?: string
}

const SLIDES: Slide[] = [
  { type: 'welcome', titleKey: 'auth.welcomeCrymadX' },
  { type: 'feature', icon: 'chart',     titleKey: 'auth.ob1Title', bodyKey: 'auth.ob1Body' },
  { type: 'feature', icon: 'wallet',    titleKey: 'auth.ob2Title', bodyKey: 'auth.ob2Body' },
  { type: 'feature', icon: 'wand',      titleKey: 'auth.ob3Title', bodyKey: 'auth.ob3Body' },
  { type: 'feature', icon: 'zap',       titleKey: 'auth.ob4Title', bodyKey: 'auth.ob4Body' },
  { type: 'feature', icon: 'handshake', titleKey: 'auth.ob5Title', bodyKey: 'auth.ob5Body' },
  { type: 'feature', icon: 'card',      titleKey: 'auth.ob6Title', bodyKey: 'auth.ob6Body' },
  { type: 'feature', icon: 'trophy',    titleKey: 'auth.ob7Title', bodyKey: 'auth.ob7Body' },
  { type: 'cta',     icon: 'shield',    titleKey: 'auth.obCtaTitle', bodyKey: 'auth.obCtaBody' },
]

const ONBOARDED_KEY = 'crymadx.onboarded'

function markOnboarded() {
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* private mode etc — best-effort */ }
}

export function Onboarding() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  const next = () => {
    if (last) {
      markOnboarded()
      nav(ROUTES['route.auth.register'].path)
    } else {
      setI(x => x + 1)
    }
  }

  const goLogin = () => {
    // Either "Already have account" (slide 0) or "Skip" (mid-flow). Either
    // way we're done with onboarding for this device.
    markOnboarded()
    nav(ROUTES['route.auth.login'].path)
  }

  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        {slide.type === 'welcome' ? (
          <>
            <img src="/crymadx-full.png" alt="" style={{ width: 200, marginBottom: 8 }} />
            <div className="t3" style={{ marginTop: 4, letterSpacing: 2, textAlign: 'center' }}>{t('auth.tagline')}</div>
          </>
        ) : (
          <>
            <div className="ic" style={{ width: 110, height: 110, borderRadius: 55 }}>
              <Icon name={slide.icon!} size={52} />
            </div>
            <h2 style={{ marginTop: 18, fontSize: 20, textAlign: 'center' }}>{t(slide.titleKey)}</h2>
            <div className="t2" style={{ textAlign: 'center', marginTop: 10, lineHeight: 1.5, padding: '0 8px' }}>
              {slide.bodyKey ? t(slide.bodyKey) : ''}
            </div>
          </>
        )}

        <div className="dots" style={{ marginTop: 24 }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} className={`dot ${idx === i ? 'a' : ''}`} />
          ))}
        </div>

        <button className="btn btn-g" style={{ width: '100%' }} onClick={next}>
          {last ? t('auth.createAccount') : i === 0 ? t('auth.getStarted') : t('auth.next')}
        </button>

        {!last && (
          <div className="t3" style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="grn" style={{ cursor: 'pointer' }} onClick={goLogin}>{i === 0 ? t('auth.alreadyHaveAccount') : t('auth.skip')}</span>
          </div>
        )}
      </div>
    </PhoneShell>
  )
}
