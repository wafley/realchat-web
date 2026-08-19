self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

function buildUrl(data) {
  const conversationId = data && (data.conversationId || data.data?.conversationId);
  if (!conversationId) return '/';
  const type = data && (data.type || data.data?.type);
  return type === 'group' ? `/chat/${conversationId}` : `/dm/${conversationId}`;
}

self.addEventListener('push', (event) => {
  let payload = { title: 'Hallo Wok', body: '', icon: '/favicon.svg', badge: '/favicon.svg', url: '/' };
  try {
    const parsed = event.data?.json();
    if (parsed) {
      const notification = parsed.notification || {};
      const data = parsed.data || {};
      const raw = { ...parsed, notification, data };
      payload = {
        ...payload,
        title: notification.title || data.senderName || payload.title,
        body: notification.body || data.body || data.content || payload.body,
        url: buildUrl(raw),
      };
    }
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const matching = windowClients.find((c) => c.url.includes(url) && 'focus' in c);
      if (matching) return matching.focus();
      return clients.openWindow(url);
    }),
  );
});
