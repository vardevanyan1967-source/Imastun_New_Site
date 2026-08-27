const CACHE_VERSION = 'imastun-shell-v10';
const PLAYER_FIX_VERSION = 'unified-crossfade-v10';
const APP_SHELL = ['./', './index.html', './manifest.json', './logo.png', './audio-player-fix.js'];

function injectPlayerFix(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  return response.text().then(html => {
    if (!html.includes('audio-player-fix.js')) {
      html = html.replace('</body>', `  <script src="./audio-player-fix.js?v=${PLAYER_FIX_VERSION}"></script>\n</body>`);
    }
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  });
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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => Promise.all(clients.map(client => {
        try {
          const url = new URL(client.url);
          if (url.searchParams.get('_playerfix') === PLAYER_FIX_VERSION) return null;
          url.searchParams.set('_playerfix', PLAYER_FIX_VERSION);
          return client.navigate(url.href).catch(() => null);
        } catch (e) {
          return null;
        }
      })))
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(?:mp3|mp4|wav|m4a|webm|mov)$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
      return injectPlayerFix(response);
    }).catch(() => caches.match('./index.html').then(injectPlayerFix)));
    return;
  }

  if (url.pathname.endsWith('/audio-player-fix.js')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    const network = fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    });
    return cached || network;
  }));
});
