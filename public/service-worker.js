// Creator IA Pro - Service Worker
// Provides offline support, caching, and background sync

const CACHE_NAME = 'creator-ia-v3'; // v3: /api/ NUNCA se cachea (v2 servía respuestas viejas de la API con red inestable)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/og-image.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // La API NUNCA pasa por el service worker. La v2 cacheaba /api/profile,
  // /api/basalt/conversations, la sesión… y con la red inestable servía esas
  // respuestas VIEJAS desde caché: créditos desactualizados, estados imposibles y la
  // pantalla de "Algo salió mal" (incidente real, 2026-10-05, ERR-1791229042501).
  // Solo cacheamos lo nuestro y estático; lo de otros orígenes, tampoco.
  if (url.pathname.startsWith('/api/')) return;
  if (url.origin !== self.location.origin) return;

  // Skip analytics
  if (request.url.includes('analytics') || request.url.includes('sentry')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If offline and no cache, return offline page
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // Un chunk con hash de un despliegue anterior no está en la caché nueva:
          // responder 503 hacía reventar el import() y salía la pantalla de error.
          // Mejor dejar que el error sea de red de verdad: el manejador de
          // vite:preloadError (src/main.tsx) recarga la página una vez.
          return Response.error();
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Creator IA Pro', {
      body: data.body ?? 'Nueva notificación',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag ?? 'default',
      requireInteraction: data.requireInteraction ?? false,
      actions: data.actions ?? [],
      data: data.payload ?? {},
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const payload = event.notification.data;
      const url = payload?.url ?? '/';

      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
