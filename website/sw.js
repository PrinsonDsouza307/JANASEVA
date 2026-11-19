/**
 * JANASEVA – Service Worker (MongoDB Realtime Edition)
 * Provides Offline-First App Shell caching, asset persistence, and automatic cache invalidation.
 */

const CACHE_NAME = 'janaseva-v6-mongodb-live';
const STATIC_ASSETS = [
  './',
  './index.html',
  './complaint.html',
  './track.html',
  './citizen-dashboard.html',
  './receiver-dashboard.html',
  './receiver-settings.html',
  './admin-emergency-reset.html',
  './login.html',
  './directory.html',
  './knowledge-centre.html',
  './about.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/translations.js',
  './js/universal-settings.js',
  './js/auth.js',
  './js/status-config.js',
  './js/complaints.js',
  './js/tracking.js',
  './js/directory.js',
  './js/complaint-storage-manager.js',
  './js/offline-db.js',
  './js/email.js',
  './js/receiver-settings.js',
  './js/ai-chat-services.js',
  './js/ai-voice-assistant.js',
  './js/ocr-document-store.js',
  './js/hybrid-ocr-engine.js',
  './js/document-verifier.js',
  './js/ai-prioritization.js',
  './js/citizen-dashboard.js',
  './js/receiver-dashboard.js',
  './js/admin-banner-service.js',
  './js/admin-banner-ui.js',
  './js/emergency-reset-engine.js',
  './js/emergency-reset-controller.js',
  './js/knowledge-parsers.js',
  './js/knowledge-security.js',
  './js/knowledge-rag.js',
  './js/knowledge-storage.js',
  './js/knowledge-centre-ui.js',
  './js/knowledge-admin.js',
  './js/mongodb-adapter.js',
  './assets/branding/janaseva-logo.png',
  './assets/branding/janaseva-logo-transparent.png',
  './assets/branding/janaseva-icon.png',
  './assets/branding/favicon-32x32.png',
  './assets/branding/favicon-16x16.png',
  './assets/branding/apple-touch-icon.png',
  './assets/branding/android-icon-192.png',
  './assets/branding/android-icon-512.png',
  './assets/ashoka-emblem.png',
  './assets/panchayat-building.png',
  './assets/hero-panchayat-bg.png',
  './assets/complaint-road.png',
  './assets/complaint-garbage.png',
  './assets/complaint-water.png',
  './assets/login-illustration.png',
  './assets/register-illustration.png',
  './assets/about-laptop.png'
];

// Install Event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[JANASEVA SW] Caching app shell assets...');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[JANASEVA SW] Some assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Purge ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[JANASEVA SW] Purging outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for JS, HTML and API, Cache-First for static images/fonts
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never cache API calls or APK releases
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/android/') || url.pathname.endsWith('.apk')) {
    return;
  }

  // Network-First strategy for JS, CSS, and HTML (always get latest code)
  const isCodeOrPage = url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname === '/' || !url.pathname.includes('.');

  if (isCodeOrPage) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cache when offline
        return caches.match(request, { ignoreSearch: true });
      })
    );
    return;
  }

  // Cache-First for images and fonts
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});
