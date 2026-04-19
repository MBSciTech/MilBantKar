const API_BASE = 'https://milbantkar-1.onrender.com';
const API_FALLBACK = 'http://localhost:5000';

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

  const options = {
    body,
    icon: payload.icon || '/logo192.png',
    badge: payload.badge || '/logo192.png',
    tag: payload.tag || 'notification',
    data: payload.data || { url }
  };

  // Add action buttons if they exist
  if (payload.actions && payload.actions.length > 0) {
    options.actions = payload.actions;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = notification.data;

  notification.close();

  // Handle settlement confirmation actions
  if (data && data.action === 'settlement_confirmation') {
    if (event.action === 'confirm-yes') {
      event.waitUntil(handleSettlementConfirmation(data.expenseId, data.userId, true));
    } else if (event.action === 'confirm-no') {
      event.waitUntil(handleSettlementConfirmation(data.expenseId, data.userId, false));
    } else {
      event.waitUntil(openApp());
    }
  } else {
    // Default behavior - open app
    const targetUrl = (data && data.url) || '/history';
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
  }
});

// Handle settlement confirmation from notification action
async function handleSettlementConfirmation(expenseId, userId, confirmed) {
  try {
    if (!expenseId || !userId) {
      await self.registration.showNotification('MilBantKar', {
        body: 'Please open the app to complete confirmation.',
        icon: '/logo192.png'
      });
      return openApp();
    }

    const payload = {
      userId,
      confirmed
    };

    let response;
    try {
      response = await fetch(`${API_BASE}/api/expense/status/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      response = await fetch(`${API_FALLBACK}/api/expense/status/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      await self.registration.showNotification('MilBantKar', {
        body: 'Could not update settlement. Please open the app.',
        icon: '/logo192.png'
      });
      return openApp();
    }

    const result = await response.json();

    if (confirmed && result.status) {
      await self.registration.showNotification('All settled', {
        body: 'Payment confirmed and settled successfully.',
        icon: '/logo192.png',
        tag: `settlement-complete-${expenseId}`
      });
      return;
    }

    if (confirmed) {
      await self.registration.showNotification('Confirmed', {
        body: 'You confirmed receiving the payment.',
        icon: '/logo192.png',
        tag: `settlement-confirmed-${expenseId}`
      });
      return;
    }

    await self.registration.showNotification('Not confirmed', {
      body: 'You marked this payment as not received yet.',
      icon: '/logo192.png',
      tag: `settlement-pending-${expenseId}`
    });
  } catch (error) {
    console.error('Error in settlement confirmation:', error);
    await self.registration.showNotification('MilBantKar', {
      body: 'Something went wrong. Please open the app.',
      icon: '/logo192.png'
    });
    return openApp();
  }
}

// Open app
function openApp() {
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      if ('focus' in client) {
        client.navigate('/history');
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/history');
    }
  });
}

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
