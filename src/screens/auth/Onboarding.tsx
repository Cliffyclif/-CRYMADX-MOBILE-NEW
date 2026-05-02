// Onboarding — marketing edition. 9 painted slides with grain + vignette
// overlays, glass-frosted heroes, animated AI orb, premium Visa card mock,
// and bronze→diamond tier ladder. Each slide is its own painted background;
// chips, headlines, and CTAs share a single chrome.
//
// Persists "user has seen onboarding" in localStorage so the App-level guard
// at routes.ts:187 doesn't keep redirecting them back here on every launch.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { Icon, type IconName } from '../../components/Icon'
import { ROUTES } from '../../routes'
import './onboarding.css'

type SlideKind = 'welcome' | 'feature' | 'ai' | 'card' | 'tier' | 'cta'

interface Slide {
  kind: SlideKind
  bgClass: string
  heroClass?: string
  icon?: IconName
  tag?: string
  headline?: string
  body?: string
  chips?: { label: string; tone?: 'grn' | 'gld' | 'plain' }[]
  cta: string
  ctaTone?: 'white' | 'grn'
  sub?: 'sign-in' | 'skip' | 'terms'
}

const SLIDES: Slide[] = [
  {
    kind: 'welcome',
    bgClass: 'cx-bg-1',
    tag: '⚡ NOW IN 38+ COUNTRIES',
    chips: [
      { label: '900+ ASSETS', tone: 'grn' },
      { label: 'UP TO 12% APY', tone: 'gld' },
    ],
    cta: 'Get Started',
    ctaTone: 'grn',
    sub: 'sign-in',
  },
  {
    kind: 'feature',
    bgClass: 'cx-bg-2',
    heroClass: 'cx-hero-2',
    icon: 'chart',
    headline: 'Trade <em>smarter</em>.',
    body: '63+ markets · TradingView charts · sub-100ms execution. Built for serious traders, simple enough for first-timers.',
    chips: [
      { label: '0.10% MAKER' },
      { label: '0.15% TAKER' },
      { label: 'SPOT · P2P · OTC', tone: 'grn' },
    ],
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'feature',
    bgClass: 'cx-bg-3',
    heroClass: 'cx-hero-3',
    icon: 'wallet',
    headline: 'Vault-grade <em>security</em>.',
    body: '900+ assets across all major chains. Hardware-backed encryption, biometric lock, multi-sig cold custody.',
    chips: [
      { label: 'BIOMETRIC' },
      { label: '2FA · TOTP' },
      { label: 'SOC 2 AUDITED', tone: 'grn' },
    ],
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'ai',
    bgClass: 'cx-bg-4',
    headline: 'Your AI <em>copilot</em>.',
    body: 'Talk or chat. <em style="font-style:italic;color:var(--gl)">"Buy 0.05 ETH if BTC drops below 65k."</em> Done.',
    chips: [
      { label: 'VOICE-NATIVE' },
      { label: 'PIN-GATED' },
    ],
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'feature',
    bgClass: 'cx-bg-5',
    heroClass: 'cx-hero-5',
    icon: 'zap',
    headline: 'Earn while you <em>sleep</em>.',
    body: 'Stake, save, auto-invest, or lock in vaults. Daily payouts, no lock-ins on flexible options.',
    chips: [
      { label: 'ETH · 4.2%', tone: 'gld' },
      { label: 'SOL · 6.8%', tone: 'gld' },
      { label: 'USDT · 8.0%', tone: 'gld' },
    ],
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'feature',
    bgClass: 'cx-bg-6',
    heroClass: 'cx-hero-6',
    icon: 'handshake',
    headline: 'Your money, <em>your way</em>.',
    body: 'Buy or sell crypto in your local currency with 12+ payment methods. Escrow protected. Always.',
    chips: [
      { label: '38 COUNTRIES' },
      { label: '12+ PAYMENT METHODS' },
    ],
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'card',
    bgClass: 'cx-bg-7',
    headline: 'Spend <em>anywhere</em>.',
    body: '80M+ Visa merchants. Up to <strong>3% cashback</strong> in USDC. Instant top-up.',
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'tier',
    bgClass: 'cx-bg-8',
    heroClass: 'cx-hero-8',
    icon: 'trophy',
    headline: 'Climb to <em>Diamond</em>.',
    body: 'Trade, deposit, refer friends. Lower fees, higher limits, exclusive perks.',
    cta: 'Continue',
    ctaTone: 'white',
    sub: 'skip',
  },
  {
    kind: 'cta',
    bgClass: 'cx-bg-9',
    heroClass: 'cx-hero-9',
    icon: 'shield',
    headline: 'You\'re <em>ready</em>.',
    body: 'Bank-grade security. Bank-grade speed. Bank-grade peace of mind.',
    chips: [
      { label: 'SOC 2 · TYPE II' },
      { label: '256-BIT TLS' },
      { label: 'FUNDS INSURED', tone: 'grn' },
    ],
    cta: 'Create Account',
    ctaTone: 'grn',
    sub: 'terms',
  },
]

const TIERS = [
  { name: 'BRONZE', color: '#cd7f32' },
  { name: 'SILVER', color: '#a8a8b0' },
  { name: 'GOLD',   color: '#5a3a08', active: true },
  { name: 'PLAT',   color: '#9d6dd0' },
  { name: 'DIAMOND',color: '#69e0d4' },
]

const ONBOARDED_KEY = 'crymadx.onboarded'
function markOnboarded() {
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* private mode etc — best-effort */ }
}

export function Onboarding() {
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

  const skip = () => {
    markOnboarded()
    nav(ROUTES['route.auth.login'].path)
  }

  return (
    <PhoneShell noTabs>
      <div className="cx-onb-stage">
        <div className={slide.bgClass} />
        <div className="cx-grain" />
        <div className="cx-vignette" />

        <div className="cx-onb-content">
          <div className="cx-slide" key={i}>
            {slide.kind === 'welcome' && (
              <>
                {slide.tag && <div className="cx-tag">{slide.tag}</div>}
                <img
                  src="/crymadx-full.png"
                  alt="CrymadX"
                  className="cx-brand-img"
                  onError={e => { (e.target as HTMLImageElement).outerHTML = '<div class="cx-brand-text">CRYMAD<em>X</em></div>' }}
                />
                <div className="cx-brand-tagline">Trade · Stake · Spend · Earn</div>
              </>
            )}

            {slide.kind === 'feature' && slide.icon && (
              <div className={`cx-hero ${slide.heroClass ?? ''}`}>
                <Icon name={slide.icon} size={60} />
              </div>
            )}

            {slide.kind === 'ai' && (
              <div className="cx-ai-stage">
                <div className="cx-orb" />
                <img
                  src="/crymadx-ai-full.png"
                  alt="CrymadX AI"
                  className="cx-ai-mark"
                  onError={e => { (e.target as HTMLImageElement).outerHTML = '<div class="cx-brand-text" style="font-size:30px">CRYMAD<em>X</em> AI</div>' }}
                />
              </div>
            )}

            {slide.kind === 'card' && (
              <div className="cx-vcard">
                <div className="cx-vcard-row">
                  <img
                    src="/crymadx-mark.png"
                    alt=""
                    className="cx-vcard-mark"
                    onError={e => { (e.target as HTMLImageElement).outerHTML = '<div class="cx-vcard-fallback">CRX</div>' }}
                  />
                  <div className="cx-vcard-chip" />
                </div>
                <div className="cx-vcard-num">•••• •••• •••• 4218</div>
                <div className="cx-vcard-row">
                  <div>
                    <div className="cx-vcard-lbl">CARDHOLDER</div>
                    <div className="cx-vcard-name">JOSEPH OBASI</div>
                  </div>
                  <div className="cx-vcard-visa">VISA</div>
                </div>
              </div>
            )}

            {(slide.kind === 'tier' || slide.kind === 'cta') && slide.icon && (
              <div className={`cx-hero ${slide.heroClass ?? ''}`}>
                <Icon name={slide.icon} size={60} />
              </div>
            )}

            {slide.headline && (
              <h2 className="cx-h" dangerouslySetInnerHTML={{ __html: slide.headline }} />
            )}
            {slide.body && (
              <p className="cx-b" dangerouslySetInnerHTML={{ __html: slide.body }} />
            )}

            {slide.chips && (
              <div className="cx-chips">
                {slide.chips.map(c => (
                  <span key={c.label} className={`cx-chip ${c.tone === 'grn' ? 'cx-chip-grn' : c.tone === 'gld' ? 'cx-chip-gld' : ''}`}>
                    {c.label}
                  </span>
                ))}
              </div>
            )}

            {slide.kind === 'tier' && (
              <div className="cx-tier-row">
                {TIERS.map(t => (
                  <div key={t.name} className={`cx-tier ${t.active ? 'cx-tier-active' : ''}`}>
                    <div className="cx-tn" style={{ color: t.color }}>{t.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cx-foot">
            <div className="cx-dots">
              {SLIDES.map((_, idx) => (
                <div key={idx} className={`cx-dot ${idx === i ? 'cx-dot-a' : ''}`} />
              ))}
            </div>
            <button className={`cx-btn ${slide.ctaTone === 'grn' ? 'cx-btn-grn' : ''}`} onClick={next}>
              {slide.cta}
            </button>
            {slide.sub === 'sign-in' && (
              <div className="cx-skip">
                Already have an account? <span className="cx-skip-link" onClick={skip}>Sign in</span>
              </div>
            )}
            {slide.sub === 'skip' && (
              <div className="cx-skip"><span className="cx-skip-link" onClick={skip}>Skip</span></div>
            )}
            {slide.sub === 'terms' && (
              <div className="cx-skip">
                By continuing you accept our <span className="cx-skip-link">Terms</span> &amp; <span className="cx-skip-link">Privacy</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
