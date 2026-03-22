const CACHE = 'misfinanzas-v1';
const ASSETS = [
  '/Mis-Finanzas-2026/',
  '/Mis-Finanzas-2026/index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip Firebase requests — always need network for data sync
  if(e.request.url.includes('firebase') || 
     e.request.url.includes('firebaseio') ||
     e.request.url.includes('googleapis.com/identitytoolkit')){
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // Fallback to main page for navigation requests
          if(e.request.mode === 'navigate'){
            return caches.match('/Mis-Finanzas-2026/index.html');
          }
        });
      })
  );
});
