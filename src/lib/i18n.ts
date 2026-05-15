/**
 * i18n bootstrap — react-i18next wired with bullet-proof fallback behavior.
 *
 * Design principles:
 *   1. **Stable keys, not English text as keys.** Use `home.greeting.morning`
 *      not the English string. Lets us refactor copy without breaking lookups.
 *   2. **English is the master.** Every locale forks from `en.json`. Missing
 *      keys fall through to English, so new strings work even if a translation
 *      hasn't shipped yet. NO scrambled/broken text — guaranteed.
 *   3. **Lazy loading.** Languages other than English load on demand so the
 *      initial bundle stays small.
 *   4. **Persisted choice.** Language preference is stored in localStorage and
 *      restored on next visit. Falls back to browser language if unset.
 *   5. **Number / date / currency formatting** uses Intl APIs (not strings),
 *      so they automatically respect the active locale.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// English is the master/fallback locale — bundled eagerly. The other 13
// locales (~960 KB of JSON combined) are split into their own chunks and
// loaded on demand via loadLocale(), so an English user never downloads
// translations they'll never see. This is what the file header always
// claimed; the imports below used to pull every locale into the entry chunk.
import en from '../locales/en.json'

// Dynamic-import loaders — Vite emits one chunk per locale. The import path
// must stay a literal for the chunk to split.
const LOCALE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  es: () => import('../locales/es.json'),
  fr: () => import('../locales/fr.json'),
  de: () => import('../locales/de.json'),
  pt: () => import('../locales/pt.json'),
  it: () => import('../locales/it.json'),
  nl: () => import('../locales/nl.json'),
  hi: () => import('../locales/hi.json'),
  ar: () => import('../locales/ar.json'),
  zh: () => import('../locales/zh.json'),
  ja: () => import('../locales/ja.json'),
  ko: () => import('../locales/ko.json'),
  ru: () => import('../locales/ru.json'),
  tr: () => import('../locales/tr.json'),
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',     native: 'English',    flag: 'us' },
  { code: 'es', name: 'Spanish',     native: 'Español',    flag: 'es' },
  { code: 'fr', name: 'French',      native: 'Français',   flag: 'fr' },
  { code: 'de', name: 'German',      native: 'Deutsch',    flag: 'de' },
  { code: 'pt', name: 'Portuguese',  native: 'Português',  flag: 'pt' },
  { code: 'it', name: 'Italian',     native: 'Italiano',   flag: 'it' },
  { code: 'nl', name: 'Dutch',       native: 'Nederlands', flag: 'nl' },
  { code: 'hi', name: 'Hindi',       native: 'हिन्दी',       flag: 'in' },
  { code: 'ar', name: 'Arabic',      native: 'العربية',     flag: 'sa', rtl: true },
  { code: 'zh', name: 'Chinese',     native: '中文',         flag: 'cn' },
  { code: 'ja', name: 'Japanese',    native: '日本語',       flag: 'jp' },
  { code: 'ko', name: 'Korean',      native: '한국어',        flag: 'kr' },
  { code: 'ru', name: 'Russian',     native: 'Русский',    flag: 'ru' },
  { code: 'tr', name: 'Turkish',     native: 'Türkçe',     flag: 'tr' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// Only English is present at init — others are added by loadLocale().
const resources = {
  en: { translation: en },
}

/**
 * Pull a locale's translation bundle into i18next on demand. Safe to call
 * repeatedly — no-ops once the bundle is registered. English is always
 * present, so it short-circuits. After the bundle lands, react-i18next
 * re-renders subscribed components (useSuspense is off).
 */
export async function loadLocale(lng: string): Promise<void> {
  const code = String(lng || '').split('-')[0]
  if (!code || code === 'en') return
  if (i18n.hasResourceBundle(code, 'translation')) return
  const loader = LOCALE_LOADERS[code]
  if (!loader) return
  try {
    const mod = await loader()
    i18n.addResourceBundle(code, 'translation', mod.default, true, true)
  } catch {
    /* keep English fallback on load failure */
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),
    // CRITICAL: never let a missing translation explode the page.
    // Always render the English fallback (and ultimately the key path) so
    // there's no "scrambled code-looking text" anywhere.
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: (key) => {
      // Last-resort fallback: split a key like "home.greeting.morning" into
      // a pretty leaf "Morning". Words are split on hyphens, underscores AND
      // camelCase boundaries so "pickSavedTitle" becomes "Pick Saved Title"
      // instead of "PickSavedTitle". Keeps caller-side `t('foo') || 'real'`
      // patterns working for keys we never bothered to register.
      const leaf = key.split('.').pop() ?? key
      return leaf
        .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase())
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'crymadx.lang',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // English is bundled; other locales stream in async
    },
  })

// Pull in the detected/saved locale's bundle (no-op for English). On a fresh
// non-English session this resolves a beat after first paint — react-i18next
// re-renders once the bundle lands; until then English shows. main.tsx
// awaits this before the first render to avoid that flash on cold start.
export const initialLocaleReady: Promise<void> = loadLocale(i18n.language)

// When the user switches language, fetch its bundle before/while i18next
// flips over. addResourceBundle inside loadLocale triggers the re-render.
i18n.on('languageChanged', (lng) => { void loadLocale(lng) })

// Apply text direction (RTL for Arabic) when the language changes
function applyDirection(lng: string) {
  const meta = SUPPORTED_LANGUAGES.find(l => l.code === lng)
  const dir = (meta as any)?.rtl ? 'rtl' : 'ltr'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lng)
    document.documentElement.setAttribute('dir', dir)
  }
}
applyDirection(i18n.language)
i18n.on('languageChanged', applyDirection)

export default i18n

/**
 * Locale-aware number formatter.
 * `fmtNum(1234.56)` → "1,234.56" in en-US, "1.234,56" in de-DE.
 */
export function fmtNum(n: number | string, opts?: Intl.NumberFormatOptions): string {
  const num = typeof n === 'string' ? parseFloat(n.replace(/,/g, '')) : n
  if (!isFinite(num)) return '0'
  try {
    return new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2, minimumFractionDigits: 2, ...opts }).format(num)
  } catch {
    return String(num)
  }
}

/** Locale-aware currency formatter. */
export function fmtCurrency(n: number | string, currency = 'USD'): string {
  const num = typeof n === 'string' ? parseFloat(n.replace(/,/g, '')) : n
  if (!isFinite(num)) return '0'
  try {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency, maximumFractionDigits: 2 }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}

/** Locale-aware relative date ("2 days ago", "il y a 2 jours"). */
export function fmtRelative(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const diffMs = d.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  let unit: Intl.RelativeTimeFormatUnit = 'second'
  let value = diffMs / 1000
  if (absMs >= 86400000)      { unit = 'day';    value = diffMs / 86400000 }
  else if (absMs >= 3600000)  { unit = 'hour';   value = diffMs / 3600000 }
  else if (absMs >= 60000)    { unit = 'minute'; value = diffMs / 60000 }
  try {
    return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(Math.round(value), unit)
  } catch {
    return d.toLocaleDateString()
  }
}
