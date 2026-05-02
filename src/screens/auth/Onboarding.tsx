import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../components/PhoneShell'
import { ROUTES } from '../../routes'
import './onboarding.css'

type Variant = 'light' | 'welcome' | 'final'
type Sub = 'sign-in' | 'skip' | 'terms' | 'none'

interface Slide {
  variant: Variant
  illustration: keyof typeof ILL
  title: string
  body: string
  cta: string
  sub: Sub
}

const SLIDES: Slide[] = [
  { variant: 'welcome', illustration: 'welcome', title: 'Welcome to CrymadX',         body: 'Your all-in-one home for trading, holding, and spending crypto. Built for everyone, everywhere.', cta: 'Get Started',     sub: 'sign-in' },
  { variant: 'light',   illustration: 'trade',   title: 'Trade with confidence',      body: 'Real-time charts, instant execution, and 150+ markets — all in one clean interface.',                cta: 'Continue',        sub: 'skip' },
  { variant: 'light',   illustration: 'wallet',  title: 'Your secure wallet',         body: 'Hold 500+ assets across all major chains. Bank-grade encryption and biometric protection.',         cta: 'Continue',        sub: 'skip' },
  { variant: 'light',   illustration: 'ai',      title: 'Meet your AI copilot',       body: 'Talk or chat with our AI to trade, swap, set alerts, and automate your strategy.',                  cta: 'Continue',        sub: 'skip' },
  { variant: 'light',   illustration: 'earn',    title: 'Earn while you hold',        body: 'Stake, save, and auto-invest. Earn up to 12% APY on idle crypto with daily payout options.',         cta: 'Continue',        sub: 'skip' },
  { variant: 'light',   illustration: 'p2p',     title: 'Send anywhere, instantly',   body: 'Move crypto between accounts in seconds. P2P with 12+ payment methods, escrow protected.',         cta: 'Continue',        sub: 'skip' },
  { variant: 'light',   illustration: 'card',    title: 'Spend it anywhere',          body: 'Use your CrymadX Visa card at 80M+ merchants worldwide. Top up instantly from your wallet.',         cta: 'Continue',        sub: 'skip' },
  { variant: 'final',   illustration: 'shield',  title: "You're all set",             body: 'Bank-grade security with KYC, 2FA, and biometric unlock. Your funds are safe.',                    cta: 'Create Account',  sub: 'terms' },
]

// Persists "user has seen onboarding" so the App-level guard at
// routes.ts:187 doesn't redirect them back here on every cold launch.
const ONBOARDED_KEY = 'crymadx.onboarded'
function markOnboarded() {
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* private mode etc */ }
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
      <div className={`onb-stage onb-stage--${slide.variant}`}>
        {slide.sub !== 'terms' && slide.sub !== 'none' && (
          <button className="onb-skip" onClick={skip}>
            {slide.sub === 'sign-in' ? 'Sign in' : 'Skip'}
          </button>
        )}

        <div className="onb-hero onb-slide-fade" key={`hero-${i}`}>
          {ILL[slide.illustration]()}
        </div>

        <div className="onb-body onb-slide-fade" key={`body-${i}`}>
          <h2 className="onb-title">{slide.title}</h2>
          <p className="onb-sub">{slide.body}</p>
        </div>

        <div className="onb-foot">
          {slide.sub === 'sign-in' && (
            <div className="onb-foot-sub">
              Already have an account?{' '}
              <a onClick={skip}>Sign in</a>
            </div>
          )}
          {slide.sub === 'terms' && (
            <div className="onb-foot-sub">
              By continuing you accept our <a>Terms</a> &amp; <a>Privacy</a>
            </div>
          )}
          <div className="onb-foot-row">
            <button className="onb-cta" onClick={next}>
              {slide.cta}
              <span className="onb-cta-arrow">→</span>
            </button>
            <div className="onb-dots">
              {SLIDES.map((_, idx) => (
                <div key={idx} className={`onb-dot ${idx === i ? 'onb-dot--a' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}

/* ========================================================================
   ILLUSTRATIONS — inline SVG, one per slide.
   For premium production: swap these for 3D PNG renders from 3dicons.co
   (MIT) or a Spline / Blender pack. Same component shape, just <img/>.
   ======================================================================== */

/* Card flip illustration — Uiverse-style 3D flip card, CrymadX-branded. */
function CardIllustration() {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="onb-c-scene">
      <div className="onb-c-halo" />
      <div className="onb-c-disc" />

      {/* Static black card layered behind the gold flip card */}
      <div className="onb-c-card-back-layer" aria-hidden="true">
        <div className="onb-c-back-brand">
          <img src="/crymadx-mark.png" alt="" />
          <span>CRYMADX</span>
        </div>
        <div className="onb-c-back-chip" />
        <div className="onb-c-back-number">•••• •••• •••• 9012</div>
        <div className="onb-c-back-name">JOHN DOE</div>
        <div className="onb-c-back-visa">VISA</div>
      </div>

      <div className="onb-c-card" onClick={() => setFlipped(f => !f)}>
        <div className={`onb-c-card-inner ${flipped ? 'is-flipped' : ''}`}>
          {/* FRONT */}
          <div className="onb-c-front">
            <div className="onb-c-brand">
              <img src="/crymadx-mark.png" alt="" />
              <span>CRYMADX</span>
            </div>
            <div className="onb-c-chip" />
            <div className="onb-c-contactless" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M 7 9 Q 12 4 17 9" />
                <path d="M 4 13 Q 12 2 20 13" />
                <path d="M 1 17 Q 12 0 23 17" opacity=".55" />
              </svg>
            </div>
            <div className="onb-c-number">•••• •••• •••• 4218</div>
            <div className="onb-c-meta">
              <div className="onb-c-meta-block">
                <span className="onb-c-meta-label">Exp</span>
                <span className="onb-c-meta-value">12/29</span>
              </div>
              <div className="onb-c-meta-block">
                <span className="onb-c-meta-label">CVC</span>
                <span className="onb-c-meta-value">•••</span>
              </div>
              <div className="onb-c-meta-block">
                <span className="onb-c-meta-label">Holder</span>
                <span className="onb-c-meta-value" style={{ fontSize: 9 }}>JOHN DOE</span>
              </div>
            </div>
            <div className="onb-c-visa">VISA</div>
          </div>

          {/* BACK */}
          <div className="onb-c-back">
            <div className="onb-c-back-strip" />
            <div className="onb-c-back-cvc-label">CVC</div>
            <div className="onb-c-back-sig">218</div>
            <div className="onb-c-back-text">
              Issued by CrymadX Holdings · Visa Inc.<br />
              Card use is governed by the Cardholder Agreement.
            </div>
          </div>
        </div>
        <div className="onb-c-flip-hint">tap to flip</div>
      </div>
    </div>
  )
}

/* P2P globe illustration — extracted as a sub-component because it's
   bigger than a single SVG and we may add motion via CSS later. */
function P2PIllustration() {
  return (
    <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 320, maxHeight: 320 }}>
      <defs>
        <radialGradient id="onb-g-sphere" cx=".32" cy=".26" r=".82">
          <stop offset="0"   stopColor="#a6f5cf" />
          <stop offset=".22" stopColor="#3ddb78" />
          <stop offset=".55" stopColor="#16703a" />
          <stop offset=".88" stopColor="#06320f" />
          <stop offset="1"   stopColor="#020a04" />
        </radialGradient>
        <radialGradient id="onb-g-rim" cx=".55" cy=".82" r=".55">
          <stop offset="0"   stopColor="#69f0ae" stopOpacity="0" />
          <stop offset=".88" stopColor="#69f0ae" stopOpacity=".4" />
          <stop offset="1"   stopColor="#69f0ae" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="onb-g-spec" cx=".5" cy=".5" r=".5">
          <stop offset="0"   stopColor="#fff" stopOpacity=".55" />
          <stop offset=".6"  stopColor="#fff" stopOpacity=".15" />
          <stop offset="1"   stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="onb-g-land" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#7ee8a8" stopOpacity=".55" />
          <stop offset="1" stopColor="#3ddb78" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id="onb-g-flight" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0"  stopColor="#69f0ae" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff"    stopOpacity="1" />
          <stop offset="1"  stopColor="#69f0ae" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="onb-g-disc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#cfe5dc" />
          <stop offset="1" stopColor="#9bc0ad" />
        </linearGradient>
        <radialGradient id="onb-g-halo" cx=".5" cy=".5" r=".55">
          <stop offset="0" stopColor="#69f0ae" stopOpacity=".35" />
          <stop offset="1" stopColor="#69f0ae" stopOpacity="0" />
        </radialGradient>
        <clipPath id="onb-g-clip">
          <circle cx="160" cy="148" r="78" />
        </clipPath>
      </defs>

      {/* ambient halo */}
      <circle cx="160" cy="148" r="140" fill="url(#onb-g-halo)" />

      {/* pastel disc */}
      <g filter="drop-shadow(0 14px 24px rgba(0,0,0,.16))">
        <ellipse cx="160" cy="266" rx="118" ry="22" fill="url(#onb-g-disc)" />
        <ellipse cx="160" cy="260" rx="118" ry="22" fill="#e3eee9" />
      </g>

      {/* globe sphere */}
      <g filter="drop-shadow(0 22px 42px rgba(0,134,58,.45)) drop-shadow(0 0 24px rgba(105,240,174,.4))">
        <circle cx="160" cy="148" r="78" fill="url(#onb-g-sphere)" />
        <circle cx="160" cy="148" r="78" fill="url(#onb-g-rim)" />
        <g clipPath="url(#onb-g-clip)">
          {/* lat/long grid */}
          <g stroke="rgba(255,255,255,.12)" strokeWidth=".7" fill="none">
            <ellipse cx="160" cy="148" rx="78" ry="14" />
            <ellipse cx="160" cy="124" rx="74" ry="10" />
            <ellipse cx="160" cy="172" rx="74" ry="10" />
            <ellipse cx="160" cy="106" rx="62" ry="6" opacity=".7" />
            <ellipse cx="160" cy="190" rx="62" ry="6" opacity=".7" />
            <ellipse cx="160" cy="148" rx="14" ry="78" />
            <ellipse cx="160" cy="148" rx="36" ry="78" opacity=".6" />
            <ellipse cx="160" cy="148" rx="58" ry="78" opacity=".4" />
          </g>
          {/* stylized continents */}
          <g fill="url(#onb-g-land)">
            <path d="M 152 110 Q 174 108, 178 122 Q 188 140, 178 158 Q 172 176, 160 188 Q 148 184, 144 168 Q 138 150, 142 132 Q 144 116, 152 110 Z" />
            <path d="M 134 102 Q 152 96, 168 100 Q 162 110, 152 110 Q 142 110, 134 102 Z" opacity=".75" />
            <path d="M 102 122 Q 114 116, 122 132 Q 124 150, 116 168 Q 110 180, 104 178 Q 98 162, 100 144 Q 100 130, 102 122 Z" opacity=".85" />
            <path d="M 198 168 Q 212 168, 216 180 Q 210 190, 198 188 Q 192 180, 198 168 Z" opacity=".7" />
            <circle cx="124" cy="190" r="3" opacity=".5" />
            <circle cx="192" cy="200" r="2.5" opacity=".5" />
          </g>
        </g>
        <circle cx="160" cy="148" r="78" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".8" />
        <ellipse cx="138" cy="118" rx="28" ry="18" fill="url(#onb-g-spec)" opacity=".65" />
        <ellipse cx="132" cy="112" rx="8" ry="5" fill="#fff" opacity=".75" />
      </g>

      {/* flight paths arcing OVER the globe */}
      <path d="M 92 152 Q 160 78 230 142" stroke="url(#onb-g-flight)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeDasharray="4 5" opacity=".85" />
      <path d="M 138 92 Q 200 130 188 198" stroke="url(#onb-g-flight)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeDasharray="3 5" opacity=".55" />

      {/* destination pins */}
      <g transform="translate(92 152)">
        <circle r="9" fill="rgba(105,240,174,.25)" />
        <circle r="5" fill="#69f0ae" filter="drop-shadow(0 0 8px rgba(105,240,174,.9))" />
        <circle r="2" fill="#fff" />
      </g>
      <g transform="translate(230 142)">
        <circle r="9" fill="rgba(105,240,174,.25)" />
        <circle r="5" fill="#69f0ae" filter="drop-shadow(0 0 8px rgba(105,240,174,.9))" />
        <circle r="2" fill="#fff" />
      </g>
      <g transform="translate(138 92)" opacity=".7">
        <circle r="6" fill="rgba(105,240,174,.2)" />
        <circle r="3" fill="#69f0ae" />
      </g>
      <g transform="translate(188 198)" opacity=".7">
        <circle r="6" fill="rgba(105,240,174,.2)" />
        <circle r="3" fill="#69f0ae" />
      </g>

      {/* paper plane mid-flight on arc 1 */}
      <g transform="translate(180 92) rotate(28)">
        <g filter="drop-shadow(0 4px 10px rgba(0,134,58,.5))">
          <path d="M 0 -8 L 18 0 L 0 8 L 5 0 Z" fill="#fff" />
          <path d="M 5 0 L 0 -8 L 18 0 Z" fill="rgba(105,240,174,.55)" />
        </g>
      </g>

      {/* floating currency badges around the globe */}
      <g filter="drop-shadow(0 6px 14px rgba(0,0,0,.18))">
        <g transform="translate(50 70)">
          <circle r="20" fill="#fff" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <text textAnchor="middle" y="6" fontFamily="Inter" fontWeight="800" fontSize="18" fill="#1B8C3E">$</text>
        </g>
        <g transform="translate(264 80)">
          <circle r="18" fill="#fff" />
          <circle r="18" fill="rgba(0,200,83,.06)" />
          <text textAnchor="middle" y="6" fontFamily="Inter" fontWeight="800" fontSize="17" fill="#1B8C3E">€</text>
        </g>
        <g transform="translate(280 178)">
          <circle r="17" fill="#fff" />
          <circle r="17" fill="rgba(247,147,26,.08)" />
          <text textAnchor="middle" y="6" fontFamily="Inter" fontWeight="800" fontSize="16" fill="#F7931A">₿</text>
        </g>
        <g transform="translate(40 198)">
          <circle r="18" fill="#fff" />
          <circle r="18" fill="rgba(0,200,83,.06)" />
          <text textAnchor="middle" y="5" fontFamily="Inter" fontWeight="800" fontSize="14" fill="#1B8C3E">₦</text>
        </g>
      </g>

      {/* "global crypto" pill — bottom center, anchored to disc */}
      <g transform="translate(160 240)" filter="drop-shadow(0 6px 14px rgba(0,134,58,.32))">
        <rect x="-95" y="-14" width="190" height="26" rx="13" fill="#fff" />
        <circle cx="-80" cy="-1" r="3.2" fill="#00C853" />
        <text x="6" y="3" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="9" fill="#1B8C3E" letterSpacing=".5">GLOBAL CRYPTO TRANSFERS</text>
      </g>
    </svg>
  )
}

const ILL = {
  welcome: () => (
    <div className="onb-w1-scene">
      <div className="onb-w1-halo" />

      {/* Floating real crypto logos around the brand card */}
      <img className="onb-w1-coin onb-w1-coin-1" src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" alt="" />
      <img className="onb-w1-coin onb-w1-coin-2" src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="" />
      <img className="onb-w1-coin onb-w1-coin-3" src="https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png" alt="" />

      {/* Hero brand card — white so the dark-green logo pops on the green bg */}
      <div className="onb-w1-card">
        <img src="/crymadx-full.png" alt="CrymadX" />
        <div className="onb-w1-tagline">Trade · Stake · Spend</div>
      </div>

      <div className="onb-w1-pill">TRUSTED IN OVER 150 COUNTRIES</div>
    </div>
  ),

  trade: () => (
    <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 360, maxHeight: 360 }}>
      <defs>
        <linearGradient id="onb-t-card" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#F4F8FB" /></linearGradient>
        <linearGradient id="onb-t-grn" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#69f0ae" /><stop offset="1" stopColor="#00C853" /></linearGradient>
      </defs>
      <ellipse cx="160" cy="278" rx="120" ry="18" fill="rgba(0,200,83,.18)" />
      <g transform="translate(20 50)">
        <rect width="280" height="200" rx="24" fill="url(#onb-t-card)" filter="drop-shadow(0 18px 44px rgba(0,0,0,.12))" />
        {/* candles — 8 of them across, taller */}
        <line x1="36" y1="56" x2="36" y2="160" stroke="#00C853" strokeWidth="2.5" />
        <rect x="28" y="78" width="16" height="56" rx="3" fill="#00C853" />
        <line x1="68" y1="44" x2="68" y2="148" stroke="#00C853" strokeWidth="2.5" />
        <rect x="60" y="62" width="16" height="44" rx="3" fill="#00C853" />
        <line x1="100" y1="68" x2="100" y2="172" stroke="#ef4444" strokeWidth="2.5" />
        <rect x="92" y="84" width="16" height="48" rx="3" fill="#ef4444" />
        <line x1="132" y1="58" x2="132" y2="156" stroke="#00C853" strokeWidth="2.5" />
        <rect x="124" y="72" width="16" height="42" rx="3" fill="#00C853" />
        <line x1="164" y1="34" x2="164" y2="138" stroke="#00C853" strokeWidth="2.5" />
        <rect x="156" y="48" width="16" height="58" rx="3" fill="#00C853" />
        <line x1="196" y1="48" x2="196" y2="124" stroke="#ef4444" strokeWidth="2.5" />
        <rect x="188" y="64" width="16" height="42" rx="3" fill="#ef4444" />
        <line x1="228" y1="26" x2="228" y2="110" stroke="#00C853" strokeWidth="2.5" />
        <rect x="220" y="32" width="16" height="56" rx="3" fill="#00C853" />
        <line x1="260" y1="20" x2="260" y2="92" stroke="#00C853" strokeWidth="2.5" />
        <rect x="252" y="24" width="16" height="48" rx="3" fill="#00C853" />
        {/* dotted trend line — fitting through highs */}
        <polyline points="36,82 68,68 100,90 132,76 164,52 196,68 228,38 260,28" fill="none" stroke="#1B8C3E" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" opacity=".7" />
      </g>
      {/* +24.8% pill — top-right corner */}
      <g transform="translate(190 22)" filter="drop-shadow(0 10px 24px rgba(0,200,83,.35))">
        <rect width="110" height="48" rx="24" fill="url(#onb-t-grn)" />
        <text x="55" y="31" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="17" fill="#fff">+24.8%</text>
      </g>
      {/* BTC ticker — bottom-center */}
      <g transform="translate(96 248)" filter="drop-shadow(0 10px 22px rgba(0,0,0,.10))">
        <rect width="128" height="44" rx="22" fill="#fff" />
        <image href="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" x="11" y="9" width="26" height="26" />
        <text x="46" y="28" fontFamily="Inter" fontWeight="700" fontSize="15" fill="#0a1410">BTC/USDT</text>
      </g>
    </svg>
  ),

  wallet: () => (
    <div className="onb-w-scene">
      {/* Floating crypto coins around the wallet — real logos from CoinMarketCap CDN.
          For production: download these to /public/coins/ and swap the src to local. */}
      <img className="onb-w-coin onb-w-coin-btc"  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"    alt="BTC" />
      <img className="onb-w-coin onb-w-coin-usdt" src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png"  alt="USDT" />
      <img className="onb-w-coin onb-w-coin-usdc" src="https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png" alt="USDC" />
      <img className="onb-w-coin onb-w-coin-trx"  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png" alt="TRX" />

    <div className="onb-w-wallet">
      <div className="onb-w-back" />

      {/* BTC card — back layer */}
      <div className="onb-w-card onb-w-card-btc">
        <div className="onb-w-card-inner">
          <div className="onb-w-card-top">
            <span className="onb-w-card-top-mark">
              <span className="onb-w-card-token">B</span>
              Bitcoin
            </span>
            <div className="onb-w-chip" />
          </div>
          <div className="onb-w-card-bottom">
            <div>
              <span className="onb-w-label">Holding</span>
              <span className="onb-w-value">0.625 BTC</span>
            </div>
            <div className="onb-w-card-number-wrapper">
              <div className="onb-w-hidden-stars">$ ●●●●●</div>
              <div className="onb-w-card-number">$42,150</div>
            </div>
          </div>
        </div>
      </div>

      {/* USDT card — middle layer */}
      <div className="onb-w-card onb-w-card-usdt">
        <div className="onb-w-card-inner">
          <div className="onb-w-card-top">
            <span className="onb-w-card-top-mark">
              <span className="onb-w-card-token">₮</span>
              Tether
            </span>
            <div className="onb-w-chip" />
          </div>
          <div className="onb-w-card-bottom">
            <div>
              <span className="onb-w-label">Holding</span>
              <span className="onb-w-value">8,420 USDT</span>
            </div>
            <div className="onb-w-card-number-wrapper">
              <div className="onb-w-hidden-stars">$ ●●●●●</div>
              <div className="onb-w-card-number">$8,420</div>
            </div>
          </div>
        </div>
      </div>

      {/* USDC card — front layer */}
      <div className="onb-w-card onb-w-card-usdc">
        <div className="onb-w-card-inner">
          <div className="onb-w-card-top">
            <span className="onb-w-card-top-mark">
              <span className="onb-w-card-token">$</span>
              USD Coin
            </span>
            <div className="onb-w-chip" />
          </div>
          <div className="onb-w-card-bottom">
            <div>
              <span className="onb-w-label">Holding</span>
              <span className="onb-w-value">5,200 USDC</span>
            </div>
            <div className="onb-w-card-number-wrapper">
              <div className="onb-w-hidden-stars">$ ●●●●●</div>
              <div className="onb-w-card-number">$5,200</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pocket — front panel of the wallet */}
      <div className="onb-w-pocket">
        <svg viewBox="0 0 260 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="onb-w-pocket-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2a4a2a" />
              <stop offset=".5" stopColor="#1f3d1f" />
              <stop offset="1" stopColor="#143614" />
            </linearGradient>
          </defs>
          <path d="M 0 0 L 260 0 L 260 100 Q 260 150, 215 150 L 45 150 Q 0 150, 0 100 Z" fill="url(#onb-w-pocket-grad)" />
          {/* inner highlight */}
          <path d="M 0 0 L 260 0 L 260 6 L 0 6 Z" fill="rgba(255,255,255,.06)" />
          {/* inset dashed stitching border */}
          <path d="M 12 12 L 248 12 L 248 96 Q 248 138, 212 138 L 48 138 Q 12 138, 12 96 Z" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <div className="onb-w-pocket-content">
          <div className="onb-w-balance-stars">∗ ∗ ∗ ∗ ∗ ∗</div>
          <div className="onb-w-balance-label">Total Balance</div>
          <div className="onb-w-eye-icon">
            <svg viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    </div>
  ),

  ai: () => (
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="onb-a-sphere" cx=".32" cy=".28" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".15" stopColor="#d8fff0" />
          <stop offset=".4" stopColor="#69f0ae" />
          <stop offset=".7" stopColor="#00863a" />
          <stop offset=".95" stopColor="#06320f" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id="onb-a-rim" cx=".6" cy=".75" r=".55">
          <stop offset="0" stopColor="#69f0ae" stopOpacity="0" />
          <stop offset=".88" stopColor="#69f0ae" stopOpacity=".35" />
          <stop offset="1" stopColor="#69f0ae" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="onb-a-spec" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="onb-a-glow" cx=".5" cy=".5" r=".6">
          <stop offset="0" stopColor="#69f0ae" stopOpacity=".55" />
          <stop offset=".5" stopColor="#00C853" stopOpacity=".15" />
          <stop offset="1" stopColor="#69f0ae" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="onb-a-disc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#cfe5dc" /><stop offset="1" stopColor="#9bc0ad" /></linearGradient>
      </defs>
      <circle cx="120" cy="120" r="115" fill="url(#onb-a-glow)" opacity=".9" />
      <g filter="drop-shadow(0 14px 24px rgba(0,0,0,.18))">
        <ellipse cx="120" cy="200" rx="78" ry="20" fill="url(#onb-a-disc)" />
        <ellipse cx="120" cy="194" rx="78" ry="20" fill="#e3eee9" />
      </g>
      <g className="onb-ring-rotate">
        <ellipse cx="120" cy="115" rx="92" ry="34" fill="none" stroke="rgba(0,200,83,.35)" strokeWidth="1.2" strokeDasharray="2 6" />
      </g>
      <ellipse cx="120" cy="115" rx="74" ry="22" fill="none" stroke="rgba(0,200,83,.18)" strokeWidth="1" />
      <g className="onb-orb-breathe">
        <circle cx="120" cy="115" r="62" fill="url(#onb-a-glow)" opacity=".6" />
        <circle cx="120" cy="115" r="50" fill="url(#onb-a-sphere)" filter="drop-shadow(0 20px 36px rgba(0,134,58,.6)) drop-shadow(0 0 24px rgba(105,240,174,.4))" />
        <circle cx="120" cy="115" r="50" fill="url(#onb-a-rim)" />
        <ellipse cx="105" cy="98" rx="22" ry="14" fill="url(#onb-a-spec)" opacity=".8" />
        <ellipse cx="100" cy="94" rx="6" ry="4" fill="#fff" opacity=".95" />
        <ellipse cx="148" cy="148" rx="14" ry="6" fill="#69f0ae" opacity=".4" />
      </g>
      <circle cx="46" cy="115" r="3" fill="#69f0ae" filter="drop-shadow(0 0 8px rgba(105,240,174,.9))" />
      <circle cx="194" cy="115" r="2.5" fill="#fff" opacity=".9" filter="drop-shadow(0 0 6px rgba(255,255,255,.9))" />

      {/* Capability chips — Send · Receive · Swap · Trade · Update.
          Outer <g> handles positioning (SVG attr); inner <g> handles bob animation (CSS).
          Separating them prevents CSS transform from overriding the SVG transform attr. */}
      <g transform="translate(48 50)">
        <g className="onb-ai-chip">
          <circle r="20" fill="#fff" filter="drop-shadow(0 6px 14px rgba(0,134,58,.28))" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <g stroke="#1B8C3E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="-6" y1="6" x2="6" y2="-6" />
            <polyline points="-1,-6 6,-6 6,1" />
          </g>
          <text y="32" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="8" fill="#1B8C3E">SEND</text>
        </g>
      </g>

      <g transform="translate(192 50)">
        <g className="onb-ai-chip-2">
          <circle r="20" fill="#fff" filter="drop-shadow(0 6px 14px rgba(0,134,58,.28))" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <g stroke="#1B8C3E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="-6" x2="-6" y2="6" />
            <polyline points="-6,-1 -6,6 1,6" />
          </g>
          <text y="32" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="8" fill="#1B8C3E">RECEIVE</text>
        </g>
      </g>

      <g transform="translate(216 130)">
        <g className="onb-ai-chip-3">
          <circle r="20" fill="#fff" filter="drop-shadow(0 6px 14px rgba(0,134,58,.28))" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <g stroke="#1B8C3E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="-7,-3 7,-3 4,-6" />
            <polyline points="4,0 7,-3 4,-6" />
            <polyline points="7,3 -7,3 -4,0" />
            <polyline points="-4,6 -7,3 -4,0" />
          </g>
          <text y="32" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="8" fill="#1B8C3E">SWAP</text>
        </g>
      </g>

      <g transform="translate(206 178)">
        <g className="onb-ai-chip-4">
          <circle r="20" fill="#fff" filter="drop-shadow(0 6px 14px rgba(0,134,58,.28))" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <g fill="#1B8C3E" stroke="none">
            <rect x="-7" y="0" width="3.5" height="6" rx="1" />
            <rect x="-1.75" y="-3" width="3.5" height="9" rx="1" />
            <rect x="3.5" y="-6" width="3.5" height="12" rx="1" />
          </g>
          <text y="32" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="8" fill="#1B8C3E">TRADE</text>
        </g>
      </g>

      <g transform="translate(34 178)">
        <g className="onb-ai-chip-5">
          <circle r="20" fill="#fff" filter="drop-shadow(0 6px 14px rgba(0,134,58,.28))" />
          <circle r="20" fill="rgba(0,200,83,.06)" />
          <g stroke="#1B8C3E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M -6 -2 A 6 6 0 1 1 -6 4" />
            <polyline points="-6,-5 -6,-2 -3,-2" />
          </g>
          <text y="32" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="8" fill="#1B8C3E">UPDATE</text>
        </g>
      </g>
    </svg>
  ),

  earn: () => (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 300, maxHeight: 300 }}>
      <defs>
        {/* Piggy body — soft emerald with proper highlight */}
        <radialGradient id="onb-e-pig" cx=".35" cy=".3" r=".75">
          <stop offset="0"  stopColor="#9af0c2" />
          <stop offset=".4" stopColor="#3ddb78" />
          <stop offset=".8" stopColor="#1B8C3E" />
          <stop offset="1"  stopColor="#0a3d1e" />
        </radialGradient>
        <linearGradient id="onb-e-pig-side" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#0d5524" stopOpacity=".4" />
          <stop offset="1" stopColor="#0d5524" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="onb-e-pig-spec" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="onb-e-snout" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0d5524" />
          <stop offset="1" stopColor="#06320f" />
        </linearGradient>

        {/* Coins — multi-stop gold for shine */}
        <linearGradient id="onb-e-coin-grad" x1=".2" x2=".8" y1=".1" y2=".9">
          <stop offset="0" stopColor="#fff5d4" />
          <stop offset=".3" stopColor="#FFE082" />
          <stop offset=".7" stopColor="#C9A84C" />
          <stop offset="1" stopColor="#7a5b1e" />
        </linearGradient>

        {/* Pastel disc */}
        <linearGradient id="onb-e-disc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#cfe5dc" />
          <stop offset="1" stopColor="#9bc0ad" />
        </linearGradient>

        {/* Ambient glow */}
        <radialGradient id="onb-e-glow" cx=".5" cy=".5" r=".55">
          <stop offset="0" stopColor="#69f0ae" stopOpacity=".35" />
          <stop offset=".5" stopColor="#69f0ae" stopOpacity=".1" />
          <stop offset="1" stopColor="#69f0ae" stopOpacity="0" />
        </radialGradient>

        {/* APY pill green */}
        <linearGradient id="onb-e-apy" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3ddb78" />
          <stop offset="1" stopColor="#00863a" />
        </linearGradient>
      </defs>

      {/* Ambient halo behind */}
      <circle cx="140" cy="140" r="130" fill="url(#onb-e-glow)" />

      {/* Pastel disc/podium */}
      <g filter="drop-shadow(0 14px 24px rgba(0,0,0,.16))">
        <ellipse cx="140" cy="244" rx="106" ry="22" fill="url(#onb-e-disc)" />
        <ellipse cx="140" cy="238" rx="106" ry="22" fill="#e3eee9" />
      </g>

      {/* Floating coins above the piggy */}
      {/* Big coin top-left */}
      <g filter="drop-shadow(0 8px 16px rgba(201,168,76,.4))">
        <ellipse cx="68" cy="46" rx="20" ry="20" fill="url(#onb-e-coin-grad)" />
        <ellipse cx="68" cy="42" rx="20" ry="6" fill="#fff5d4" />
        <text x="68" y="52" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="20" fill="#7a5b1e">$</text>
      </g>
      {/* Mid coin top-right */}
      <g filter="drop-shadow(0 6px 14px rgba(201,168,76,.4))">
        <ellipse cx="206" cy="32" rx="16" ry="16" fill="url(#onb-e-coin-grad)" />
        <ellipse cx="206" cy="29" rx="16" ry="5" fill="#fff5d4" />
        <text x="206" y="38" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="16" fill="#7a5b1e">$</text>
      </g>
      {/* Small coin top-far-right */}
      <g filter="drop-shadow(0 5px 10px rgba(201,168,76,.35))">
        <ellipse cx="246" cy="78" rx="12" ry="12" fill="url(#onb-e-coin-grad)" opacity=".95" />
        <ellipse cx="246" cy="76" rx="12" ry="3.5" fill="#fff5d4" />
      </g>
      {/* Tiny coin top-far-left */}
      <g filter="drop-shadow(0 4px 8px rgba(201,168,76,.3))">
        <ellipse cx="32" cy="98" rx="10" ry="10" fill="url(#onb-e-coin-grad)" opacity=".9" />
        <ellipse cx="32" cy="96.5" rx="10" ry="3" fill="#fff5d4" />
      </g>

      {/* Piggy bank body */}
      <g filter="drop-shadow(0 22px 40px rgba(10,40,20,.28))">
        {/* main body */}
        <ellipse cx="140" cy="170" rx="80" ry="62" fill="url(#onb-e-pig)" />
        {/* side shadow for dimensionality */}
        <ellipse cx="140" cy="170" rx="80" ry="62" fill="url(#onb-e-pig-side)" />
        {/* belly highlight */}
        <ellipse cx="115" cy="148" rx="36" ry="22" fill="url(#onb-e-pig-spec)" opacity=".55" />

        {/* Snout */}
        <ellipse cx="208" cy="170" rx="22" ry="18" fill="url(#onb-e-snout)" />
        <ellipse cx="206" cy="167" rx="22" ry="6" fill="rgba(255,255,255,.08)" />
        {/* Nostrils */}
        <ellipse cx="210" cy="165" rx="2.6" ry="3" fill="#031608" />
        <ellipse cx="210" cy="175" rx="2.6" ry="3" fill="#031608" />

        {/* Eye */}
        <circle cx="180" cy="148" r="4.8" fill="#0a1410" />
        <circle cx="181" cy="146" r="1.8" fill="#fff" />

        {/* Cheek blush */}
        <ellipse cx="186" cy="170" rx="9" ry="5" fill="#ff9bb8" opacity=".4" />

        {/* Front ear */}
        <path d="M 124 122 L 116 100 L 138 112 Z" fill="#0d5524" filter="drop-shadow(0 2px 4px rgba(0,0,0,.2))" />
        <path d="M 126 120 L 122 109 L 134 115 Z" fill="rgba(255,255,255,.18)" />
        {/* Back ear (smaller, behind) */}
        <path d="M 96 134 L 90 116 L 108 124 Z" fill="#0a4419" opacity=".7" />

        {/* Coin slot */}
        <rect x="110" y="116" width="46" height="9" rx="4.5" fill="#031608" />
        <rect x="110" y="116" width="46" height="3" rx="2" fill="rgba(255,255,255,.12)" />

        {/* Legs */}
        <g fill="#0a4419">
          <rect x="84" y="216" width="18" height="18" rx="4" />
          <rect x="116" y="222" width="18" height="14" rx="4" />
          <rect x="148" y="222" width="18" height="14" rx="4" />
          <rect x="180" y="216" width="18" height="18" rx="4" />
        </g>

        {/* Tail — curly */}
        <path d="M 60 158 Q 46 152 54 166 Q 62 178 50 182 Q 42 184 46 192" stroke="#0a4419" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Coin mid-drop into slot */}
      <g transform="translate(133 100)" filter="drop-shadow(0 6px 12px rgba(201,168,76,.5))">
        <ellipse cx="0" cy="0" rx="11" ry="11" fill="url(#onb-e-coin-grad)" />
        <ellipse cx="0" cy="-2" rx="11" ry="3.5" fill="#fff5d4" />
        <text x="0" y="5" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="12" fill="#7a5b1e">$</text>
      </g>

      {/* APY chip — floating top-right */}
      <g transform="translate(220 116)" filter="drop-shadow(0 8px 18px rgba(0,134,58,.4))">
        <rect x="-32" y="-16" width="64" height="32" rx="16" fill="url(#onb-e-apy)" />
        <text x="0" y="-1" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="13" fill="#fff">12%</text>
        <text x="0" y="11" textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="7" fill="#fff" letterSpacing="1.2">APY</text>
      </g>
    </svg>
  ),

  p2p: () => <P2PIllustration />,
  card: () => <CardIllustration />,

  tier: () => (
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="onb-tr-cup" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FFE082" /><stop offset="1" stopColor="#C9A84C" /></linearGradient>
        <linearGradient id="onb-tr-base" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1B8C3E" /><stop offset="1" stopColor="#0d5524" /></linearGradient>
      </defs>
      <ellipse cx="120" cy="208" rx="70" ry="9" fill="rgba(0,0,0,.12)" />
      <g filter="drop-shadow(0 6px 14px rgba(0,0,0,.10))">
        <rect x="38" y="160" width="46" height="40" rx="6" fill="#cd7f32" />
        <text x="61" y="184" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="11" fill="#fff">3</text>
        <rect x="156" y="148" width="46" height="52" rx="6" fill="#a8a8b0" />
        <text x="179" y="178" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="11" fill="#fff">2</text>
        <rect x="92" y="124" width="56" height="76" rx="6" fill="url(#onb-tr-base)" />
        <text x="120" y="172" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="13" fill="#fff">1</text>
      </g>
      <g filter="drop-shadow(0 14px 28px rgba(201,168,76,.4))">
        <path d="M 86 76 Q 70 76 70 92 Q 70 108 86 108" stroke="url(#onb-tr-cup)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 154 76 Q 170 76 170 92 Q 170 108 154 108" stroke="url(#onb-tr-cup)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 86 60 L 154 60 L 152 110 Q 152 128 120 128 Q 88 128 88 110 Z" fill="url(#onb-tr-cup)" />
        <rect x="84" y="56" width="72" height="8" rx="2" fill="#FFE082" />
        <path d="M 120 88 L 124 96 L 132 97 L 126 103 L 128 112 L 120 107 L 112 112 L 114 103 L 108 97 L 116 96 Z" fill="#fff" opacity=".9" />
        <rect x="112" y="128" width="16" height="14" fill="#C9A84C" />
        <rect x="92" y="142" width="56" height="10" rx="2" fill="#1B8C3E" />
      </g>
      <g fill="#FFE082" opacity=".95">
        <path d="M 36 56 L 39 62 L 45 64 L 39 66 L 36 72 L 33 66 L 27 64 L 33 62 Z" />
        <path d="M 200 60 L 202 65 L 207 67 L 202 69 L 200 74 L 198 69 L 193 67 L 198 65 Z" />
      </g>
    </svg>
  ),

  shield: () => (
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="onb-s-shield" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".75" /></linearGradient>
        <radialGradient id="onb-s-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".4" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="120" cy="120" r="100" fill="url(#onb-s-glow)" />
      <ellipse cx="120" cy="208" rx="60" ry="9" fill="rgba(0,0,0,.18)" />
      <g filter="drop-shadow(0 18px 36px rgba(0,0,0,.20))">
        <path d="M 120 50 L 178 70 L 178 124 Q 178 168 120 198 Q 62 168 62 124 L 62 70 Z" fill="url(#onb-s-shield)" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
        <path d="M 120 70 L 162 86 L 162 122 Q 162 154 120 178 Q 78 154 78 122 L 78 86 Z" fill="rgba(0,200,83,.12)" />
        <path d="M 96 122 L 114 140 L 148 102" stroke="#1B8C3E" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g fill="#fff" opacity=".95">
        <path d="M 50 60 L 53 67 L 60 70 L 53 73 L 50 80 L 47 73 L 40 70 L 47 67 Z" />
        <path d="M 196 70 L 198 75 L 204 77 L 198 79 L 196 84 L 194 79 L 188 77 L 194 75 Z" />
      </g>
    </svg>
  ),
}
