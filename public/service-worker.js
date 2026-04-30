/**
 * CrymadX mobile Service Worker
 * -----------------------------
 *  1. `push` / `notificationclick` — system notifications
 *  2. `fetch` — caching layer for app shell + static assets + coin icons
 *
 * Caching is auth-safe by design:
 *   - We NEVER cache requests that carry an Authorization header
 *   - We NEVER cache POST/PUT/PATCH/DELETE
 *   - We NEVER cache /api/ responses
 *   - Only same-origin static assets and a small allowlist of public CDN
 *     image hosts (CoinGecko, CoinCap, CryptoLogos) are eligible
 *
 * Cache versions are encoded in the names; bumping them on a deploy
 * automatically purges old entries on activate.
 */

const VERSION = 'v3'
const STATIC_CACHE = `crymadx-static-${VERSION}`
const ASSET_CACHE  = `crymadx-assets-${VERSION}`
const ICON_CACHE   = `crymadx-icons-${VERSION}`
const ALL_CACHES = [STATIC_CACHE, ASSET_CACHE, ICON_CACHE]

// External hosts whose images we treat as immutable (cache 30d, never re-fetch
// unless evicted). Add a host here ONLY if it serves stable, public images.
const ICON_HOST_ALLOWLIST = [
  'assets.coingecko.com',
  'coin-images.coingecko.com',
  'cryptologos.cc',
  'static.coincap.io',
  'cryptoicon-api.pages.dev',
  's2.coinmarketcap.com',
]

const APP_SHELL_PATHS = ['/', '/index.html']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  // Pre-warm the app shell so the first offline visit works.
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL_PATHS).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop caches that are no longer in the allowlist (i.e. old VERSION names)
    const names = await caches.keys()
    await Promise.all(names.map(n => ALL_CACHES.includes(n) ? null : caches.delete(n)))
    await self.clients.claim()
  })())
})

// ─── fetch — caching strategy ──────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 1. Never cache cross-origin requests except our explicit icon allowlist
  const sameOrigin = url.origin === self.location.origin
  const isIconHost = ICON_HOST_ALLOWLIST.includes(url.hostname)
  if (!sameOrigin && !isIconHost) return

  // 2. Never cache /api/ — these are auth-bearing or user-specific
  if (sameOrigin && url.pathname.startsWith('/api/')) return

  // 3. Never cache anything carrying Authorization header
  if (req.headers.get('authorization')) return

  // 4. Same-origin SPA navigation → network-first with shell fallback
  if (sameOrigin && req.mode === 'navigate') {
    event.respondWith(networkFirstWithShellFallback(req))
    return
  }

  // 5. Hashed build assets (/assets/index-*.js / .css / images): cache-first.
  //    Vite hashes filenames so the URL changes when content changes.
  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, ASSET_CACHE))
    return
  }

  // 6. Same-origin static images / icons / fonts: stale-while-revalidate.
  //    Filename isn't hashed so we want to re-fetch in the background.
  if (sameOrigin && /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE))
    return
  }

  // 7. Coin icon CDNs: cache-first (these URLs are immutable)
  if (isIconHost) {
    event.respondWith(cacheFirst(req, ICON_CACHE))
    return
  }

  // 8. Anything else (manifest, JSON, etc.): network as-is
})

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(req)
  if (hit) return hit
  try {
    const res = await fetch(req)
    // Only cache successful basic/cors responses
    if (res && (res.status === 200 || res.type === 'opaque')) {
      cache.put(req, res.clone()).catch(() => {})
    }
    return res
  } catch (e) {
    // Last-ditch: maybe a stale entry exists in another cache
    const fallback = await caches.match(req)
    if (fallback) return fallback
    throw e
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(req)
  const networkPromise = fetch(req).then(res => {
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {})
    return res
  }).catch(() => null)
  return hit || (await networkPromise) || new Response('', { status: 504 })
}

async function networkFirstWithShellFallback(req) {
  try {
    const res = await fetch(req)
    // Cache the index.html for offline / instant repeat visits
    if (res && res.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put('/index.html', res.clone()).catch(() => {})
    }
    return res
  } catch {
    const cached = await caches.match('/index.html') || await caches.match('/')
    if (cached) return cached
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

// ─── push / notification (unchanged) ──────────────────────────────────────

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'CrymadX', body: event.data?.text() || '' }
  }

  const title = payload.title || 'CrymadX'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/crymadx-mark.png',
    badge: payload.badge || '/crymadx-mark.png',
    tag: payload.tag || payload.category || 'default',
    vibrate: [80, 40, 80],
    data: { href: payload.href, ...payload.data },
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification.data?.href || '/'
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus()
        client.postMessage({ type: 'navigate', href })
        return
      }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(href)
    }
  })())
})

// ─── messages from the page (e.g. force-skip-waiting) ─────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
