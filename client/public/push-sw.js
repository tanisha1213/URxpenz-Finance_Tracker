// Custom Push Notification Handler for Xpenz PWA
// Receives OS-level background notifications when the app and browser tab are completely closed

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Xpenz Financial Alert',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Xpenz Reminder 💰';
  const options = {
    body: data.body || data.message || 'You have an upcoming loan or financial reminder.',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'xpenz-alert',
    renotify: true,
    data: {
      url: data.url || '/loans',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'Open Xpenz' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open (app is closed), open a new window directly
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
