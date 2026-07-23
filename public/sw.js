/* Minimal service worker: cache the app shell, network-first for everything
 * else. User data is NEVER cached — privacy first. */
const CACHE = 'swingset-v3'
// Relative URLs resolve against the SW's own location, so the same file works
// at the domain root (Firebase Hosting) and under /theswingset/ (GitHub Pages).
const SHELL = ['./', './index.html', './pineapple.svg', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// ---------- web push ----------

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    /* non-JSON payload — fall through to defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'The Swingset', {
      body: data.body ?? 'New activity',
      icon: './pineapple.svg',
      badge: './pineapple.svg',
      data: { link: data.link ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Resolve the app-relative link against the SW scope so it works both at
  // the domain root and under /theswingset/ on GitHub Pages.
  const link = event.notification.data?.link ?? '/'
  const url = new URL('.' + link, self.registration.scope).href
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const existing = wins.find((w) => w.url.startsWith(self.registration.scope))
      if (existing) {
        existing.focus()
        return existing.navigate(url)
      }
      return clients.openWindow(url)
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Only handle same-origin GETs for static assets; Firebase traffic and all
  // API calls go straight to the network.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache hashed build assets as they stream through.
        if (response.ok && url.pathname.includes('/assets/')) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ??
            (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()),
        ),
      ),
  )
})
