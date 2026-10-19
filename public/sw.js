/* Cache the ListenShelf app shell. External MP3 streams are never cached. */
const CACHE = 'listenshelf-shell-2026-10-v2'
const SCOPE = '/ListenShelf/'
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) =>
    cache.addAll([SCOPE, SCOPE + 'favicon.svg', SCOPE + 'manifest.webmanifest'])
  ).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((key) => key.startsWith('listenshelf-shell-') && key !== CACHE)
      .map((key) => caches.delete(key)))
  ).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // Only app assets from GitHub Pages. Don't intercept external audio.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return
  if (event.request.headers.has('range')) return
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)))
    }
    return response
  }).catch(async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached
    if (event.request.mode === 'navigate') {
      const home = await caches.match(SCOPE)
      if (home) return home
    }
    return new Response('ListenShelf is offline. Reconnect to stream audio.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    })
  }))
})
