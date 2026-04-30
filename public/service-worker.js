/**
 * CrymadX mobile Service Worker
 * -----------------------------
 * Handles two things:
 *
 *   1. `push` event — fires when the OS receives a push notification from
 *      our notification-service. Even if the app is closed, this wakes the
 *      browser process and runs this code, which then renders a system
 *      notification (the OS-level banner that pings the phone).
 *
 *   2. `notificationclick` event — fires when the user taps a system
 *      notification. We open the app (or focus it if already open) and
 *      navigate to the deep link the server included in the payload.
 *
 * Lives at /service-worker.js (root scope). Vite serves anything under
 * `public/` at the site root, so this file is reachable as `/service-worker.js`
 * which means it can control the entire site origin.
 */

self.addEventListener('install', (event) => {
  // Take control of clients immediately on first install. Otherwise the SW
  // won't activate until all open tabs are closed — too aggressive a wait
  // for a fresh install during onboarding.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // Server payload shape (sent by notification-service via web-push):
  //   { title, body, icon?, badge?, href?, tag?, data? }
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
    // `tag` collapses repeat notifications of the same kind so the user's
    // notification shade doesn't fill up with duplicates.
    tag: payload.tag || payload.category || 'default',
    // Vibrate pattern: short-pause-short. Phones with vibrate motors honor it.
    vibrate: [80, 40, 80],
    // Carry the deep link through to the click handler
    data: { href: payload.href, ...payload.data },
    // Force the OS to actually show the notification — without this, browsers
    // may suppress it if the user has the page open and focused.
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification.data?.href || '/'

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    // If the app is already open in a tab, focus it and navigate
    for (const client of allClients) {
      // 'focus' reactivates the existing tab on mobile + desktop
      if ('focus' in client) {
        await client.focus()
        // Send a message so the running app can route to the deep link
        // without forcing a reload (which would lose state).
        client.postMessage({ type: 'navigate', href })
        return
      }
    }
    // Otherwise open a fresh tab at the deep link
    if (self.clients.openWindow) {
      await self.clients.openWindow(href)
    }
  })())
})
