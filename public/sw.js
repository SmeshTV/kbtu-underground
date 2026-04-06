// Service Worker для Push-уведомлений FCM
const CACHE_NAME = 'kbtu-schedule-v3';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// Push notification handler (FCM)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  
  let title = '📚 KBTU Расписание';
  let options = {
    body: 'Проверь расписание',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'kbtu-schedule',
    requireInteraction: true,
    actions: [
      { action: 'open', title: '📖 Открыть' },
      { action: 'dismiss', title: '✖ Закрыть' }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.notification) {
        title = data.notification.title || title;
        options.body = data.notification.body || options.body;
      }
      if (data.data) {
        options.tag = data.data.tag || options.tag;
      }
    } catch (e) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Periodic sync для проверки когда сайт открыт
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-upcoming') {
    event.waitUntil(checkUpcoming());
  }
});

async function checkUpcoming() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'CHECK_UPCOMING' });
  });
}

// Message handler from main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: '/icon-192.svg',
      tag: event.data.tag || 'schedule',
      requireInteraction: event.data.requireInteraction || false,
    });
  }
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
