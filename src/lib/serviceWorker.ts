/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'creator-ia-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
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

  // Skip Supabase API requests
  if (request.url.includes('supabase.co')) return;

  // Skip analytics and external APIs
  if (request.url.includes('openrouter.ai')) return;
  if (request.url.includes('fal.ai')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();

        // Open cache and store response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

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

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-credits') {
    event.waitUntil(syncPendingCredits());
  }
});

async function syncPendingCredits() {
  // Sync pending credit transactions when back online
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
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
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

export {};
