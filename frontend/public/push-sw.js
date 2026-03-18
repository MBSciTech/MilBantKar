self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'MilBantKar',
      body: event.data ? event.data.text() : 'You have a new notification.',
    };
  }

  const title = payload.title || 'MilBantKar';
  const body = payload.body || 'You have a new reminder.';
  const url = payload.url || '/history';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/history';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
