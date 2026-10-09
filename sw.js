self.addEventListener('install', (event) => {
  console.log('Service worker sedang dipasang...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service worker sedang diaktifkan...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  if (!payload || typeof payload !== 'object') payload = {};
  const title = payload.title || 'Pengingat tugas Taskwell';
  const options = {
    body: payload.body || 'Ada tugas yang harus segera dikerjakan.',
    tag: payload.tag || 'taskwell-push-notification',
    data: { url: payload.url || './index.html' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      let targetUrl = new URL(event.notification.data?.url || './index.html', self.registration.scope);
      if (targetUrl.origin !== self.location.origin) {
        targetUrl = new URL('./index.html', self.registration.scope);
      }

      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin) && 'focus' in client);
      if (existingClient) {
        if ('navigate' in existingClient) await existingClient.navigate(targetUrl.href);
        return existingClient.focus();
      }

      return self.clients.openWindow(targetUrl.href);
    }),
  );
});
