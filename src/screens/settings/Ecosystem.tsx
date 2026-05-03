/**
 * Ecosystem — the family of Cryptomadness products users can navigate to.
 *
 * Mirrors the website's EcosystemScreen (src/screens/ecosystem/EcosystemScreen.tsx)
 * but adapted for a phone:
 *   - single-column scrollable layout instead of 4-up grid
 *   - tap to open (no hover flip — that doesn't translate to touch)
 *   - simplified animations (one entrance fade per card, gentle pulse on the hub)
 *   - native external open via @capacitor/browser when on a Capacitor build
 *
 * Source data — names, URLs, descriptions, brand colors, logos — is the
 * canonical website list so the two surfaces stay in sync.
 */
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { haptics } from '../../lib/haptics'

type Platform = {
  id: string
  name: string
  tagline: string
  description: string
  logo: string
  url: string
  color: string
  glow: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'crymadx',
    name: 'CrymadX',
    tagline: 'Decentralized Exchange',
    description: 'Buy, sell, trade, P2P, API access, advanced portfolio management, savings and staking.',
    logo: 'https://res.cloudinary.com/dxvi5d6dr/image/upload/v1776598790/photo_5942880191338187586_y_oh9r7d-removebg-preview_jiqpzd.png',
    url: 'https://www.crymadx.io',
    color: '#00FF88',
    glow: 'rgba(0, 255, 136, 0.45)',
  },
  {
    id: 'crymadcash',
    name: 'CrymadCash',
    tagline: 'Digital Banking',
    description: 'Crypto + fiat integration, global payments, virtual cards, and full-featured digital banking.',
    logo: 'https://res.cloudinary.com/dxvi5d6dr/image/upload/v1766762874/photo_2025-12-24_18.04.43-removebg-preview_ck9wyx.png',
    url: 'https://production-crmdx.web.app/sign-up',
    color: '#00D4FF',
    glow: 'rgba(0, 212, 255, 0.45)',
  },
  {
    id: 'pipzen',
    name: 'Pipzen',
    tagline: 'Prop Trading Firm',
    description: 'Trader funding, crypto funding programs, and instant funding opportunities.',
    logo: 'https://res.cloudinary.com/dxvi5d6dr/image/upload/v1766761325/5dfcce09-e472-4c80-bdbd-580270538ee9-removebg-preview__1_-removebg-preview_ugyn22.png',
    url: 'https://www.pipzen.io',
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  {
    id: 'crymadhash',
    name: 'CrymadHash',
    tagline: 'Crypto Mining',
    description: 'Crypto mining platform with high-end equipment, mining autopilot, and automatic payouts.',
    logo: 'https://res.cloudinary.com/dxvi5d6dr/image/upload/v1766762874/Screenshot_2025-11-18_at_18.11.34_qi0tcp-removebg-preview_vtkxtc.png',
    url: 'https://crymadhsh.tech/',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
]

const HUB = {
  name: 'Cryptomadness',
  tagline: 'The brain of the ecosystem',
  url: 'https://www.cryptomadness.info',
  logo: 'https://res.cloudinary.com/dxvi5d6dr/image/upload/v1766761507/trans_pgrnww.png',
}

// Same import-via-Function trick the CheckoutModal uses so the bundler
// doesn't try to statically resolve @capacitor/* on web builds.
const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

async function openExternal(url: string) {
  haptics.medium()
  try {
    const [coreMod, browserMod] = await Promise.all([
      dynImport('@capacitor/core').catch(() => null),
      dynImport('@capacitor/browser').catch(() => null),
    ])
    if (coreMod?.Capacitor?.isNativePlatform?.() && browserMod?.Browser) {
      await browserMod.Browser.open({ url, presentationStyle: 'popover' })
      return
    }
  } catch { /* fall through */ }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function Ecosystem() {
  const { t } = useTranslation()

  return (
    <PhoneShell noTabs>
      <ScreenHeader title={t('settings.ecosystem')} />
      <div className="t2">{t('settings.ecoFamily')}</div>

      {/* Central hub — Cryptomadness. Tappable card with a soft pulsing glow
          and orbiting accent ring (single ring instead of three to keep this
          performant on lower-end phones). */}
      <motion.button
        type="button"
        onClick={() => openExternal(HUB.url)}
        whileTap={{ scale: 0.98 }}
        aria-label={`Visit ${HUB.name}`}
        style={{
          width: '100%',
          marginTop: 12,
          padding: 18,
          borderRadius: 18,
          border: '1.5px solid rgba(0, 200, 83, 0.35)',
          background: 'linear-gradient(145deg, rgba(0, 210, 106, 0.12), rgba(0, 0, 0, 0.4))',
          color: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 168,
        }}
      >
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 220, height: 220,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px dashed rgba(0, 200, 83, 0.25)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <motion.div
            animate={{ boxShadow: [
              '0 0 16px rgba(0, 200, 83, 0.25)',
              '0 0 32px rgba(0, 200, 83, 0.45)',
              '0 0 16px rgba(0, 200, 83, 0.25)',
            ] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 72, height: 72,
              borderRadius: '50%',
              border: '2px solid var(--gl)',
              background: 'radial-gradient(circle, rgba(0, 200, 83, 0.25), rgba(0, 0, 0, 0.6))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={HUB.logo}
              alt={HUB.name}
              loading="lazy"
              style={{ width: 44, height: 44, objectFit: 'contain' }}
            />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gl)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('settings.ecoBrain') || 'Brain of the ecosystem'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', marginTop: 2, letterSpacing: '-0.01em' }}>
              {HUB.name}
            </div>
            <div className="t3" style={{ marginTop: 4, lineHeight: 1.4 }}>
              {HUB.tagline}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--gl)', fontSize: 12, fontWeight: 700 }}>
              <span>{t('settings.ecoVisit') || 'Visit platform'}</span>
              <Icon name="ext" size={11} color="var(--gl)" />
            </div>
          </div>
        </div>
      </motion.button>

      <h3 style={{ marginTop: 16, marginBottom: 4 }}>
        {t('settings.connectedPlatforms') || 'Connected platforms'}
      </h3>
      <div className="t3" style={{ marginBottom: 8 }}>
        {t('settings.ecoTapHint') || 'Tap a platform to open it.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PLATFORMS.map((p, i) => (
          <PlatformCard key={p.id} platform={p} index={i} />
        ))}
      </div>
    </PhoneShell>
  )
}

function PlatformCard({ platform, index }: { platform: Platform; index: number }) {
  const { t } = useTranslation()
  return (
    <motion.button
      type="button"
      onClick={() => openExternal(platform.url)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 * index }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Visit ${platform.name} — ${platform.tagline}`}
      style={{
        width: '100%',
        padding: 14,
        borderRadius: 14,
        border: `1.5px solid ${platform.color}55`,
        background: `linear-gradient(135deg, ${platform.color}14, rgba(0, 0, 0, 0.18))`,
        boxShadow: `0 0 22px ${platform.glow}, 0 4px 14px rgba(0, 0, 0, 0.35)`,
        color: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 96,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 56, height: 56,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${platform.color}28, ${platform.color}08)`,
            border: `1px solid ${platform.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 8,
            flexShrink: 0,
          }}
        >
          <img
            src={platform.logo}
            alt={platform.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
              {platform.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: platform.color,
                background: `${platform.color}1f`,
                border: `1px solid ${platform.color}44`,
                borderRadius: 999,
                padding: '2px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1.4,
              }}
            >
              {platform.tagline}
            </span>
          </div>
          <div className="t3" style={{ marginTop: 6, lineHeight: 1.45 }}>
            {platform.description}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: platform.color, fontSize: 12, fontWeight: 700 }}>
            <span>{t('settings.ecoVisit') || 'Visit platform'}</span>
            <Icon name="ext" size={11} color={platform.color} />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
