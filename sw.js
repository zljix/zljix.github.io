// Retire the former root-scoped zljixOS worker; keep this URL for old installs.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const rootScope = new URL('/', self.location.origin).href;
    if (self.registration.scope !== rootScope) return;
    const legacyPrefix = 'orbit-mobile:' + rootScope + ':';
    for (const name of await caches.keys()) {
      if (name.startsWith(legacyPrefix)) await caches.delete(name);
    }
    // Do not claim or navigate tabs: a lesson may still be in progress.
    // Never touch localStorage, IndexedDB, SISgame or /zljixOS/ caches.
    await self.registration.unregister();
  })());
});
