const CACHE_VERSION = 'imastun-shell-v10';
const APP_SHELL = [
  './',
  './index.html',
  './silva-gulanyan.html',
  './manifest.json',
  './logo.png',
  './audio-player-fix.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

const MEDIA_PATH = /\.(?:mp3|mp4|wav|m4a|aac|ogg|webm|mov)(?:$|\?)/i;

function navigationCacheKey(url) {
  const scope = new URL(self.registration.scope);
  let relativePath = url.pathname;
  if (relativePath.startsWith(scope.pathname)) {
    relativePath = relativePath.slice(scope.pathname.length);
  }
  relativePath = relativePath.replace(/^\/+|\/+$/g, '');

  if (!relativePath || relativePath === 'index.html') {
    return new URL('./index.html', scope).href;
  }
  if (relativePath === 'silva-gulanyan' || relativePath === 'silva-gulanyan.html') {
    return new URL('./silva-gulanyan.html', scope).href;
  }
  return url.href;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('imastun-shell-') && key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;
  if (MEDIA_PATH.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    const cacheKey = navigationCacheKey(url);
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.put(cacheKey, copy)));
        }
        return response;
      }).catch(() => caches.match(cacheKey).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)));
        }
        return response;
      });
    })
  );
});
