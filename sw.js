const SHELL_CACHE = 'zigoricko-shell-v1';
const TRACK_CACHE = 'zigoricko-tracks-v1';
const COVER_CACHE = 'zigoricko-covers-v1';

const CORE_ASSETS = ['./', './index.html', './avatar.jpg', './manifest.json'];
for (let i = 1; i <= 24; i++) CORE_ASSETS.push(`./track${i}.jpg`);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => 
    Promise.all(keys.filter(k => ![SHELL_CACHE, TRACK_CACHE, COVER_CACHE].includes(k)).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.pathname.endsWith('.mp3')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => {
    if (cached) return cached;
    return fetch(e.request).then(r => {
      if (r && r.status === 200 && (e.request.destination === 'image' || u.pathname.endsWith('.jpg'))) {
        caches.open(COVER_CACHE).then(c => c.put(e.request, r.clone()));
      }
      return r;
    }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined);
  }));
});
