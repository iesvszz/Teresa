// TERESA v2: retire the old service worker.
// The previous worker pre-cached development paths (/src/*.jsx) under a fixed
// cache name, which could serve stale pages after a deploy. This worker clears
// those caches and unregisters itself. No new caching is installed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
