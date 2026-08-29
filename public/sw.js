// Service Worker for CPHB Emergency Alert System
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🚨 HOSPITAL CODE ALERT', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 EMERGENCY CODE ALERT';
  const options = {
    body: data.body || 'Immediate Responder Deployment Required!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [500, 200, 500, 200, 1000],
    tag: 'cphb-emergency-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/responder',
    },
    actions: [
      { action: 'respond', title: '🏃 I AM RESPONDING' },
      { action: 'view', title: '👁️ VIEW DETAILS' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click -> Open or Focus App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/responder';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/responder') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
