self.addEventListener('install', () => {
  console.log('Service worker sedang dipasang...');
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

  const title = payload.title || 'Pengingat tugas Taskwell';
  const options = {
    body: payload.body || 'Ada tugas yang harus segera dikerjakan.',
    data: { url: './index.php' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => 'focus' in client);
      if (existingClient) {
        return existingClient.focus();
      }

      return self.clients.openWindow(event.notification.data.url);
    }),
  );
});
